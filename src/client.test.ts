import { Client } from './client';
import { Collection } from './collection';

describe('Client', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({
      host: 'http://127.0.0.1:8443',
      username: 'admin',
      password: 'test_key'
    });
  });

  it('should initialize with default values', () => {
    const defaultClient = new Client();
    expect(defaultClient.getBaseUrl()).toBe('http://127.0.0.1:8443/vectordb');
    expect(defaultClient.getVerifySSL()).toBe(false);
  });

  it('should initialize with custom values', () => {
    const customClient = new Client({
      host: 'https://example.com',
      username: 'user',
      password: 'pass',
      verifySSL: true
    });
    expect(customClient.getBaseUrl()).toBe('https://example.com/vectordb');
    expect(customClient.getVerifySSL()).toBe(true);
  });

  describe('Collection Management', () => {
    const testCollectionName = 'test_collection';

    afterEach(async () => {
      try {
        const collection = await client.getCollection(testCollectionName);
        await collection.delete();
      } catch (error) {
        // Collection might not exist, which is fine
      }
    });

    it('should create and manage collections', async () => {
      // Create a collection
      const collection = await client.createCollection({
        name: testCollectionName,
        dimension: 768,
        description: 'Test collection'
      });

      expect(collection).toBeInstanceOf(Collection);
      expect(collection.getName()).toBe(testCollectionName);

      // List collections
      const collections = await client.collections();
      expect(collections).toContainEqual(expect.objectContaining({
        getName: expect.any(Function)
      }));

      // Get collection by name
      const retrievedCollection = await client.getCollection(testCollectionName);
      expect(retrievedCollection.getName()).toBe(testCollectionName);

      // Delete collection
      await collection.delete();
      const collectionsAfterDelete = await client.collections();
      expect(collectionsAfterDelete.find(c => c.getName() === testCollectionName)).toBeUndefined();
    });

    it('should handle collection operations with proper error handling', async () => {
      // Try to get non-existent collection
      await expect(client.getCollection('non_existent_collection'))
        .rejects
        .toThrow();

      // Try to create collection with invalid parameters
      await expect(client.createCollection({
        name: testCollectionName,
        dimension: -1, // Invalid dimension
        description: 'Test collection'
      }))
        .rejects
        .toThrow();
    });
  });
}); 