
import React from 'react';
import { Order, OrderStatus, CartItem } from '../types';
import { ArrowLeftIcon, ClipboardListIcon, CubeIcon, TagIcon, CashIcon } from './icons';

interface OrdersDashboardPageProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onNavigateBack: () => void;
}

const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDIENTE: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case OrderStatus.EN_PROCESO: return 'bg-blue-100 text-blue-800 border-blue-300';
    case OrderStatus.COMPLETADO: return 'bg-green-100 text-green-800 border-green-300';
    case OrderStatus.CANCELADO: return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-neutral-100 text-neutral-800 border-neutral-300';
  }
};

const OrderItemView: React.FC<{ item: CartItem }> = ({ item }) => (
  <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-b-0">
    <div className="flex items-center">
      {item.imagePreviewUrl ? (
        <img src={item.imagePreviewUrl} alt={item.name} className="w-10 h-10 object-cover rounded mr-3 border border-neutral-200" />
      ) : (
        <CubeIcon className="w-10 h-10 text-neutral-300 mr-3 p-1 border border-neutral-200 rounded"/>
      )}
      <div>
        <p className="text-sm font-medium text-neutral-700 truncate max-w-[150px] sm:max-w-xs" title={item.name}>{item.name}</p>
        <p className="text-xs text-neutral-500">Cantidad: {item.quantity}</p>
      </div>
    </div>
    <p className="text-sm text-neutral-600 font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
  </div>
);


export const OrdersDashboardPage: React.FC<OrdersDashboardPageProps> = ({
  orders,
  onUpdateOrderStatus,
  onNavigateBack,
}) => {

  const sortedOrders = [...orders].sort((a, b) => b.orderDate - a.orderDate); // Más recientes primero

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 py-8 px-4">
      <header className="container mx-auto max-w-5xl mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardListIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mr-3" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Dashboard de Pedidos</h1>
                <p className="text-sm sm:text-base text-neutral-600">
                    Gestiona los pedidos de tus clientes.
                </p>
            </div>
          </div>
          <button
            onClick={onNavigateBack}
            className="flex items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 shadow-sm transition-colors duration-150 text-sm font-medium"
            title="Volver al Panel Principal"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 text-neutral-600" />
            Panel Principal
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl">
        {sortedOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-neutral-200">
            <ClipboardListIcon className="w-20 h-20 text-neutral-300 mx-auto mb-6" strokeWidth={1} />
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">No hay pedidos aún</h2>
            <p className="text-neutral-500">
              Cuando los clientes realicen pedidos desde tu tienda, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                <div className={`p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center ${getOrderStatusColor(order.status)}`}>
                  <div>
                    <h3 className="text-lg font-semibold truncate" title={order.id}>ID Pedido: {order.id.substring(0,12)}...</h3>
                    <p className="text-xs opacity-80">
                      Fecha: {new Date(order.orderDate).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                     <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getOrderStatusColor(order.status)} shadow-sm`}>
                        {order.status}
                     </span>
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="text-xs p-1.5 border border-neutral-400/50 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white/80 hover:bg-white"
                      aria-label={`Cambiar estado del pedido ${order.id}`}
                    >
                      {Object.values(OrderStatus).map(statusValue => (
                        <option key={statusValue} value={statusValue}>{statusValue}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Artículos del Pedido:</h4>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                        {order.items.map(item => <OrderItemView key={item.productId} item={item} />)}
                    </div>
                  </div>

                  {order.customerNotes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-neutral-700 mb-1">Notas del Cliente:</h4>
                      <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-md border border-neutral-200 whitespace-pre-wrap">
                        {order.customerNotes}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-neutral-200 text-right">
                    <p className="text-md font-bold text-neutral-800">
                      Total del Pedido: <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="mt-12 text-center text-neutral-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Dashboard de Pedidos.</p>
      </footer>
    </div>
  );
};

// Re-inject custom scrollbar styles if not present (e.g. if this page loads first)
if (typeof document !== 'undefined' && !document.getElementById('custom-scrollbar-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-scrollbar-styles';
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9; 
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1; 
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8; 
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      }
    `;
    document.head.appendChild(style);
  }
