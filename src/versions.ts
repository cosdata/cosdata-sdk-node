import { Client } from './client';

/**
 * Represents a version of a collection
 */
export interface Version {
  hash: string;
  version_number: number;
  timestamp: number;
  vector_count: number;
}

/**
 * Response from listing versions
 */
export interface ListVersionsResponse {
  versions: Version[];
  current_hash: string;
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
   * @throws {Error} If the collection is not found (404) or there's a server error (500)
   */
  public async getCurrent(): Promise<Version> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions/current`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status === 404) {
      throw new Error(`Collection not found: ${this.collectionName}`);
    }
    
    if (response.status === 400) {
      throw new Error(`Invalid version hash: ${JSON.stringify(response.data)}`);
    }
    
    if (response.status !== 200) {
      throw new Error(`Failed to get current version: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * List all versions of the collection.
   * 
   * @returns Promise that resolves to an object containing versions array and current hash
   * @throws {Error} If the collection is not found (404) or there's a server error (500)
   */
  public async list(): Promise<ListVersionsResponse> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status === 404) {
      throw new Error(`Collection not found: ${this.collectionName}`);
    }
    
    if (response.status !== 200) {
      throw new Error(`Failed to list versions: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Get a specific version by its hash.
   * 
   * @param versionHash - Hash of the version to retrieve
   * @returns Promise that resolves to the version information
   * @throws {Error} If the collection is not found (404), invalid version hash (400), or there's a server error (500)
   */
  public async get(versionHash: string): Promise<Version> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions/${versionHash}`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status === 404) {
      throw new Error(`Collection not found: ${this.collectionName}`);
    }
    
    if (response.status === 400) {
      throw new Error(`Invalid version hash: ${versionHash}`);
    }
    
    if (response.status !== 200) {
      throw new Error(`Failed to get version: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Get a specific version by its hash.
   * 
   * @param versionHash - Hash of the version to retrieve
   * @returns Promise that resolves to the version information
   * @throws {Error} If the collection is not found (404), invalid version hash (400), or there's a server error (500)
   */
  public async getByHash(versionHash: string): Promise<Version> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/versions/${versionHash}`;
    const response = await this.client.getAxiosInstance().get(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status === 404) {
      throw new Error(`Collection not found: ${this.collectionName}`);
    }
    
    if (response.status === 400) {
      throw new Error(`Invalid version hash: ${versionHash}`);
    }
    
    if (response.status !== 200) {
      throw new Error(`Failed to get version: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }
} 