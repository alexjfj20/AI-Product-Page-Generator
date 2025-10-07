import { Order, OrderStatus, CartItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const ORDERS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.ORDERS}`;

const getStoredOrders = (): Order[] => {
  try {
    const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    return storedOrders ? JSON.parse(storedOrders) : [];
  } catch (error) {
    console.error("Error reading orders from localStorage:", error);
    return [];
  }
};

const saveStoredOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Error saving orders to localStorage:", error);
  }
};

export const getOrders = async (): Promise<Order[]> => {
  console.log(`orderService (localStorage): Obteniendo pedidos`);
  return Promise.resolve(getStoredOrders());
};

export const addOrder = async (orderData: Pick<Order, 'items' | 'totalAmount' | 'customerNotes'>): Promise<Order> => {
  console.log(`orderService (localStorage): Añadiendo pedido`, orderData);
  const orders = getStoredOrders();
  const newOrder: Order = {
    id: uuidv4(),
    ...orderData,
    orderDate: Date.now(),
    status: OrderStatus.PENDIENTE,
  };
  orders.unshift(newOrder); // Add to the beginning
  saveStoredOrders(orders);
  return Promise.resolve(newOrder);
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<Order | null> => {
  console.log(`orderService (localStorage): Actualizando estado del pedido ${orderId} a ${newStatus}`);
  let orders = getStoredOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    console.warn(`Order with ID ${orderId} not found for status update.`);
    return Promise.resolve(null);
  }
  
  orders[orderIndex].status = newStatus;
  saveStoredOrders(orders);
  return Promise.resolve(orders[orderIndex]);
};
