import { Client } from './client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mocked instance
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
    } as any);
  });

  it('should initialize with default values', () => {
    const client = new Client();
    expect(client.getBaseUrl()).toBe('http://127.0.0.1:8443/vectordb');
    expect(client.getVerifySSL()).toBe(false);
  });

  it('should initialize with custom values', () => {
    const client = new Client({
      host: 'https://example.com',
      username: 'user',
      password: 'pass',
      verifySSL: true
    });
    expect(client.getBaseUrl()).toBe('https://example.com/vectordb');
    expect(client.getVerifySSL()).toBe(true);
  });

  it('should generate headers without token', () => {
    const client = new Client();
    const headers = client.getHeaders();
    expect(headers).toEqual({
      'Content-type': 'application/json'
    });
  });

  it('should include authorization header when token is set', () => {
    const client = new Client();
    // Manually set token for testing
    (client as any).token = 'test-token';
    
    const headers = client.getHeaders();
    expect(headers).toEqual({
      'Content-type': 'application/json',
      'Authorization': 'Bearer test-token'
    });
  });

  it('should call ensureAuthenticated before making API calls', async () => {
    const client = new Client();
    // Mock the private method with an empty implementation
    const ensureAuthSpy = jest.spyOn(client as any, 'ensureAuthenticated')
      .mockImplementation(() => Promise.resolve());
    
    const axiosGetSpy = jest.fn().mockResolvedValue({ status: 200, data: [] });
    
    (client.getAxiosInstance() as any).get = axiosGetSpy;
    
    await client.listCollections();
    
    expect(ensureAuthSpy).toHaveBeenCalled();
    expect(axiosGetSpy).toHaveBeenCalled();
  });

  // More tests would be added for login, collection operations, etc.
}); 