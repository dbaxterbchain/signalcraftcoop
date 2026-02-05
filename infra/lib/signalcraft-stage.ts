import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { stageConfigs, StageName } from './config';
import { NetworkStack } from './stacks/network-stack';
import { DataStack } from './stacks/data-stack';
import { ApiStack } from './stacks/api-stack';
import { ApiLambdaStack } from './stacks/api-lambda-stack';
import { CognitoStack } from './stacks/cognito-stack';
import { WebStack } from './stacks/web-stack';
import { WebCertificateStack } from './stacks/web-cert-stack';

export type SignalcraftStageProps = cdk.StageProps & {
  stageName: string;
};

export class SignalcraftStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: SignalcraftStageProps) {
    super(scope, id, props);

    const stageName = (props.stageName ?? 'staging') as StageName;
    const config = stageConfigs[stageName];

    const network = new NetworkStack(this, `${stageName}-network`, {
      env: props.env,
      config,
    });

    const data = new DataStack(this, `${stageName}-data`, {
      env: props.env,
      config,
      vpc: network.vpc,
    });

    const cognito = new CognitoStack(this, `${stageName}-cognito`, {
      env: props.env,
      config,
    });

    new ApiStack(this, `${stageName}-api`, {
      env: props.env,
      config,
      vpc: network.vpc,
      dbSecret: data.dbSecret,
      cognito,
    });

    const enableLambdaApi =
      this.node.tryGetContext('enableLambdaApi') === true ||
      this.node.tryGetContext('enableLambdaApi') === 'true';
    if (enableLambdaApi) {
      new ApiLambdaStack(this, `${stageName}-api-lambda`, {
        env: props.env,
        config,
        vpc: network.vpc,
        dbSecret: data.dbSecret,
        cognito,
      });
    }

    const webCertificate = new WebCertificateStack(
      this,
      `${stageName}-web-cert`,
      {
        env: { account: props.env?.account, region: 'us-east-1' },
        crossRegionReferences: true,
        config,
      },
    );

    new WebStack(this, `${stageName}-web`, {
      env: props.env,
      crossRegionReferences: true,
      config,
      certificateArn: webCertificate.certificate.certificateArn,
    });
  }
}
