import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Collection } from './collection';
import { Auth } from './auth';

interface DenseVectorConfig {
  enabled: boolean;
  dimension: number;
  auto_create_index?: boolean;
}

interface SparseVectorConfig {
  enabled: boolean;
  auto_create_index?: boolean;
}

interface TFIDFOptions {
  enabled: boolean;
}

interface CollectionConfig {
  max_vectors: number | null;
  replication_factor: number | null;
}

interface CreateCollectionOptions {
  name: string;
  dimension?: number;
  description?: string;
  dense_vector?: DenseVectorConfig;
  sparse_vector?: SparseVectorConfig;
  tf_idf_options?: TFIDFOptions;
  store_raw_text?: boolean;
}

/**
 * Main client for interacting with the Vector Database API.
 */
export class Client {
  private host: string;
  private baseUrl: string;
  private auth: Auth;
  private verifySSL: boolean;
  private axiosInstance: AxiosInstance;

  /**
   * Initialize the Vector DB client.
   * 
   * @param options - Client configuration options
   * @param options.host - Host URL of the Vector DB server
   * @param options.username - Username for authentication
   * @param options.password - Password for authentication
   * @param options.verifySSL - Whether to verify SSL certificates
   */
  constructor({
    host = 'http://127.0.0.1:8443',
    username = 'admin',
    password = 'admin',
    verifySSL = false
  }: {
    host?: string;
    username?: string;
    password?: string;
    verifySSL?: boolean;
  } = {}) {
    this.host = host;
    this.baseUrl = `${host}/vectordb`;
    this.verifySSL = verifySSL;
    this.auth = new Auth(username, password);
    this.auth.setClientInfo(host, verifySSL);

    this.axiosInstance = axios.create({
      validateStatus: () => true,
    });
  }

  /**
   * Get the base URL for API requests.
   * 
   * @returns The base URL string
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the Axios instance used for HTTP requests.
   * 
   * @returns The Axios instance
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get whether SSL verification is enabled.
   * 
   * @returns Boolean indicating whether SSL verification is enabled
   */
  public getVerifySSL(): boolean {
    return this.verifySSL;
  }

  /**
   * Generate request headers with authentication token if available.
   * 
   * @returns Dictionary of HTTP headers
   */
  public getHeaders(): Record<string, string> {
    return this.auth.getHeaders();
  }

  /**
   * Ensure the client is authenticated before making API calls.
   * 
   * @returns Promise that resolves when authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    await this.auth.ensureAuthenticated();
  }

  /**
   * Get a collection by name.
   * 
   * @param name - Name of the collection
   * @returns Collection object for the requested collection
   */
  public collection(name: string): Promise<Collection> {
    return this.getCollection(name);
  }

  /**
   * Create a new collection (database) for vectors.
   * 
   * @param options - Collection creation options
   * @returns Collection object for the newly created collection
   */
  public async createCollection({
    name,
    dimension = 1024,
    description,
    dense_vector,
    sparse_vector,
    tf_idf_options,
    store_raw_text = false
  }: CreateCollectionOptions): Promise<Collection> {
    await this.ensureAuthenticated();
    
    const url = `${this.baseUrl}/collections`;
    const data = {
      name,
      description,
      dense_vector: dense_vector || {
        enabled: true,
        dimension,
        auto_create_index: false
      },
      sparse_vector: sparse_vector || {
        enabled: false,
        auto_create_index: false
      },
      tf_idf_options: tf_idf_options || {
        enabled: false
      },
      config: {
        max_vectors: null,
        replication_factor: null
      },
      store_raw_text
    };
    
    const response = await this.axiosInstance.post(url, data, {
      headers: this.getHeaders(),
      httpsAgent: this.verifySSL ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create collection: ${JSON.stringify(response.data)}`);
    }
    
    return new Collection(this, name, dimension);
  }

  /**
   * Get an existing collection.
   * 
   * @param collectionName - Name of the collection to retrieve
   * @returns Collection object for the requested collection
   */
  public async getCollection(collectionName: string): Promise<Collection> {
    await this.ensureAuthenticated();
    
    const url = `${this.baseUrl}/collections/${collectionName}`;
    
    const response = await this.axiosInstance.get(url, {
      headers: this.getHeaders(),
      httpsAgent: this.verifySSL ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to get collection: ${JSON.stringify(response.data)}`);
    }
    
    const collectionInfo = response.data;
    const dimension = collectionInfo?.dense_vector?.dimension || 1024;
    
    return new Collection(this, collectionName, dimension);
  }

  /**
   * Retrieve a list of all collections in the vector database.
   * 
   * @returns HTTP response object containing the list of collections.
   */
  public async listCollections(): Promise<any> {
    await this.ensureAuthenticated();
    
    const response = await this.axiosInstance.get(`${this.baseUrl}/collections`, {
      headers: this.getHeaders(),
      httpsAgent: this.verifySSL ? undefined : { rejectUnauthorized: false }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list collections: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Iterator over all collections.
   * 
   * @returns Array of Collection objects
   */
  public async collections(): Promise<Collection[]> {
    const collectionsData = await this.listCollections();
    
    return (collectionsData.collections || []).map((collectionData: any) => {
      const name = collectionData.name;
      const dimension = collectionData?.dense_vector?.dimension || 1024;
      return new Collection(this, name, dimension);
    });
  }
} 