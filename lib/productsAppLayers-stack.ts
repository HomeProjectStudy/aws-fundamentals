import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import { Construct } from 'constructs'


export class ProductsAppLayersStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create a Lambda layer
    const productsLayers = new lambda.LayerVersion(this, 'ProductsLayer', {
      code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
      layerVersionName: 'ProductsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      description: 'A layer to share code between Lambda functions',
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      license: 'MIT',
    })
    new ssm.StringParameter(this, 'ProductsLayerVersionArn', {
      parameterName: 'ProductsLayerVersionArn',
      stringValue: productsLayers.layerVersionArn,
      description: 'The ARN of the Products Layer version',
    })

    const productEventsLayers = new lambda.LayerVersion(
      this,
      "ProductEventsLayer",
      {
        code: lambda.Code.fromAsset(
          "lambda/products/layers/productEventsLayer"
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        layerVersionName: "ProductEventsLayer",
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    new ssm.StringParameter(this, "ProductEventsLayerVersionArn", {
      parameterName: "ProductEventsLayerVersionArn",
      stringValue: productEventsLayers.layerVersionArn,
    });
  }
}