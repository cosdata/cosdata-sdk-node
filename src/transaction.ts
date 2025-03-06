import { Client } from './client';

/**
 * Interface for vector data
 */
export interface Vector {
  id: string | number;
  values: number[];
  [key: string]: any;
}

/**
 * Class for managing transactions in the vector database.
 */
export class Transaction {
  private client: Client;
  private collectionName: string;
  private transactionId: string | null = null;
  private batchSize: number = 200; // Maximum vectors per batch

  /**
   * Initialize a Transaction object.
   * 
   * @param client - Client instance
   * @param collectionName - Name of the collection
   */
  constructor(client: Client, collectionName: string) {
    this.client = client;
    this.collectionName = collectionName;
    // We don't create the transaction immediately anymore
    // It will be created when needed
  }

  /**
   * Create a new transaction.
   * 
   * @returns Transaction ID
   */
  private async create(): Promise<string> {
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/transactions`;
    const data = { index_type: 'dense' };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create transaction: ${JSON.stringify(response.data)}`);
    }
    
    const result = response.data;
    this.transactionId = result.transaction_id;
    return this.transactionId as string;
  }

  /**
   * Ensure a transaction exists before performing operations.
   * 
   * @returns Promise that resolves when a transaction is available
   */
  private async ensureTransaction(): Promise<void> {
    if (!this.transactionId) {
      await this.create();
    }
  }

  /**
   * Upsert a single batch of vectors.
   * 
   * @param batch - List of vector objects to upsert
   */
  private async upsertBatch(batch: Vector[]): Promise<void> {
    await this.ensureTransaction();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/transactions/${this.transactionId}/upsert`;
    const data = { index_type: 'dense', vectors: batch };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Failed to upsert vectors: ${JSON.stringify(response.data)}`);
    }
  }

  /**
   * Upsert vectors into the transaction, automatically splitting into batches.
   * 
   * @param vectors - List of vector objects with 'id' and 'values' properties
   * @returns This transaction for method chaining
   */
  public async upsert(vectors: Vector[]): Promise<this> {
    // Split vectors into batches of batchSize
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const batch = vectors.slice(i, i + this.batchSize);
      await this.upsertBatch(batch);
    }
    
    return this;
  }

  /**
   * Commit the transaction.
   * 
   * @returns JSON response from the server or null
   */
  public async commit(): Promise<any> {
    if (!this.transactionId) {
      throw new Error('No active transaction to commit');
    }
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/transactions/${this.transactionId}/commit`;
    const data = { index_type: 'dense' };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Failed to commit transaction: ${JSON.stringify(response.data)}`);
    }
    
    const result = response.data || null;
    this.transactionId = null;
    return result;
  }

  /**
   * Abort the transaction.
   * 
   * @returns JSON response from the server or null
   */
  public async abort(): Promise<any> {
    if (!this.transactionId) {
      throw new Error('No active transaction to abort');
    }
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/transactions/${this.transactionId}/abort`;
    const data = { index_type: 'dense' };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Failed to abort transaction: ${JSON.stringify(response.data)}`);
    }
    
    const result = response.data || null;
    this.transactionId = null;
    return result;
  }
} 