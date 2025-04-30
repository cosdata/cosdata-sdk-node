# Cosdata Node.js SDK

A TypeScript/JavaScript SDK for interacting with the Cosdata Vector Database.

## Installation

```bash
npm install cosdata-sdk
```

## Quick Start

```typescript
import { createClient } from 'cosdata-sdk';

// Initialize the client (all parameters are optional)
const client = createClient({
  host: 'http://127.0.0.1:8443',  // Default host
  username: 'admin',              // Default username
  password: 'test_key',           // Default password
  verifySSL: false                // SSL verification
});

// Create a collection
const collection = await client.createCollection({
  name: 'my_collection',
  dimension: 128,
  dense_vector: {
    enabled: true,
    dimension: 128,
    auto_create_index: false
  }
});

// Create an index
const index = await collection.createIndex({
  name: 'my_collection_dense_index',
  distance_metric: 'cosine',
  quantization_type: 'auto',
  sample_threshold: 100,
  num_layers: 16,
  max_cache_size: 1024,
  ef_construction: 128,
  ef_search: 64,
  neighbors_count: 10,
  level_0_neighbors_count: 20
});

// Generate some vectors
function generateRandomVector(dimension: number): number[] {
  return Array.from({ length: dimension }, () => Math.random());
}

const vectors = Array.from({ length: 100 }, (_, i) => ({
  id: `vec_${i}`,
  dense_values: generateRandomVector(128),
  document_id: `doc_${i}`
}));

// Add vectors using a transaction
const txn = collection.transaction();
await txn.batch_upsert_vectors(vectors);
await txn.commit();

// Search for similar vectors
const results = await collection.getSearch().dense({
  query_vector: generateRandomVector(128),
  top_k: 5,
  return_raw_text: true
});

// Verify vector existence
const exists = await collection.getVectors().exists('vec_1');
console.log('Vector exists:', exists);

// Get collection information
const collectionInfo = await collection.getInfo();
console.log('Collection info:', collectionInfo);

// List all collections
const collections = await client.listCollections();
console.log('Available collections:', collections);

// Version management
const currentVersion = await collection.getVersions().getCurrent();
console.log('Current version:', currentVersion);

// Clean up
await collection.delete();
```

## API Reference

### Client

The main client for interacting with the Vector Database API.

```typescript
const client = createClient({
  host: 'http://127.0.0.1:8443',  // Optional
  username: 'admin',              // Optional
  password: 'test_key',           // Optional
  verifySSL: false                // Optional
});
```

Methods:
- `createCollection(options: { name: string, dimension: number, dense_vector?: { enabled: boolean, dimension: number, auto_create_index: boolean }, sparse_vector?: { enabled: boolean, auto_create_index: boolean }, tf_idf_options?: { enabled: boolean } }): Promise<Collection>`
- `listCollections(): Promise<string[]>`
- `getCollection(name: string): Promise<Collection>`

### Collection

The Collection class provides access to all collection-specific operations.

```typescript
const collection = await client.createCollection({
  name: 'my_collection',
  dimension: 128,
  dense_vector: {
    enabled: true,
    dimension: 128,
    auto_create_index: false
  }
});
```

Methods:
- `createIndex(options: { name: string, distance_metric: string, quantization_type: string, sample_threshold: number, num_layers: number, max_cache_size: number, ef_construction: number, ef_search: number, neighbors_count: number, level_0_neighbors_count: number }): Promise<Index>`
- `getInfo(): Promise<object>`
- `delete(): Promise<void>`
- `transaction(): Promise<Transaction>`
- `getVectors(): Vectors`
- `getSearch(): Search`
- `getVersions(): Versions`

### Transaction

The Transaction class provides methods for vector operations.

```typescript
const txn = collection.transaction();
await txn.batch_upsert_vectors(vectors);
await txn.commit();
```

Methods:
- `upsert_vector(vector: Vector): Promise<void>`
- `batch_upsert_vectors(vectors: Vector[]): Promise<void>`
- `commit(): Promise<void>`
- `abort(): Promise<void>`

### Search

The Search class provides methods for vector similarity search.

```typescript
const results = await collection.getSearch().dense({
  query_vector: vector,
  top_k: 5,
  return_raw_text: true
});
```

Methods:
- `dense(options: { query_vector: number[], top_k?: number, return_raw_text?: boolean }): Promise<object>`
- `sparse(options: { query_terms: number[][], top_k?: number, early_terminate_threshold?: number, return_raw_text?: boolean }): Promise<object>`
- `text(options: { query_text: string, top_k?: number, return_raw_text?: boolean }): Promise<object>`

### Vectors

The Vectors class provides methods for vector operations.

```typescript
const exists = await collection.getVectors().exists('vec_1');
```

Methods:
- `get(vector_id: string): Promise<Vector>`
- `exists(vector_id: string): Promise<boolean>`

### Versions

The Versions class provides methods for version management.

```typescript
const currentVersion = await collection.getVersions().getCurrent();
```

Methods:
- `getCurrent(): Promise<object>`
- `list(): Promise<object[]>`
- `get(version_hash: string): Promise<object>`

## Best Practices

1. **Connection Management**
   - Use `createClient()` to initialize the client
   - Reuse the client instance across your application
   - The client automatically handles authentication and token management

2. **Vector Operations**
   - Use transactions for batch operations
   - Always call `commit()` after successful operations
   - Use `abort()` in case of errors
   - Maximum batch size is 200 vectors per transaction

3. **Error Handling**
   - All operations return promises that reject on failure
   - Use try/catch blocks for error handling
   - Always clean up resources (delete collections) after testing

4. **Performance**
   - Adjust index parameters based on your use case
   - Use appropriate vector dimensions
   - Consider batch sizes for large operations

5. **Version Management**
   - Use versions to track collection evolution
   - Clean up old versions when no longer needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.