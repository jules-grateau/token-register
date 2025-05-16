import axios from 'axios';
import type { Product } from 'shared-ts';

const API_URL = 'http://localhost:3001/products';

const productApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await productApiClient.get<Product[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};  
