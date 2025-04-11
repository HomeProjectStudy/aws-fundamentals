import { APIGatewayProxyEvent,  APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;
  
  console.log(`API Gateway Request ID: ${apiRequestId} - Lambda Request ID: ${lambdaRequestId}`);
  

  if(event.resource === "/products" && event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from Products Fetch Function! GET",
      }),
    }
  } else if(event.resource === "/products/{id}" && event.httpMethod === "GET") {
    const id = event.pathParameters!.id as string
    console.log(`GET request for product with ID: ${id}`)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `GET /products/${id}`,
      }),
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