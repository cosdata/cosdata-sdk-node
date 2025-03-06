import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Collection } from './collection';

/**
 * Main client for interacting with the Vector Database API.
 */
export class Client {
  private host: string;
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: string = '';
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
    this.username = username;
    this.password = password;
    this.verifySSL = verifySSL;

    this.axiosInstance = axios.create({
      validateStatus: () => true, // Don't throw HTTP errors, we'll handle them
    });

    // We don't call login() in the constructor anymore
    // It will be called automatically when needed
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
   * Authenticate with the server and obtain an access token.
   * 
   * @returns The access token string
   */
  public async login(): Promise<string> {
    const url = `${this.host}/auth/create-session`;
    const data = { username: this.username, password: this.password };
    
    const response = await this.axiosInstance.post(url, data, {
      headers: this.getHeaders(),
      httpsAgent: this.verifySSL ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Authentication failed: ${JSON.stringify(response.data)}`);
    }
    
    const session = response.data;
    this.token = session.access_token;
    return this.token;
  }

  /**
   * Generate request headers with authentication token if available.
   * 
   * @returns Dictionary of HTTP headers
   */
  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Ensure the client is authenticated before making API calls.
   * 
   * @returns Promise that resolves when authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.login();
    }
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
   * @param options.name - Name of the collection
   * @param options.dimension - Dimensionality of vectors to be stored
   * @param options.description - Optional description of the collection
   * @returns Collection object for the newly created collection
   */
  public async createCollection({
    name,
    dimension = 1024,
    description = undefined
  }: {
    name: string;
    dimension?: number;
    description?: string | undefined;
  }): Promise<Collection> {
    await this.ensureAuthenticated();
    
    const url = `${this.baseUrl}/collections`;
    const data = {
      name,
      description,
      dense_vector: {
        enabled: true,
        auto_create_index: false,
        dimension,
      },
      sparse_vector: { enabled: false, auto_create_index: false },
      metadata_schema: null,
      config: { max_vectors: null, replication_factor: null },
    };
    
    const response = await this.axiosInstance.post(url, data, {
      headers: this.getHeaders(),
      httpsAgent: this.verifySSL ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create collection: ${JSON.stringify(response.data)}`);
    }
    
    // Return a Collection object for the newly created collection
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
    
    return collectionsData.map((collectionData: any) => {
      const name = collectionData.name;
      const dimension = collectionData?.dense_vector?.dimension || 1024;
      return new Collection(this, name, dimension);
    });
  }
} 