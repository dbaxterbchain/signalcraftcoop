export type StageName = 'staging' | 'prod';

export type StageConfig = {
  name: StageName;
  zoneName: string;
  zoneId: string;
  webDomain: string;
  apiDomain: string;
  region: string;
  natGateways: number;
  dbName: string;
  dbAllocatedStorage: number;
  dbBackupRetentionDays: number;
  dbDeletionProtection: boolean;
  allowMockPayments: boolean;
};

export const stageConfigs: Record<StageName, StageConfig> = {
  staging: {
    name: 'staging',
    zoneName: 'signalcraftcoop.com',
    zoneId: 'Z09892993TR3DJNYURCX2',
    webDomain: 'staging.app.signalcraftcoop.com',
    apiDomain: 'staging.api.signalcraftcoop.com',
    region: 'us-west-2',
    natGateways: 0,
    dbName: 'signalcraft',
    dbAllocatedStorage: 20,
    dbBackupRetentionDays: 1,
    dbDeletionProtection: false,
    allowMockPayments: true,
  },
  prod: {
    name: 'prod',
    zoneName: 'signalcraftcoop.com',
    zoneId: 'Z09892993TR3DJNYURCX2',
    webDomain: 'app.signalcraftcoop.com',
    apiDomain: 'api.signalcraftcoop.com',
    region: 'us-west-2',
    natGateways: 1,
    dbName: 'signalcraft',
    dbAllocatedStorage: 50,
    dbBackupRetentionDays: 7,
    dbDeletionProtection: true,
    allowMockPayments: false,
  },
};
