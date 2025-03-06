// Re-export all classes
export { Client } from './client';
export { Collection } from './collection';
export { Index } from './index-class';
export { Transaction, Vector } from './transaction';

// Export a default client creator function
import { Client } from './client';

/**
 * Create a new CosData client
 * 
 * @param options - Client configuration options
 * @returns A new Client instance
 */
export function createClient(options?: {
  host?: string;
  username?: string;
  password?: string;
  verifySSL?: boolean;
}): Client {
  return new Client(options);
}

// Default export
export default {
  createClient,
}; 