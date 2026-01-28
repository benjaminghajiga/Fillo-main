import axios, { AxiosInstance, AxiosError } from 'axios';

// SSR-safe function to get API base URL
function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return base.endsWith('/api') ? base : base.endsWith('/') ? base + 'api' : base + '/api';
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error) {
      return data.error;
    }
    if (error.response?.status === 409) {
      return 'This email is already registered';
    }
    if (error.response?.status === 401) {
      return 'Invalid credentials';
    }
    if (error.response?.status === 400) {
      return 'Invalid input. Please check your entries';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later';
    }
    if (error.message === 'Network Error') {
      return 'Cannot connect to server. Is the backend running?';
    }
    return error.message || 'An error occurred';
  }
  return (error as Error)?.message || 'An unknown error occurred';
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    const API_URL = getApiBaseUrl();
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor: add token if available
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor: handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    role: 'FARMER' | 'BUYER';
    location: string;
    farmName?: string;
    crops?: string[];
    companyName?: string;
  }) {
    return this.client.post('/auth/register', data);
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  // Product endpoints
  async createProduct(data: {
    name: string;
    description?: string;
    category: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    image?: string;
  }) {
    return this.client.post('/products', data);
  }

  async getProducts(params?: {
    category?: string;
    search?: string;
    available?: boolean;
  }) {
    return this.client.get('/products', { params });
  }

  async getProductById(id: string) {
    return this.client.get(`/products/${id}`);
  }

  async getMyProducts() {
    return this.client.get('/products/farmer/my-products');
  }

  async updateProduct(id: string, data: any) {
    return this.client.put(`/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.client.delete(`/products/${id}`);
  }

  // Order endpoints
  async createOrder(data: {
    productId: string;
    quantity: number;
    notes?: string;
  }) {
    return this.client.post('/orders', data);
  }

  async getOrders() {
    return this.client.get('/orders');
  }

  async getOrderById(id: string) {
    return this.client.get(`/orders/${id}`);
  }

  async getMyFarmerOrders() {
    return this.client.get('/orders/farmer/my-orders');
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.client.put(`/orders/${orderId}/status`, { status });
  }

  // Payment endpoints
  async initiatePaystackPayment(orderId: string) {
    return this.client.post('/payments/paystack/initiate', { orderId });
  }

  async initiateStacksPayment(orderId: string, walletAddress: string) {
    return this.client.post('/payments/stacks/initiate', { orderId, walletAddress });
  }

  async verifyStacksTransaction(transactionId: string, orderId: string) {
    return this.client.post('/payments/stacks/verify', { transactionId, orderId });
  }

  async getPaymentStatus(paymentId: string) {
    return this.client.get(`/payments/${paymentId}`);
  }
}

export const apiClient = new ApiClient();
