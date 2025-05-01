import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface OrdersAppStackProps extends cdk.StackProps {
  ProductsTable: dynamodb.Table;
  // eventsDdb: dynamodb.Table;
  // auditBus: events.EventBus;
}


export class Order extends cdk.Stack {
  readonly ordersHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props)

    const OrdersTable = new dynamodb.Table(this, "OrdersTable", {
      tableName: "orders",
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })

    // Orders Layer
    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersLayerVersionArn");
    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrdersLayerVersionArn', ordersLayerArn);

    // Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn");
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayer', productsLayerArn);

    this.ordersHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "OrdersFunction",
      {
        functionName: "OrdersFunction",
        entry: "lambda/orders/ordersFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          PRODUCTS_DDB: props.ProductsTable.tableName,
          ORDERS_DDB: OrdersTable.tableName,
          // ORDER_EVENTS_TOPIC_ARN: ordersTopic.topicArn,
          // AUDIT_BUS_NAME: props.auditBus.eventBusName,
        },
        layers: [
          ordersLayer,
          productsLayer,
          // ordersApiLayer,
          // orderEventsLayer,
          // authUserInfoLayer,
        ],
        runtime: lambda.Runtime.NODEJS_20_X,
        tracing: lambda.Tracing.ACTIVE,
        // insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0, // Cloud Watch Lambda Insights
      }
    );
    OrdersTable.grantReadWriteData(this.ordersHandler)  
    props.ProductsTable.grantReadData(this.ordersHandler);
  }

}