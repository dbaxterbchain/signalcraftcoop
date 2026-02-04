import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager as acm,
  aws_ec2 as ec2,
  aws_ecr as ecr,
  aws_ecs as ecs,
  aws_ecs_patterns as ecsPatterns,
  aws_elasticloadbalancingv2 as elbv2,
  aws_logs as logs,
  aws_route53 as route53,
  aws_route53_targets as route53Targets,
  aws_secretsmanager as secretsmanager,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export type ApiStackProps = cdk.StackProps & {
  config: StageConfig;
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
    domain: string;
  };
};

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const imageTag = this.node.tryGetContext('apiImageTag') ?? 'latest';

    const webOrigin = new cdk.CfnParameter(this, 'WebOrigin', {
      type: 'String',
      description: 'Allowed web origin for CORS',
      default: `https://${props.config.webDomain}`,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
    });

    const repo = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `signalcraft-api-${props.config.name}`,
      imageScanOnPush: true,
    });

    const logGroup = new logs.LogGroup(this, 'ApiLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'ApiService',
      {
        cluster,
        cpu: props.config.name === 'prod' ? 512 : 256,
        memoryLimitMiB: props.config.name === 'prod' ? 1024 : 512,
        desiredCount: props.config.name === 'prod' ? 2 : 1,
        publicLoadBalancer: true,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repo, imageTag),
          containerPort: 3000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'api',
            logGroup,
          }),
          environment: {
            NODE_ENV: props.config.name,
            PORT: '3000',
            COGNITO_REGION: props.config.region,
            COGNITO_USER_POOL_ID: props.cognito.userPoolId,
            COGNITO_CLIENT_ID: props.cognito.userPoolClientId,
            COGNITO_DOMAIN: props.cognito.domain,
            COGNITO_LOGOUT_URI: `https://${props.config.webDomain}/`,
            WEB_ORIGIN: webOrigin.valueAsString,
            DB_SSLMODE: 'verify-full',
            DB_SSL_REJECT_UNAUTHORIZED: 'true',
            DB_SSL_CA_PATH: '/app/certs/rds-ca.pem',
          },
          secrets: {
            DB_HOST: ecs.Secret.fromSecretsManager(props.dbSecret, 'host'),
            DB_PORT: ecs.Secret.fromSecretsManager(props.dbSecret, 'port'),
            DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'dbname'),
            DB_USER: ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
            DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
          },
        },
      },
    );

    service.targetGroup.configureHealthCheck({
      path: '/',
    });

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.config.zoneId,
        zoneName: props.config.zoneName,
      },
    );

    const certificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: props.config.apiDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const httpsListener = service.loadBalancer.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
    });

    httpsListener.addTargets('HttpsTargets', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service.service],
      healthCheck: {
        path: '/',
      },
    });

    service.listener.addAction('HttpRedirect', {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      action: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      zone,
      recordName: props.config.apiDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(service.loadBalancer),
      ),
    });

    new route53.AaaaRecord(this, 'ApiAliasRecordV6', {
      zone,
      recordName: props.config.apiDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(service.loadBalancer),
      ),
    });

    new cdk.CfnOutput(this, 'ApiLoadBalancerDns', {
      value: service.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: repo.repositoryUri,
    });

    new cdk.CfnOutput(this, 'ApiDomain', {
      value: `https://${props.config.apiDomain}`,
    });
  }
}
