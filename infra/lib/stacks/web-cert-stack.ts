import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager as acm,
  aws_route53 as route53,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export type WebCertificateStackProps = cdk.StackProps & {
  config: StageConfig;
};

export class WebCertificateStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: WebCertificateStackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.config.zoneId,
        zoneName: props.config.zoneName,
      },
    );

    const certificate = new acm.Certificate(this, 'WebCertificate', {
      domainName: props.config.webDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    this.certificate = certificate;

    new cdk.CfnOutput(this, 'WebCertificateArn', {
      value: certificate.certificateArn,
    });
  }
}
