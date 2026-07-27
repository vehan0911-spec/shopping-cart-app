import axios from 'axios';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  createdAt: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ send cookies / session info
});

export const productService = {
  getAllProducts: () => api.get<Product[]>('/products'),
  getProductsByCategory: (category: string) => api.get<Product[]>(`/products/category/${category}`),
  getProductById: (id: string) => api.get<Product>(`/products/${id}`),
};

export default api;