#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SignalcraftStage } from '../lib/signalcraft-stage';

const app = new cdk.App();
const stageName = app.node.tryGetContext('stage') ?? 'staging';
const account = app.node.tryGetContext('account') ?? process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') ?? 'us-west-2';

new SignalcraftStage(app, `signalcraft-${stageName}`, {
  env: { account, region },
  stageName,
});
