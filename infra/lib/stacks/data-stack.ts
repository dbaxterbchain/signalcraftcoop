import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_rds as rds, aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export type DataStackProps = cdk.StackProps & {
  config: StageConfig;
  vpc: ec2.IVpc;
};

export class DataStack extends cdk.Stack {
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc,
      description: 'Signalcraft Postgres access',
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow Postgres within the VPC',
    );

    const instanceType =
      props.config.name === 'prod'
        ? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL)
        : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO);

    const database = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_11,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType,
      allocatedStorage: props.config.dbAllocatedStorage,
      maxAllocatedStorage: props.config.dbAllocatedStorage + 20,
      backupRetention: cdk.Duration.days(props.config.dbBackupRetentionDays),
      deletionProtection: props.config.dbDeletionProtection,
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      databaseName: props.config.dbName,
      securityGroups: [dbSecurityGroup],
      publiclyAccessible: false,
      removalPolicy:
        props.config.name === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    if (!database.secret) {
      throw new Error('Database secret not created');
    }

    this.dbSecret = database.secret;

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: database.dbInstanceEndpointAddress,
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: database.secret?.secretArn ?? 'missing',
    });
  }
}
