import * as cdk from 'aws-cdk-lib';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


interface EcomerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction;
  productsAdminHandler: lambdaNodeJS.NodejsFunction;
  // productsCreateHandler: lambdaNodeJS.NodejsFunction;
  // productsUpdateHandler: lambdaNodeJS.NodejsFunction;
  // productsDeleteHandler: lambdaNodeJS.NodejsFunction;
  // productsGetByIdHandler: lambdaNodeJS.NodejsFunction;
}

export class EcomerceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcomerceApiStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, 'EcommerceApiLogGroup')

    const api = new apigateway.RestApi(this, 'EcommerceApi', {
      restApiName: "EcommerceApi",
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        })
      }
    })

    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

    // GET /products
    const productsResource = api.root.addResource('products')
    productsResource.addMethod('GET', productsFetchIntegration)

    // GET /products/{id}
    const productIdResource = productsResource.addResource('{id}')
    productIdResource.addMethod('GET', productsFetchIntegration)

    // POST /products/
    productsResource.addMethod('POST', productsAdminIntegration)

    // PUT /products/{id}
    productIdResource.addMethod('PUT', productsAdminIntegration)

    // DELETE /products/{id}
    productIdResource.addMethod('DELETE', productsAdminIntegration)
  }
}
