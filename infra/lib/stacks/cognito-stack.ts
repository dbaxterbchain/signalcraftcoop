import * as cdk from 'aws-cdk-lib';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export type CognitoStackProps = cdk.StackProps & {
  config: StageConfig;
};

export class CognitoStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly domain: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `signalcraft-${props.config.name}-users`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.config.name === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    const callbackUrls = [
      `https://${props.config.webDomain}/auth/callback`,
      'http://localhost:5173/auth/callback',
    ];
    const logoutUrls = [
      `https://${props.config.webDomain}/`,
      'http://localhost:5173/',
    ];

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      generateSecret: false,
    });

    const domainPrefix = `signalcraft-${props.config.name}`;
    const domain = userPool.addDomain('UserPoolDomain', {
      cognitoDomain: { domainPrefix },
    });

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.domain = `https://${domain.domainName}.auth.${props.config.region}.amazoncognito.com`;

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: this.domain,
    });
  }
}
