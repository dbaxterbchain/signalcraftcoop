import * as cdk from 'aws-cdk-lib';
import {
  aws_apigatewayv2 as apigw,
  aws_apigatewayv2_integrations as apigwIntegrations,
  aws_ec2 as ec2,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_secretsmanager as secretsmanager,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';
import { StageConfig } from '../config';

export type ApiLambdaStackProps = cdk.StackProps & {
  config: StageConfig;
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
    domain: string;
  };
};

export class ApiLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiLambdaStackProps) {
    super(scope, id, props);

    const repoRoot = path.resolve(__dirname, '../../..');

    const webOrigin = new cdk.CfnParameter(this, 'WebOrigin', {
      type: 'String',
      description: 'Allowed web origin for CORS',
      default: `https://${props.config.webDomain}`,
    });

    const dbHost = props.dbSecret.secretValueFromJson('host').toString();
    const dbPort = props.dbSecret.secretValueFromJson('port').toString();
    const dbName = props.dbSecret.secretValueFromJson('dbname').toString();
    const dbUser = props.dbSecret.secretValueFromJson('username').toString();
    const dbPassword = props.dbSecret.secretValueFromJson('password').toString();

    const logGroup = new logs.LogGroup(this, 'ApiLambdaLogs', {
      retention:
        props.config.name === 'prod'
          ? logs.RetentionDays.ONE_MONTH
          : logs.RetentionDays.ONE_WEEK,
    });

    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      code: lambda.Code.fromAsset(repoRoot, {
        assetHashType: cdk.AssetHashType.CUSTOM,
        assetHash: 'lambda-bundle-no-bin-links-v1',
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            [
              'cd /asset-input/api',
              'mkdir -p /tmp/npm-cache',
              'chmod -R 777 /tmp/npm-cache',
              'NPM_CONFIG_CACHE=/tmp/npm-cache npm ci',
              'DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma?schema=public npx prisma generate --schema=prisma/schema.prisma',
              'npm run build',
              'NPM_CONFIG_CACHE=/tmp/npm-cache npm prune --omit=dev',
              'mkdir -p /asset-output/certs',
              'cp certs/rds-ca.pem /asset-output/certs/rds-ca.pem',
              'cp -R dist /asset-output/dist',
              'cp -R node_modules /asset-output/node_modules',
              'find /asset-output/node_modules -type l -delete',
              'rm -rf /asset-output/node_modules/prisma',
              'rm -rf /asset-output/node_modules/@prisma/engines',
              'rm -rf /asset-output/node_modules/@prisma/engines-version',
              'rm -rf /asset-output/node_modules/@prisma/fetch-engine',
              'rm -rf /asset-output/node_modules/.bin',
            ].join(' && '),
          ],
        },
      }),
      handler: 'dist/src/lambda.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: props.config.name === 'prod' ? 1024 : 768,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      logGroup,
      environment: {
        NODE_ENV: props.config.name,
        COGNITO_REGION: props.config.region,
        COGNITO_USER_POOL_ID: props.cognito.userPoolId,
        COGNITO_CLIENT_ID: props.cognito.userPoolClientId,
        COGNITO_DOMAIN: props.cognito.domain,
        COGNITO_LOGOUT_URI: `https://${props.config.webDomain}/`,
        WEB_ORIGIN: webOrigin.valueAsString,
        DB_SSLMODE: 'verify-full',
        DB_SSL_REJECT_UNAUTHORIZED: 'true',
        DB_SSL_CA_PATH: '/var/task/certs/rds-ca.pem',
        PGSSLROOTCERT: '/var/task/certs/rds-ca.pem',
        NODE_EXTRA_CA_CERTS: '/var/task/certs/rds-ca.pem',
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_NAME: dbName,
        DB_USER: dbUser,
        DB_PASSWORD: dbPassword,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    const httpApi = new apigw.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowOrigins: [webOrigin.valueAsString],
        allowCredentials: true,
      },
    });

    const integration = new apigwIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiLambda,
    );

    httpApi.addRoutes({
      path: '/',
      methods: [apigw.HttpMethod.ANY],
      integration,
    });
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration,
    });

    new cdk.CfnOutput(this, 'ApiLambdaUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}
