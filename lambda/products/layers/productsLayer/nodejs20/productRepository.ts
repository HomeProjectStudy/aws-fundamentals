import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { v4 as uuid} from 'uuid'

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
  productUrl: string;
}

export class ProductRepository {
  private dynamoDb: DocumentClient;
  private tableName: string;
  
  constructor(dynamoDb: DocumentClient, tableName: string) {
    this.dynamoDb = dynamoDb;
    this.tableName = tableName;
  }

  async getAllProducts(): Promise<Product[]> {
    const params = {
      TableName: this.tableName,
    };

    const result = await this.dynamoDb.scan(params).promise();
    return result.Items as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
    };
    const result = await this.dynamoDb.get(params).promise();
    if(result.Item) {
      return result.Item as Product || null;
    } else {
      throw new Error(`Product with id ${id} not found`);
    }
  }

  async createProduct(product: Product): Promise<Product> {
    const newProduct = {
      ...product,
      id: uuid(),
    };

    const params = {
      TableName: this.tableName,
      Item: newProduct,
    };

    await this.dynamoDb.put(params).promise();
    return newProduct;
  }

  async deleteProduct(id: string): Promise<Product> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
      returnValues: 'ALL_OLD',
    };

    const data = await this.dynamoDb.delete(params).promise();
    if(data.Attributes){
      return data.Attributes as Product
    } else { 
      throw new Error(`Product with id ${id} not found`);
    }
  }

  async updateProduct(id: string, product: Product): Promise<Product> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression: 'set productName = :productName, code = :code, price = :price, model = :model, productUrl = :productUrl',
      ExpressionAttributeValues: {
        ':productName': product.productName,
        ':code': product.code,
        ':price': product.price,
        ':model': product.model,
        ':productUrl': product.productUrl,
      },
      ReturnValues: 'UPDATE_NEW',
    };

    const result = await this.dynamoDb.update(params).promise();
    return result.Attributes as Product;
  }
}