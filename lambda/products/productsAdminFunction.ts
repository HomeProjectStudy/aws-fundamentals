import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Product, ProductRepository } from "/opt/nodejs20/productsLayer";
import { DynamoDB, Lambda } from 'aws-sdk'
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";  
import * as AWSXRay from 'aws-xray-sdk'

AWSXRay.captureAWS(require('aws-sdk'));
const productsDynamo = process.env.TABLE_NAME!
const dynamoClient = new DynamoDB.DocumentClient()
const productsRepository = new ProductRepository(dynamoClient, productsDynamo)
const lambdaClient = new Lambda()
const productEventsFunctionName = process.env.PRODUCT_EVENTS_FUNCTION_NAME!

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(`API Gateway Request ID: ${apiRequestId} - Lambda Request ID: ${lambdaRequestId}`);


  if (event.resource === "/products" && event.httpMethod === "POST") {
    try {
      const product = JSON.parse(event.body!) as Product;

      const productCreated = await productsRepository.createProduct(product);
      const response = await sendProductEvent(productCreated,
        ProductEventType.CREATED,
        "testeCreated@teste.com",
        lambdaRequestId
      )
      console.log(`Event sent to product events function CREATED: ${JSON.stringify(response)}`)

      return {
        statusCode: 201,
        body: JSON.stringify(productCreated),
      };
    } catch (error) {
      console.error((<Error>error).message)
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: (<Error>error).message
        }),
      }
      
    }
  } else if (event.resource === "/products/{id}" ) {
    const productId = event.pathParameters!.id as string;
    if (event.httpMethod === "PUT") {
      console.log(`PUT /products/${productId}`);
      try {
        const product = JSON.parse(event.body!) as Product;
        const updatedProduct = await productsRepository.updateProduct(
          productId,
          product
        );

        const response = await sendProductEvent(
          updatedProduct,
          ProductEventType.UPDATED,
          "userUpdated@gmail.com",
          lambdaRequestId
        );

        console.log(response);

        return {
          statusCode: 200,
          body: JSON.stringify(updatedProduct),
        };
      } catch (ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: "Product not found",
          }),
        };
      }
    } else if (event.httpMethod === "DELETE") {
      console.log(`DELETE /products/${productId}`);
      try {
        const product = await productsRepository.deleteProduct(productId);
        const response = await sendProductEvent(
          product,
          ProductEventType.DELETED,
          "userDELETED@gmail.com",
          lambdaRequestId
        );

        console.log(response);
        return {
          statusCode: 200,
          body: JSON.stringify(product),
        };
      } catch (error) {
        console.error((<Error>error).message);
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: (<Error>error).message,
          }),
        };
      }
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Unsupported method",
      input: event,
    }),
  }
}

function sendProductEvent(
  product: Product,
  eventType: ProductEventType,
  email: string,
  lambdaRequestId: string
) {
  const event: ProductEvent = {
    email: email,
    eventType: eventType,
    productCode: product.code,
    productId: product.id,
    productPrice: product.price,
    requestId: lambdaRequestId,
  };

  return lambdaClient
    .invoke({
      FunctionName: productEventsFunctionName,
      Payload: JSON.stringify(event),
      InvocationType: "Event", //RequestResponse
    })
    .promise();
}
