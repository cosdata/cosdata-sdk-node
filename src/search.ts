import { Client } from './client';

/**
 * Represents a single search result
 */
export interface SearchResult {
  id: string;
  document_id?: string;
  score: number;
  text?: string | null;
}

/**
 * Represents the response from search endpoints
 */
export interface SearchResponse {
  results: SearchResult[];
}

export class Search {
  private client: Client;
  private collectionName: string;

  constructor(client: Client, collectionName: string) {
    this.client = client;
    this.collectionName = collectionName;
  }

  /**
   * Search for similar dense vectors.
   * 
   * @param options - Search options
   * @param options.query_vector - Query vector to search for similar vectors
   * @param options.top_k - Number of nearest neighbors to return
   * @param options.return_raw_text - Whether to return raw text with results
   * @returns Promise that resolves to search results
   */
  public async dense({
    query_vector,
    top_k = 5,
    return_raw_text = false
  }: {
    query_vector: number[];
    top_k?: number;
    return_raw_text?: boolean;
  }): Promise<SearchResponse> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/search/dense`;
    const data = {
      query_vector,
      top_k,
      return_raw_text
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to search dense vectors: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Search for similar sparse vectors.
   * 
   * @param options - Search options
   * @param options.query_terms - Array of sparse vector entries, each with an index and value
   * @param options.top_k - Number of nearest neighbors to return
   * @param options.early_terminate_threshold - Threshold for early termination of search
   * @param options.return_raw_text - Whether to return raw text with results
   * @returns Promise that resolves to search results
   */
  public async sparse({
    query_terms,
    top_k = 5,
    early_terminate_threshold = 0.0,
    return_raw_text = false
  }: {
    query_terms: Array<[number, number]>;
    top_k?: number;
    early_terminate_threshold?: number;
    return_raw_text?: boolean;
  }): Promise<SearchResponse> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/search/sparse`;
    const data = {
      query_terms,
      top_k,
      early_terminate_threshold,
      return_raw_text
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to search sparse vectors: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Search using TF-IDF.
   * 
   * @param options - Search options
   * @param options.query_text - Text to search for
   * @param options.top_k - Number of nearest neighbors to return
   * @param options.return_raw_text - Whether to return raw text with results
   * @returns Promise that resolves to search results
   */
  public async tf_idf({
    query_text,
    top_k = 5,
    return_raw_text = false
  }: {
    query_text: string;
    top_k?: number;
    return_raw_text?: boolean;
  }): Promise<SearchResponse> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/search/tf-idf`;
    const data = {
      query_text,
      top_k,
      return_raw_text
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to search using TF-IDF: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }

  /**
   * Search using text search.
   * 
   * @param options - Search options
   * @param options.query_text - Text to search for
   * @param options.top_k - Number of nearest neighbors to return
   * @param options.return_raw_text - Whether to return raw text with results
   * @returns Promise that resolves to search results
   */
  public async text({
    query_text,
    top_k = 5,
    return_raw_text = false
  }: {
    query_text: string;
    top_k?: number;
    return_raw_text?: boolean;
  }): Promise<SearchResponse> {
    await this.client['ensureAuthenticated']();
    
    const url = `${this.client.getBaseUrl()}/collections/${this.collectionName}/search/tf-idf`;
    const data = {
      query: query_text,
      top_k,
      return_raw_text
    };
    
    const response = await this.client.getAxiosInstance().post(url, data, {
      headers: this.client.getHeaders(),
      httpsAgent: this.client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to search using text: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  }
} 