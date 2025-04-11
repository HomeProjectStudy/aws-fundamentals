import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(`API Gateway Request ID: ${apiRequestId} - Lambda Request ID: ${lambdaRequestId}`);


  if (event.resource === "/products" && event.httpMethod === "POST") {
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "POST /products ",
      }),
    }
  } else if (event.resource === "/products/{id}" && event.httpMethod === "PUT") {
    const id = event.pathParameters!.id as string
    console.log(`GET request for product with ID: ${id}`)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `PUT /products${id} `,
      }),
    }
  } else if (event.resource === "/products/{id}" && event.httpMethod === "DELETE") {
    const id = event.pathParameters!.id as string
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `DELETE /products${id} `,
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