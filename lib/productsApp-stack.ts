import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import { Construct } from 'constructs'

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDynamoDBTable: dynamoDB.Table;
}
export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJS.NodejsFunction;
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction;
  readonly productsTable: dynamoDB.Table;

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props);
    this.productsTable = new dynamoDB.Table(this, 'ProductsTable', {
      tableName: 'ProductsTable',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamoDB.AttributeType.STRING,
      },
      billingMode: dynamoDB.BillingMode.PROVISIONED,
      writeCapacity: 1,
      readCapacity: 1,
    });
    //Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn");
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayer', productsLayerArn);

    // Products Events Layer
    const productEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductEventsLayerVersionArn");
    const productEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductEventsLayer', productEventsLayerArn);



    // Create a events table for events products
    const productsEventsHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsEventsFunction', {
      functionName: 'ProductEventsFunction',
      entry: 'lambda/products/productsEventsFunction.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false,
        nodeModules: [
          'aws-xray-sdk-core'
        ]
      },
      environment: {
        EVENTS_DYNAMODB: props.eventsDynamoDBTable.tableName
      },
      layers: [productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
    });
    props.eventsDynamoDBTable.grantWriteData(productsEventsHandler);

    // Define a Lambda function
    this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsFetchFunction', {
      functionName: 'ProductsFetchFunction',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/products/productsFetchFunction.ts',
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false,
        nodeModules: [
          'aws-xray-sdk-core'
        ]
      },
      environment: {
        TABLE_NAME: this.productsTable.tableName,
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
    });

    // Grant permissions to the Lambda function to access DynamoDB
    this.productsTable.grantReadData(this.productsFetchHandler);


    this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsAdminFunction', {
      functionName: 'ProductsAdminFunction',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/products/productsAdminFunction.ts',
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false,
        nodeModules: [
          'aws-xray-sdk-core'
        ]
      },
      environment: {
        TABLE_NAME: this.productsTable.tableName,
        PRODUCT_EVENTS_FUNCTION_NAME: productsEventsHandler.functionName,
      },
      layers: [productsLayer, productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
    })

    this.productsTable.grantReadWriteData(this.productsAdminHandler);
    productsEventsHandler.grantInvoke(this.productsAdminHandler);
  }
}


