# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

"devDependencies": {
		"@types/aws-lambda": "^8.10.125",
		"aws-sdk": "^2.1485.0",
		"@types/jest": "^29.5.5",
		"@types/node": "20.7.1",
		"@types/uuid": "^9.0.6",
		"aws-cdk": "2.114.1",
		"@aws-cdk/aws-apigatewayv2-alpha": "^2.114.1-alpha.0",
		"@aws-cdk/aws-apigatewayv2-integrations-alpha": "^2.114.1-alpha.0",
		"jest": "^29.7.0",
		"ts-jest": "^29.1.1",
		"ts-node": "^10.9.1",
		"typescript": "~5.2.2"
	},
	"dependencies": {
		"aws-xray-sdk": "^3.5.3",
		"aws-cdk-lib": "2.114.1",
		"constructs": "^10.0.0",
		"source-map-support": "^0.5.21"
	}