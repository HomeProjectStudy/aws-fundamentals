#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack'
import { EcomerceApiStack } from '../lib/ecommerceApi-stack'
import { ProductsAppLayersStack } from '../lib/productsAppLayers-stack'
import { EventsDynamoDdbStack } from '../lib/eventsDynamodb-stack'
import { Order } from '../lib/ordersApp-stack'
import { OrdersAppLayersStack } from '../lib/ordersAppLayers-stack'
const app = new cdk.App();

const env: cdk.Environment = {
  account: "442754113624",
  region: "us-east-1",
}

const tags = {
  cost: "ecommerce",
  team: "GJ",
}
const productsAppLayersStack = new ProductsAppLayersStack(app, "ProductsAppLayersStack", {
  tags,
  env
})

const eventsDynamoDbStack = new EventsDynamoDdbStack(app, 'EventsDynamoDBStack', {
  tags,
  env
})
const productsAppStack = new ProductsAppStack(app, 'ProductsAppStack', {
  tags,
  env,
  eventsDynamoDBTable: eventsDynamoDbStack.table,
})

productsAppStack.addDependency(productsAppLayersStack)

const ordersAppLayersStack = new OrdersAppLayersStack(app, "OrdersAppLayers", {
  tags,
  env 
})

const ordersAppStack = new Order(app, 'OrdersApp', {
  tags,
  env,
  ProductsTable: productsAppStack.productsTable,
})
ordersAppStack.addDependency(productsAppStack)
ordersAppStack.addDependency(ordersAppLayersStack)

const ecommerceApiStack = new EcomerceApiStack(app, 'EcommerceApiStack', {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags,
  env,
  ordersHandler: ordersAppStack.ordersHandler,
})
ecommerceApiStack.addDependency(productsAppStack)
ecommerceApiStack.addDependency(ordersAppStack)