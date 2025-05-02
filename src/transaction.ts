import { Client } from './client';
import os from 'os';

/**
 * Interface for vector data
 */
export interface Vector {
  id: string | number;
  dense_values?: number[];
  sparse_values?: number[];
  sparse_indices?: number[];
  document_id: string;
  metadata?: Record<string, any>;
  text?: string;
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
  }

  /**
   * Create a new transaction.
   * 
   * @returns Transaction ID
   */
  private async _create(): Promise<string> {
    if (this.transactionId) {
      return this.transactionId;
    }

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
   * Upsert a single batch of vectors.
   * 
   * @param batch - List of vector objects to upsert
   */
  private async _upsert_batch(batch: Vector[]): Promise<void> {
    if (!this.transactionId) {
      await this._create();
    }
    
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
   * Insert or update a single vector in the transaction.
   * 
   * @param vector - Vector object to upsert
   */
  public async upsert_vector(vector: Vector): Promise<void> {
    await this._upsert_batch([vector]);
  }

  /**
   * Insert or update multiple vectors in the transaction.
   * 
   * @param vectors - List of vector objects to upsert
   * @param maxWorkers - Number of concurrent workers (default: os.cpus().length)
   * @param maxRetries - Number of times to retry a failed batch (default: 3)
   */
  public async batch_upsert_vectors(
    vectors: Vector[],
    maxWorkers: number = os.cpus().length,
    maxRetries: number = 3
  ): Promise<void> {
    await this._create();
    const batches: Vector[][] = [];
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      batches.push(vectors.slice(i, i + this.batchSize));
    }

    // Helper for retrying a batch
    const upsertWithRetry = async (batch: Vector[], batchIdx: number): Promise<void> => {
      let lastErr: any = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await this._upsert_batch(batch);
          return;
        } catch (err) {
          lastErr = err;
          await new Promise(res => setTimeout(res, 500 * attempt)); // Exponential backoff
        }
      }
      throw new Error(`Batch ${batchIdx} failed after ${maxRetries} retries: ${lastErr}`);
    };

    // Concurrency pool
    let idx = 0;
    const results: Promise<void>[] = [];
    const runNext = async (): Promise<void> => {
      if (idx >= batches.length) return;
      const myIdx = idx;
      idx++;
      await upsertWithRetry(batches[myIdx], myIdx);
      await runNext();
    };
    for (let i = 0; i < Math.min(maxWorkers, batches.length); i++) {
      results.push(runNext());
    }
    // Wait for all to finish
    await Promise.all(results);
  }

  /**
   * Commit the transaction.
   */
  public async commit(): Promise<void> {
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
    
    this.transactionId = null;
  }

  /**
   * Abort the transaction.
   */
  public async abort(): Promise<void> {
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
    
    this.transactionId = null;
  }
} 