import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ProductRepository } from "/opt/nodejs20/productsLayer";
import { DynamoDB } from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

AWSXRay.captureAWS(require('aws-sdk'));
const productsDynamo = process.env.TABLE_NAME!
const dynamoClient = new DynamoDB.DocumentClient()
const productsRepository = new ProductRepository(dynamoClient, productsDynamo)


export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(`API Gateway Request ID: ${apiRequestId} - Lambda Request ID: ${lambdaRequestId}`);


  if (event.resource === "/products" && event.httpMethod === "GET") {
    try {
      const products = await productsRepository.getAllProducts()

      return {
        statusCode: 200,
        body: JSON.stringify(products),
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

  } else if (event.resource === "/products/{id}" && event.httpMethod === "GET") {
    const id = event.pathParameters!.id as string

    try {
      const product = await productsRepository.getProductById(id)
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