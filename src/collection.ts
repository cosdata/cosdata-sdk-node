import { Client } from './client';
import { Index } from './index';
import { Vectors } from './vectors';
import { Versions } from './versions';
import { Transaction } from './transaction';
import { Search } from './search';

interface CreateIndexOptions {
  name?: string;
  distance_metric?: string;
  quantization_type?: string;
  sample_threshold?: number;
  num_layers?: number;
  max_cache_size?: number;
  ef_construction?: number;
  ef_search?: number;
  neighbors_count?: number;
  level_0_neighbors_count?: number;
}

/**
 * Class for managing a collection in the vector database.
 */
export class Collection {
  private client: Client;
  public name: string;
  private dimension: number;
  private vectors: Vectors;
  private versions: Versions;
  private search: Search;

  /**
   * Initialize a Collection object.
   * 
   * @param client - Client instance
   * @param name - Name of the collection
   * @param dimension - Dimensionality of vectors in this collection
   */
  constructor(client: Client, name: string, dimension: number = 1024) {
    this.client = client;
    this.name = name;
    this.dimension = dimension;
    this.vectors = new Vectors(client, name);
    this.versions = new Versions(client, name);
    this.search = new Search(client, name);
  }

  /**
   * Get the collection name.
   * 
   * @returns The collection name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the vector dimension.
   * 
   * @returns The vector dimension
   */
  public getDimension(): number {
    return this.dimension;
  }

  /**
   * Get the vectors manager.
   * 
   * @returns The Vectors instance
   */
  public getVectors(): Vectors {
    return this.vectors;
  }

  /**
   * Get the versions manager.
   * 
   * @returns The Versions instance
   */
  public getVersions(): Versions {
    return this.versions;
  }

  /**
   * Get the search module.
   * 
   * @returns The Search instance
   */
  public getSearch(): Search {
    return this.search;
  }

  /**
   * Get or create an index for this collection.
   * 
   * @param distance_metric - Type of distance metric (e.g., cosine, euclidean)
   * @returns Index object
   */
  public async index(distance_metric: string = 'cosine'): Promise<Index> {
    // This is a simplified version - a real implementation might check if index exists
    return this.createIndex({ distance_metric });
  }

  /**
   * Create a new index for this collection.
   * 
   * @param options - Index creation options
   * @param options.name - Name of the index (defaults to collection_name + "_index")
   * @param options.distance_metric - Type of distance metric (e.g., cosine, euclidean)
   * @param options.quantization_type - Type of quantization (auto or scalar)
   * @param options.sample_threshold - Number of vectors to sample for automatic quantization
   * @param options.num_layers - Number of layers in the HNSW graph
   * @param options.max_cache_size - Maximum cache size
   * @param options.ef_construction - ef parameter for index construction
   * @param options.ef_search - ef parameter for search
   * @param options.neighbors_count - Number of neighbors to connect to
   * @param options.level_0_neighbors_count - Number of neighbors at level 0
   * @returns Promise that resolves to the created Index
   */
  public async createIndex({
    name,
    distance_metric = "cosine",
    quantization_type = "auto",
    sample_threshold = 100,
    num_layers = 7,
    max_cache_size = 1000,
    ef_construction = 512,
    ef_search = 256,
    neighbors_count = 32,
    level_0_neighbors_count = 64
  }: CreateIndexOptions = {}): Promise<Index> {
    await this.client['ensureAuthenticated']();
    
    const indexName = name || `${this.name}_index`;
    const url = `${this.client.getBaseUrl()}/collections/${this.name}/indexes/dense`;
    const data = {
      name: indexName,
      distance_metric_type: distance_metric,
      quantization: {
        type: quantization_type,
        properties: {
          sample_threshold
        }
      },
      index: {
        type: "hnsw",
        properties: {
          num_layers,
          max_cache_size,
          ef_construction,
          ef_search,
          neighbors_count,
          level_0_neighbors_count
        }
      }
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create index: ${JSON.stringify(response.data)} (Status: ${response.status})`);
    }
    
    return new Index(this.client, this, indexName, 'dense');
  }

  /**
   * Get an index by name.
   * 
   * @param name - Name of the index
   * @returns Promise that resolves to the Index
   */
  public async getIndex(name: string): Promise<Index> {
    // For now, just return a new Index instance without making an API call
    // This matches the Python implementation's behavior
    return new Index(this.client, this, name, 'dense');
  }

  /**
   * Start a new transaction for batch operations.
   * 
   * @returns A new Transaction instance
   */
  public transaction(): Transaction {
    return new Transaction(this.client, this.name);
  }

  /**
   * Delete this collection.
   * 
   * @returns Promise that resolves when the collection is deleted
   */
  public async delete(): Promise<void> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.name}`;
    const response = await this.client.getAxiosInstance().delete(url, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Failed to delete collection: ${JSON.stringify(response.data)} (Status: ${response.status})`);
    }
  }

  /**
   * Get information about this collection.
   * 
   * @returns JSON response containing collection information
   */
  public async getInfo(): Promise<any> {
    const url = `${this.client.getBaseUrl()}/collections/${this.name}`;
    
    const response = await this.client.getAxiosInstance().get(
      url,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Failed to get collection info: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  public async create_sparse_index(
    name: string,
    quantization: number = 64,
    sample_threshold: number = 1000
  ): Promise<Index> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.name}/indexes/sparse`;
    const data = {
      name,
      data_type: "sparse",
      quantization,
      sample_threshold
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create sparse index: ${JSON.stringify(response.data)} (Status: ${response.status})`);
    }
    
    return new Index(this.client, this, name, 'sparse');
  }

  public async create_tf_idf_index(
    name: string,
    sample_threshold: number = 1000,
    k1: number = 1.2,
    b: number = 0.75
  ): Promise<Index> {
    const url = `${this.client.getBaseUrl()}/collections/${this.name}/indexes/tf-idf`;
    const data = {
      name,
      sample_threshold,
      k1,
      b
    };
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create TF-IDF index: ${JSON.stringify(response.data)}`);
    }
    
    return new Index(this.client, this, name, 'tf_idf');
  }
} 