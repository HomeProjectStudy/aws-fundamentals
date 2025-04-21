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
  } else if (event.resource === "/products/{id}" && event.httpMethod === "PUT") {
    const id = event.pathParameters!.id as string
    const product = JSON.parse(event.body!) as Product

    try {
      const productUpdated = await productsRepository.updateProduct(id, product)
      const response = await sendProductEvent(productUpdated,
        ProductEventType.UPDATED,
        "testeUPDATED@teste.com",
        lambdaRequestId
      )
      console.log(`Event sent to product events function UPDATED: ${JSON.stringify(response)}`)
      return {
        statusCode: 200,
        body: JSON.stringify(productUpdated),
      }
    } catch (ConditionalCheckFailedException) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Product not found'
        }),
      }

    }

  } else if (event.resource === "/products/{id}" && event.httpMethod === "DELETE") {
    const id = event.pathParameters!.id as string
    try {
      const product = await productsRepository.deleteProduct(id)
      const response = await sendProductEvent(product,
        ProductEventType.DELETED,
        "testeDELETED@teste.com",
        lambdaRequestId
      )
      console.log(`Event sent to product events function DELETED: ${JSON.stringify(response)}`)
      return {
        statusCode: 200,
        body: JSON.stringify(product),
      }

    } catch (error) {
      console.error((<Error>error).message)
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: (<Error>error).message
        }),
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
