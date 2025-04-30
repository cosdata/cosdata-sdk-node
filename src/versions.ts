import { Client } from './client';

export interface Version {
  hash: string;
  version_number: number;
  timestamp: number;
  vector_count: number;
}

export class Versions {
  private client: Client;
  private collectionName: string;

  constructor(client: Client, collectionName: string) {
    this.client = client;
    this.collectionName = collectionName;
  }

  /**
   * Get the current version of the collection.
   * 
   * @returns Promise that resolves to the current version information
   */
  public async getCurrent(): Promise<Version> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions/current`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to get current version: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * List all versions of the collection.
   * 
   * @returns Promise that resolves to an array of version information
   */
  public async list(): Promise<Version[]> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to list versions: ${JSON.stringify(response.data)}`);
    }
    
    return response.data.versions;
  }

  /**
   * Get a specific version by its hash.
   * 
   * @param versionHash - Hash of the version to retrieve
   * @returns Promise that resolves to the version information
   */
  public async get(versionHash: string): Promise<Version> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions/${versionHash}`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to get version: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }
} 