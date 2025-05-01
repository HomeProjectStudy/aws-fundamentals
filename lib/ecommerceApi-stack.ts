import * as cdk from 'aws-cdk-lib';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


interface EcomerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction;
  productsAdminHandler: lambdaNodeJS.NodejsFunction;
  ordersHandler: lambdaNodeJS.NodejsFunction;
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

    this.createProductService(props, api);
    this.createOrdersService(props, api);
  }

  private createProductService(props: EcomerceApiStackProps, api: apigateway.RestApi) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler);
    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler);

    // GET /products
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', productsFetchIntegration);

    // GET /products/{id}
    const productIdResource = productsResource.addResource('{id}');
    productIdResource.addMethod('GET', productsFetchIntegration);

    // POST /products/
    productsResource.addMethod('POST', productsAdminIntegration);

    // PUT /products/{id}
    productIdResource.addMethod('PUT', productsAdminIntegration);

    // DELETE /products/{id}
    productIdResource.addMethod('DELETE', productsAdminIntegration);
  }

  private createOrdersService(props: EcomerceApiStackProps, api: apigateway.RestApi) {

    const ordersIntegration = new apigateway.LambdaIntegration(
      props.ordersHandler
    );
    const ordersResource = api.root.addResource("orders");

    ordersResource.addMethod(
      "GET",
      ordersIntegration,
    );

    ordersResource.addMethod(
      "POST",
      ordersIntegration,
    );
    
    const orderDeletionValidator = new apigateway.RequestValidator(this, 'OrderDeletionValidator', {
      restApi: api,
      requestValidatorName: 'OrderDeletionValidator',
      validateRequestParameters: true,
      validateRequestBody: false,
    })

    ordersResource.addMethod(
      "DELETE",
      ordersIntegration,
      {
        requestParameters: {
          "method.request.querystring.email": true,
          'method.request.querystring.orderId': true,
        },
        requestValidator: orderDeletionValidator
      }
    );

  }
}
