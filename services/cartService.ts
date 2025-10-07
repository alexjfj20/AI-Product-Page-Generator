import { CartItem } from '../types';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const CART_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.CART}`;

const getStoredCart = (): CartItem[] => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error("Error reading cart from localStorage:", error);
    return [];
  }
};

const saveStoredCart = (cartItems: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

export const getCart = async (): Promise<CartItem[]> => {
  console.log(`cartService (localStorage): Obteniendo carrito`);
  return Promise.resolve(getStoredCart());
};

export const saveCart = async (cartItems: CartItem[]): Promise<CartItem[]> => {
  console.log(`cartService (localStorage): Guardando carrito`, cartItems);
  saveStoredCart(cartItems);
  return Promise.resolve(cartItems);
};
