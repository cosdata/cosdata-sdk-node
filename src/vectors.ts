import { Client } from './client';

export class Vectors {
  private client: Client;
  private collectionName: string;

  constructor(client: Client, collectionName: string) {
    this.client = client;
    this.collectionName = collectionName;
  }

  /**
   * Check if a vector exists in the collection.
   * 
   * @param vectorId - ID of the vector to check
   * @returns Promise that resolves to a boolean indicating if the vector exists
   */
  public async exists(vectorId: string): Promise<boolean> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/vectors/${vectorId}`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    return response.status === 200;
  }

  /**
   * Get a vector by ID.
   * 
   * @param vectorId - ID of the vector to retrieve
   * @returns Promise that resolves to the vector data
   */
  public async get(vectorId: string): Promise<any> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/vectors/${vectorId}`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to get vector: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Delete a vector by ID.
   * 
   * @param vectorId - ID of the vector to delete
   * @returns Promise that resolves when the vector is deleted
   */
  public async delete(vectorId: string): Promise<void> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/vectors/${vectorId}`;
    const response = await this.client.getAxiosInstance().delete(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to delete vector: ${JSON.stringify(response.data)}`);
    }
  }
} 