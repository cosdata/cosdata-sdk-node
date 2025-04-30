import { Client } from './client';
import { Collection } from './collection';
import { Transaction } from './transaction';

type IndexType = 'dense' | 'sparse' | 'tf_idf';

/**
 * Class for managing indexes in the vector database.
 */
export class Index {
  private client: Client;
  private collection: Collection;
  public name: string;
  private indexType: IndexType;

  /**
   * Initialize an Index object.
   * 
   * @param client - Client instance
   * @param collection - Collection object this index belongs to
   * @param name - Name of the index
   * @param indexType - Type of index (dense, sparse, or tf_idf)
   */
  constructor(client: Client, collection: Collection, name: string, indexType: IndexType = 'dense') {
    this.client = client;
    this.collection = collection;
    this.name = name;
    this.indexType = indexType;
  }

  /**
   * Create a new transaction for this index.
   * 
   * @returns Transaction object
   */
  public createTransaction(): Transaction {
    return new Transaction(this.client, this.collection.name);
  }

  /**
   * Create a transaction with context management.
   * 
   * This allows for automatic commit on success or abort on exception.
   * 
   * Example:
   * ```typescript
   * await index.transaction(async (txn) => {
   *   await txn.upsert(vectors);
   *   // Auto-commits on exit or aborts on exception
   * });
   * ```
   * 
   * @param callback - Function to execute within the transaction
   * @returns Promise that resolves when the transaction is complete
   */
  public async transaction<T>(callback: (txn: Transaction) => Promise<T>): Promise<T> {
    const txn = this.createTransaction();
    try {
      const result = await callback(txn);
      await txn.commit();
      return result;
    } catch (error) {
      await txn.abort();
      throw error;
    }
  }

  /**
   * Search for nearest neighbors of a vector.
   * 
   * @param options - Query options
   * @param options.vector - Vector to search for similar vectors
   * @param options.nnCount - Number of nearest neighbors to return
   * @returns Search results
   */
  public async query({
    vector,
    nnCount = 5
  }: {
    vector: number[];
    nnCount?: number;
  }): Promise<any> {
    const url = `${this.client.getBaseUrl()}/search`;
    const data = {
      vector_db_name: this.collection.name,
      vector,
      nn_count: nnCount
    };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Failed to search vector: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Fetch a specific vector by ID.
   * 
   * @param vectorId - ID of the vector to fetch
   * @returns Vector data
   */
  public async fetchVector(vectorId: string | number): Promise<any> {
    const url = `${this.client.getBaseUrl()}/fetch`;
    const data = {
      vector_db_name: this.collection.name,
      vector_id: vectorId
    };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch vector: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Delete this index.
   * 
   * @returns Promise that resolves when the index is deleted
   */
  public async delete(): Promise<void> {
    const url = `${this.client.getBaseUrl()}/collections/${this.collection.getName()}/indexes/${this.indexType}`;
    
    const response = await this.client.getAxiosInstance().delete(
      url,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 204) {
      throw new Error(`Failed to delete index: ${JSON.stringify(response.data)}`);
    }
  }
} 