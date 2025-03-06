import { Client } from './client';
import { Index } from './index-class';

/**
 * Class for managing a collection in the vector database.
 */
export class Collection {
  private client: Client;
  public name: string;
  public dimension: number;

  /**
   * Initialize a Collection object.
   * 
   * @param client - Client instance
   * @param name - Name of the collection
   * @param dimension - Dimensionality of vectors in this collection
   */
  constructor(client: Client, name: string, dimension: number) {
    this.client = client;
    this.name = name;
    this.dimension = dimension;
  }

  /**
   * Get or create an index for this collection.
   * 
   * @param distanceMetric - Type of distance metric (e.g., cosine, euclidean)
   * @returns Index object
   */
  public async index(distanceMetric: string = 'cosine'): Promise<Index> {
    // This is a simplified version - a real implementation might check if index exists
    return this.createIndex({ distanceMetric });
  }

  /**
   * Create an index for this collection.
   * 
   * @param options - Index creation options
   * @param options.distanceMetric - Type of distance metric (e.g., cosine, euclidean)
   * @param options.numLayers - Number of layers in the HNSW graph
   * @param options.maxCacheSize - Maximum cache size
   * @param options.efConstruction - ef parameter for index construction
   * @param options.efSearch - ef parameter for search
   * @param options.neighborsCount - Number of neighbors to connect to
   * @param options.level0NeighborsCount - Number of neighbors at level 0
   * @returns Index object for the newly created index
   */
  public async createIndex({
    distanceMetric = 'cosine',
    numLayers = 7,
    maxCacheSize = 1000,
    efConstruction = 512,
    efSearch = 256,
    neighborsCount = 32,
    level0NeighborsCount = 64
  }: {
    distanceMetric?: string;
    numLayers?: number;
    maxCacheSize?: number;
    efConstruction?: number;
    efSearch?: number;
    neighborsCount?: number;
    level0NeighborsCount?: number;
  } = {}): Promise<Index> {
    const data = {
      name: this.name,
      distance_metric_type: distanceMetric,
      quantization: { type: 'auto', properties: { sample_threshold: 100 } },
      index: {
        type: 'hnsw',
        properties: {
          num_layers: numLayers,
          max_cache_size: maxCacheSize,
          ef_construction: efConstruction,
          ef_search: efSearch,
          neighbors_count: neighborsCount,
          level_0_neighbors_count: level0NeighborsCount,
        },
      },
    };
    
    const url = `${this.client.getBaseUrl()}/collections/${this.name}/indexes/dense`;
    
    const response = await this.client.getAxiosInstance().post(
      url,
      data,
      {
        headers: this.client.getHeaders(),
        httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
      }
    );
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to create index: ${JSON.stringify(response.data)}`);
    }
    
    return new Index(this.client, this);
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
} 