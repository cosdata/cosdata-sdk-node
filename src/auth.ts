import axios, { AxiosInstance } from 'axios';

export class Auth {
  private username: string;
  private password: string;
  private host: string = '';
  private verifySSL: boolean = false;
  private token: string = '';
  private axiosInstance: AxiosInstance;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
    this.axiosInstance = axios.create({
      validateStatus: () => true,
    });
  }

  public setClientInfo(host: string, verifySSL: boolean): void {
    this.host = host;
    this.verifySSL = verifySSL;
  }

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

  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  public async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.login();
    }
  }
} 