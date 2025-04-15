import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb'


export class EventsDynamoDdbtack extends cdk.Stack {
  readonly table: dynamoDB.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope, id, props);

    this.table = new dynamoDB.Table(this, 'EventsTable', {
      tableName:'EventsTable',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey:{
        name: 'pk',
        type: dynamoDB.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamoDB.AttributeType.STRING,
      },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamoDB.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })
  }
}