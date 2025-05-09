import { Callback, Context } from "aws-lambda";
import { ProductEvent } from "/opt/nodejs/productEventsLayer";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";

AWSXRay.captureAWS(require("aws-sdk"));

const eventsDdb = process.env.EVENTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

export async function handler(
  event: ProductEvent,
  context: Context,
  callback: Callback
): Promise<void> {
  console.log(event);
  console.log("Lambda requestId: ", context.awsRequestId);

  await createEvent(event);

  callback(
    null,
    JSON.stringify({
      productEventCreated: true,
      message: "OK",
    })
  );
}

function createEvent(event: ProductEvent) {
  const timeStamp = Date.now();
  const ttl = ~~(timeStamp / 1000) + 5 * 60;

  return ddbClient
    .put({
      TableName: eventsDdb,
      Item: {
        pk: `#product_${event.productCode}`,
        sk: `${event.eventType}#${timeStamp}`,
        email: event.email,
        createdAt: timeStamp,
        requestId: event.requestId,
        eventType: event.eventType,
        info: {
          productId: event.productId,
          productPrice: event.productPrice,
        },
        ttl: ttl,
      },
    })
    .promise();
}
