import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;
  
  console.log(`API Gateway Request ID: ${apiRequestId} - Lambda Request ID: ${lambdaRequestId}`);
  

  if(event.routeKey === "GET /products") {
    console.log('GET')
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from Products Fetch Function! GET",
        input: event,
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