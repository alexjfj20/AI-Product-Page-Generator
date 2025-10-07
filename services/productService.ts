import { Product, ProductStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const PRODUCTS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.PRODUCTS}`;

const getStoredProducts = (): Product[] => {
  try {
    const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return storedProducts ? JSON.parse(storedProducts) : [];
  } catch (error) {
    console.error("Error reading products from localStorage:", error);
    return [];
  }
};

const saveStoredProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  console.log(`%cproductService (localStorage): Obteniendo productos`, "color: green; font-weight: bold;");
  return Promise.resolve(getStoredProducts());
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  console.log(`%cproductService (localStorage): Añadiendo producto`, "color: green;", productData);
  const products = getStoredProducts();
  const newProduct: Product = {
    ...productData,
    id: uuidv4(),
    createdAt: Date.now(),
    status: productData.status || ProductStatus.Activo, // Ensure status default
  };
  products.unshift(newProduct); // Add to the beginning like the backend version did
  saveStoredProducts(products);
  return Promise.resolve(newProduct);
};

export const updateProduct = async (updatedProductData: Product): Promise<Product> => {
  console.log(`%cproductService (localStorage): Actualizando producto ${updatedProductData.id}`, "color: green;");
  let products = getStoredProducts();
  const productIndex = products.findIndex(p => p.id === updatedProductData.id);

  if (productIndex === -1) {
    throw new Error(`Producto con ID ${updatedProductData.id} no encontrado para actualizar.`);
  }
  
  products[productIndex] = {
    ...products[productIndex], // Keep original createdAt if not part of update
    ...updatedProductData,
     status: updatedProductData.status || products[productIndex].status, // Ensure status default
  };
  saveStoredProducts(products);
  return Promise.resolve(products[productIndex]);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  console.log(`%cproductService (localStorage): Eliminando producto ${productId}`, "color: green;");
  let products = getStoredProducts();
  products = products.filter(p => p.id !== productId);
  saveStoredProducts(products);
  return Promise.resolve();
};
