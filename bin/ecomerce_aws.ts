#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack'
import { EcomerceApiStack } from '../lib/ecommerceApi-stack'

const app = new cdk.App();
const env: cdk.Environment = {
  account: "442754113624",
  region: "us-east-1",
}

const tags = {
  cost: "ecommerce",
  team: "GJ",
}

const productsAppStack = new ProductsAppStack(app, 'ProductsAppStack', {
  tags,
  env
})

const ecommerceApiStack = new EcomerceApiStack(app, 'EcommerceApiStack', {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  tags,
  env,
})
ecommerceApiStack.addDependency(productsAppStack)