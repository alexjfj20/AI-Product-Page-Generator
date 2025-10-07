
import React, { useState } from 'react';
import { CartItem, BusinessSettings, Order } from '../types';
import { 
    PhotoIcon, PlusCircleIcon, MinusCircleIcon, TrashIcon, ArrowLeftIcon, ShoppingCartIcon, 
    WhatsAppIcon, CheckCircleIcon, ShareIcon, UserCircleIcon, ChevronDownIcon, ChevronUpIcon,
    BanknotesIcon, QrCodeIcon, DevicePhoneMobileIcon, CreditCardIcon, CurrencyDollarIcon, XCircleIcon
} from './icons'; 
import { replacePlaceholders } from '../utils'; 
import { Modal } from './Modal'; // Import Modal

interface CartPageProps {
  cartItems: CartItem[];
  settings: BusinessSettings | null;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigateBackToStore: () => void;
  onAddOrder: (orderData: Pick<Order, 'items' | 'totalAmount' | 'customerNotes'>) => void;
  encodeCartToString: (cartItems: CartItem[]) => string;
}

interface CustomerFormData {
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  email: string;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateBackToStore,
  onAddOrder,
  encodeCartToString,
}) => {
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  type PaymentMethodKey = 'cashOnDelivery' | 'qrPayment' | 'nequiPayment' | 'stripeMock' | 'paypalMock';

  const [openPaymentMethods, setOpenPaymentMethods] = useState<Record<PaymentMethodKey, boolean>>({
    cashOnDelivery: false,
    qrPayment: false,
    nequiPayment: false,
    stripeMock: false,
    paypalMock: false,
  });
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentMethodKey | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>({
    fullName: '',
    phoneNumber: '',
    shippingAddress: '',
    email: '',
  });

  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({ ...prev, [name]: value }));
    if(formError) setFormError(null);
  };

  const togglePaymentMethod = (key: PaymentMethodKey) => {
    setOpenPaymentMethods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSubtotal = (item: CartItem): number => {
    return parseFloat(item.price) * item.quantity;
  };

  const calculateTotal = (): number => {
    return cartItems.reduce((total, item) => total + calculateSubtotal(item), 0);
  };

  const businessName = settings?.businessName || "Mi Tienda";
  const whatsappNumber = settings?.whatsappNumber;

  interface PaymentMethodItem {
    key: PaymentMethodKey;
    enabled?: boolean;
    icon: JSX.Element;
    title: string;
    details: () => React.ReactNode;
  }

  const allPaymentMethods: PaymentMethodItem[] = [
    { 
      key: 'cashOnDelivery', 
      enabled: settings?.enableCashOnDelivery, 
      icon: <BanknotesIcon className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />, 
      title: 'Pago Contra Entrega', 
      details: () => settings?.cashOnDeliveryInstructions && <p className="text-xs text-neutral-600 mt-1">{settings.cashOnDeliveryInstructions}</p> 
    },
    { 
      key: 'qrPayment', 
      enabled: settings?.enableQrPayment, 
      icon: <QrCodeIcon className="w-5 h-5 mr-2 text-neutral-700 flex-shrink-0" />, 
      title: 'Paga con Código QR', 
      details: () => (
        <div className="space-y-1">
            {settings?.qrCodeImageUrl && <img src={settings.qrCodeImageUrl} alt="Código QR para pago" className="my-1 rounded-md max-w-[80px] max-h-[80px] border" />}
            {settings?.qrPaymentInstructions && <p className="text-xs text-neutral-600">{settings.qrPaymentInstructions}</p>}
        </div>
    )},
    { 
      key: 'nequiPayment', 
      enabled: settings?.enableNequiPayment, 
      icon: <DevicePhoneMobileIcon className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0" />, 
      title: 'Paga con Nequi', 
      details: () => (
        <div className="space-y-1">
            {settings?.nequiPhoneNumber && <p className="text-sm text-neutral-600">Número: <strong className="font-semibold">{settings.nequiPhoneNumber}</strong></p>}
            {settings?.nequiPaymentInstructions && <p className="text-xs text-neutral-600">{settings.nequiPaymentInstructions}</p>}
        </div>
    )},
    { 
      key: 'stripeMock', 
      enabled: !!settings?.stripeApiKeyMock, 
      icon: <CreditCardIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />, 
      title: 'Tarjeta de Crédito/Débito (Simulado)', 
      details: () => <p className="text-xs text-neutral-500 mt-1">Esta es una opción de pago simulada para demostración.</p> 
    },
    { 
      key: 'paypalMock', 
      enabled: !!settings?.paypalEmailMock, 
      icon: <CurrencyDollarIcon className="w-5 h-5 mr-2 text-sky-600 flex-shrink-0" />, 
      title: 'PayPal (Simulado)', 
      details: () => <p className="text-xs text-neutral-600 mt-1">Email: <strong className="font-semibold">{settings?.paypalEmailMock}</strong> (Simulado)</p> 
    },
  ];

  const paymentMethodConfig = allPaymentMethods.filter(pm => pm.enabled);

  const handleDeleteRequest = (item: CartItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteItem = () => {
    if (itemToDelete) {
      onRemoveItem(itemToDelete.productId);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };


  const handleProceedToWhatsApp = () => {
    if (!whatsappNumber) {
      alert("El número de WhatsApp no está configurado para este negocio.");
      return;
    }
    if (cartItems.length === 0) {
        setFormError("Tu carrito está vacío.");
        return;
    }

    setFormError(null);
    if (isCustomerFormOpen) {
        if (!customerFormData.fullName.trim()) {
            setFormError("El nombre completo es obligatorio.");
            return;
        }
        if (!customerFormData.phoneNumber.trim()) {
            setFormError("El número de teléfono es obligatorio.");
            return;
        }
        if (!customerFormData.shippingAddress.trim()) {
            setFormError("La dirección de envío es obligatoria.");
            return;
        }
    }
    
    if (paymentMethodConfig.length > 0 && !selectedPaymentOption) {
        setFormError("Por favor, selecciona un método de pago.");
        return;
    }


    let combinedNotes = customerNotes.trim() ? `Notas del Pedido (Carrito): ${customerNotes.trim()}\n\n` : '';
    if (isCustomerFormOpen && 
        (customerFormData.fullName.trim() || customerFormData.phoneNumber.trim() || customerFormData.shippingAddress.trim() || customerFormData.email.trim())) {
        combinedNotes += "Información del Cliente (Formulario):\n";
        if (customerFormData.fullName.trim()) combinedNotes += `Nombre: ${customerFormData.fullName.trim()}\n`;
        if (customerFormData.phoneNumber.trim()) combinedNotes += `Teléfono: ${customerFormData.phoneNumber.trim()}\n`;
        if (customerFormData.shippingAddress.trim()) combinedNotes += `Dirección: ${customerFormData.shippingAddress.trim()}\n`;
        if (customerFormData.email.trim()) combinedNotes += `Email: ${customerFormData.email.trim()}\n`;
    }


    const totalAmount = calculateTotal();
    const orderDataForStorage: Pick<Order, 'items' | 'totalAmount' | 'customerNotes'> = {
        items: cartItems,
        totalAmount: totalAmount,
        customerNotes: combinedNotes.trim() || undefined,
    };
    onAddOrder(orderDataForStorage);

    let message: string;
    const template = settings?.whatsappOrderTemplate;

    const cartItemsListString = cartItems
        .map(item => `- ${item.name} (x${item.quantity}) - $${calculateSubtotal(item).toFixed(2)}`)
        .join('\n');
    
    const selectedPaymentMethodTitle = selectedPaymentOption 
        ? paymentMethodConfig.find(pm => pm.key === selectedPaymentOption)?.title || "No especificado"
        : "No especificado";

    if (template) {
      const placeholderData = {
        businessName: businessName,
        cartItemsList: cartItemsListString,
        totalAmount: totalAmount.toFixed(2),
        customerNotes: combinedNotes.trim() || "Ninguna",
        customerFullName: customerFormData.fullName.trim(),
        customerPhone: customerFormData.phoneNumber.trim(),
        customerAddress: customerFormData.shippingAddress.trim(),
        customerEmail: customerFormData.email.trim(),
        paymentMethod: selectedPaymentMethodTitle,
      };
      // Ensure the template adapts to the "order placed" context
      let adaptedTemplate = template;
      if (template.toLowerCase().includes("quisiera hacer un pedido") || template.toLowerCase().includes("quiero confirmar mi pedido")) {
          adaptedTemplate = template.replace(/quisiera hacer un pedido|quiero confirmar mi pedido/gi, "he realizado el siguiente pedido");
      }
      if (!template.includes("{paymentMethod}")) {
          adaptedTemplate += `\nMétodo de Pago: {paymentMethod}`;
      }
      message = replacePlaceholders(adaptedTemplate, placeholderData);

    } else {
      message = `Hola ${businessName}, he realizado el siguiente pedido:\n\n`;
      message += `${cartItemsListString}\n`;
      message += `\nTotal: $${totalAmount.toFixed(2)}\n`;
      message += `Método de Pago Seleccionado: ${selectedPaymentMethodTitle}\n`;
      
      if (isCustomerFormOpen && customerFormData.fullName.trim()) {
        message += `\n--- Información del Cliente ---\n`;
        message += `Nombre: ${customerFormData.fullName.trim()}\n`;
        message += `Teléfono: ${customerFormData.phoneNumber.trim()}\n`;
        message += `Dirección: ${customerFormData.shippingAddress.trim()}\n`;
        if (customerFormData.email.trim()) message += `Email: ${customerFormData.email.trim()}\n`;
        message += `-----------------------------\n`;
      }
      if (customerNotes.trim()) {
          message += `\nNotas Adicionales (Carrito): ${customerNotes.trim()}\n`;
      }
    }
    
    message += `\n\nHe realizado el pago / enviaré el comprobante según las instrucciones. ¡Gracias!`;

    onClearCart();
    setCustomerNotes('');
    setCustomerFormData({ fullName: '', phoneNumber: '', shippingAddress: '', email: ''});
    setIsCustomerFormOpen(false);
    setSelectedPaymentOption(null);
    setOrderSuccessMessage("¡Pedido registrado! Serás redirigido a WhatsApp para confirmar.");

    setTimeout(() => {
        const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        setOrderSuccessMessage(null);
    }, 2500);
  };
  
  const handleShareCart = async () => {
    if (cartItems.length === 0) {
        setShareMessage("Tu carrito está vacío. Añade productos para compartir.");
        setTimeout(() => setShareMessage(null), 3000);
        return;
    }
    const encodedCart = encodeCartToString(cartItems);
    if (!encodedCart) {
        setShareMessage("Error al generar el enlace del carrito.");
        setTimeout(() => setShareMessage(null), 3000);
        return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?sharedCart=${encodedCart}`;
    try {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("¡Enlace del carrito copiado al portapapeles!");
    } catch (err) {
        console.error("Error al copiar enlace del carrito:", err);
        setShareMessage("Error al copiar el enlace. Inténtalo manually.");
    }
    setTimeout(() => setShareMessage(null), 3000);
  };


  return (
    <>
    <div className="min-h-screen bg-neutral-100 md:relative md:inset-auto md:z-auto md:min-h-0 fixed inset-0 z-50 overflow-y-auto flex flex-col">
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm shadow-md z-10 md:static md:bg-transparent md:shadow-none md:backdrop-blur-none md:mb-8">
        <div className="container mx-auto max-w-4xl py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCartIcon className="w-7 h-7 md:w-8 md:h-8 text-primary mr-2 md:mr-3" />
              <h1 className="text-xl md:text-3xl font-bold text-neutral-800">Tu Carrito</h1>
            </div>
            <button
              onClick={onNavigateBackToStore}
              className="flex items-center p-2 md:px-4 md:py-2 bg-neutral-100 md:bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-200 md:hover:bg-neutral-50 shadow-sm transition-colors duration-150 text-sm font-medium"
              title="Volver a la Tienda"
            >
              <ArrowLeftIcon className="w-5 h-5 text-neutral-600 md:mr-2" />
              <span className="hidden md:inline">Seguir Comprando</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl flex-grow pt-4 pb-8 px-4 md:pt-0">
        {orderSuccessMessage && (
          <div role="status" aria-live="polite" className="mb-6 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg shadow-md flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
            {orderSuccessMessage}
          </div>
        )}
        {shareMessage && (
            <div 
              role="status" 
              aria-live="polite" 
              className={`mb-6 px-4 py-3 rounded-lg shadow-md flex items-center ${shareMessage.includes('Error') ? 'bg-red-50 border-red-300 text-red-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}
            >
              <CheckCircleIcon className={`w-5 h-5 mr-2 ${shareMessage.includes('Error') ? 'text-red-600' : 'text-blue-600'}`} />
              {shareMessage}
            </div>
        )}


        {cartItems.length === 0 && !orderSuccessMessage ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-neutral-200 mt-4 md:mt-0">
            <ShoppingCartIcon className="w-20 h-20 text-neutral-300 mx-auto mb-6" strokeWidth={1}/>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Tu carrito está vacío</h2>
            <p className="text-neutral-500 mb-6">
              Aún no has añadido ningún producto. ¡Explora la tienda!
            </p>
            <button
              onClick={onNavigateBackToStore}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Ir a la Tienda
            </button>
          </div>
        ) : cartItems.length > 0 && ( 
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-neutral-200 mt-4 md:mt-0">
            <ul role="list" className="divide-y divide-neutral-200">
              {cartItems.map((item) => (
                <li key={item.productId} className="flex flex-col sm:flex-row py-6 px-4 sm:px-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden mx-auto sm:mx-0 mb-4 sm:mb-0">
                    {item.imagePreviewUrl ? (
                      <img
                        src={item.imagePreviewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  <div className="ml-0 sm:ml-6 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between items-start text-base font-medium text-neutral-900">
                        <h3 className="truncate max-w-xs sm:max-w-sm md:max-w-md" title={item.name}>
                            {item.name}
                        </h3>
                        <p className="ml-4 whitespace-nowrap">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm mt-4">
                      <div className="flex items-center border border-neutral-300 rounded-md">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="p-2 text-neutral-600 hover:text-primary disabled:opacity-50"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                          disabled={item.quantity <= 1}
                        >
                          <MinusCircleIcon className="w-5 h-5" />
                        </button>
                        <span className="px-3 text-neutral-700 font-medium w-10 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="p-2 text-neutral-600 hover:text-primary"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <PlusCircleIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(item)}
                          className="font-medium text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-500/10 transition-colors"
                          aria-label={`Quitar ${item.name} del carrito`}
                          title="Quitar producto"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                     <p className="text-right text-sm text-neutral-600 mt-2">
                        Subtotal: <span className="font-medium">${calculateSubtotal(item).toFixed(2)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="border-t border-neutral-200 py-6 px-4 sm:px-6">
              <div className="mb-6 border-b border-neutral-200 pb-6">
                <h3 className="text-md font-semibold text-neutral-800 mb-4">Opciones de Pago Disponibles</h3>
                <div className="space-y-3 text-sm">
                  {paymentMethodConfig.length > 0 ? (
                    paymentMethodConfig.map(pm => (
                      <div 
                          key={pm.key} 
                          className={`p-3 rounded-md border transition-all 
                                      ${selectedPaymentOption === pm.key ? 'ring-2 ring-primary border-primary bg-primary/5' : 'bg-neutral-50 border-neutral-200 hover:border-primary/30'}`}
                      >
                          <label htmlFor={`payment-${pm.key}`} className="flex justify-between items-center cursor-pointer">
                              <div className="flex items-center">
                                  <input
                                      type="radio"
                                      id={`payment-${pm.key}`}
                                      name="paymentOption"
                                      value={pm.key}
                                      checked={selectedPaymentOption === pm.key}
                                      onChange={() => setSelectedPaymentOption(pm.key)}
                                      className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary mr-3"
                                      aria-describedby={`payment-details-title-${pm.key}`}
                                  />
                                  {pm.icon}
                                  <span id={`payment-details-title-${pm.key}`} className="font-medium text-neutral-700">{pm.title}</span>
                              </div>
                              <button
                                  type="button"
                                  onClick={(e) => {
                                      e.preventDefault(); 
                                      togglePaymentMethod(pm.key);
                                  }}
                                  className="p-1 text-neutral-500 hover:text-primary rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                                  aria-expanded={openPaymentMethods[pm.key]}
                                  aria-controls={`payment-details-${pm.key}`}
                                  title={openPaymentMethods[pm.key] ? "Ocultar detalles" : "Mostrar detalles"}
                              >
                                  {openPaymentMethods[pm.key] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                              </button>
                          </label>
                          {openPaymentMethods[pm.key] && (
                              <div id={`payment-details-${pm.key}`} className="mt-2 pl-9 pr-2 text-sm text-neutral-600">
                                  {pm.details()}
                              </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 text-center py-3">
                      El vendedor no ha configurado opciones de pago para esta tienda. Por favor, contacta directamente para coordinar el pago.
                    </p>
                  )}
                  {paymentMethodConfig.length > 0 && (
                     <p className="mt-4 text-xs text-neutral-500">
                      Selecciona tu método de pago preferido y sigue las instrucciones. Luego, usa el botón de WhatsApp para confirmar tu pedido y enviar el comprobante si es necesario.
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6 border-b border-neutral-200 pb-6">
                <button
                    onClick={() => setIsCustomerFormOpen(prev => !prev)}
                    className="w-full flex justify-between items-center text-left font-semibold text-neutral-800 hover:text-primary transition-colors py-2"
                    aria-expanded={isCustomerFormOpen}
                    aria-controls="customer-info-form"
                >
                    <span className="flex items-center">
                        <UserCircleIcon className="w-5 h-5 mr-2 text-neutral-600" />
                        Información del Cliente
                    </span>
                    {isCustomerFormOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isCustomerFormOpen && (
                    <form id="customer-info-form" className="mt-4 space-y-4 pl-2 border-l-2 border-primary/30">
                        <div>
                            <label htmlFor="fullName" className="block text-xs font-medium text-neutral-600 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                            <input type="text" name="fullName" id="fullName" value={customerFormData.fullName} onChange={handleCustomerFormChange} required className="mt-1 block w-full px-3 py-2 text-sm border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400" placeholder="Ej: Ana Pérez" />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-xs font-medium text-neutral-600 mb-1">Número de Teléfono <span className="text-red-500">*</span></label>
                            <input type="tel" name="phoneNumber" id="phoneNumber" value={customerFormData.phoneNumber} onChange={handleCustomerFormChange} required className="mt-1 block w-full px-3 py-2 text-sm border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400" placeholder="Ej: 3001234567" />
                        </div>
                        <div>
                            <label htmlFor="shippingAddress" className="block text-xs font-medium text-neutral-600 mb-1">Dirección de Envío <span className="text-red-500">*</span></label>
                            <textarea name="shippingAddress" id="shippingAddress" value={customerFormData.shippingAddress} onChange={handleCustomerFormChange} required rows={3} className="mt-1 block w-full px-3 py-2 text-sm border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400" placeholder="Ej: Calle 123 # 45-67, Barrio, Ciudad"></textarea>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-neutral-600 mb-1">Correo Electrónico (Opcional)</label>
                            <input type="email" name="email" id="email" value={customerFormData.email} onChange={handleCustomerFormChange} className="mt-1 block w-full px-3 py-2 text-sm border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400" placeholder="Ej: ana.perez@email.com" />
                        </div>
                    </form>
                )}
              </div>


                <div className="mb-6">
                    <label htmlFor="customerNotes" className="block text-sm font-medium text-neutral-700 mb-1">
                        Notas para el vendedor (Opcional - se añadirán a las del formulario de cliente si existe)
                    </label>
                    <textarea
                        id="customerNotes"
                        name="customerNotes"
                        rows={2}
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                        placeholder="Ej: Preferencias de entrega, consultas especiales..."
                    />
                </div>

              {formError && (
                <div role="alert" className="my-3 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center">
                    <XCircleIcon className="w-5 h-5 mr-2 text-red-500"/> {formError}
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-neutral-900">
                <p>Total del Pedido</p>
                <p>${calculateTotal().toFixed(2)}</p>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Los costos de envío y los impuestos (si aplican) se calcularán al finalizar la compra (simulado).
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handleProceedToWhatsApp}
                  disabled={!whatsappNumber || cartItems.length === 0}
                  className="w-full flex items-center justify-center rounded-lg border border-transparent bg-green-500 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                   <WhatsAppIcon className="w-5 h-5 mr-2.5" />
                   Confirmar Pedido y Contactar por WhatsApp
                </button>
                 <button
                    onClick={handleShareCart}
                    disabled={cartItems.length === 0}
                    className="w-full flex items-center justify-center rounded-lg border border-primary/50 bg-primary/10 px-6 py-3 text-base font-medium text-primary shadow-sm hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-300"
                  >
                    <ShareIcon className="w-5 h-5 mr-2.5" />
                    Compartir Carrito
                  </button>
              </div>
               <button
                  onClick={() => { onClearCart(); setCustomerNotes(''); setCustomerFormData({ fullName: '', phoneNumber: '', shippingAddress: '', email: ''}); setIsCustomerFormOpen(false); setFormError(null); setSelectedPaymentOption(null);}}
                  className="mt-3 w-full flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Vaciar Carrito
                </button>
            </div>
          </div>
        )}
      </main>
      <footer className="container mx-auto max-w-4xl mt-auto pt-8 pb-4 px-4 md:px-0 md:mt-12 text-center text-neutral-500 text-sm border-t border-neutral-200 md:border-t-transparent">
        <p>&copy; {new Date().getFullYear()} {businessName}. Potenciando PYMEs.</p>
      </footer>
    </div>

    {/* Delete Confirmation Modal */}
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      title="Confirmar Eliminación"
      onConfirm={handleConfirmDeleteItem}
      confirmText="Eliminar"
      confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
    >
      <p className="text-sm text-neutral-600">
        ¿Estás seguro de que quieres eliminar 
        <strong className="font-semibold text-neutral-800"> "{itemToDelete?.name}" </strong> 
        de tu carrito?
      </p>
    </Modal>
    </>
  );
};
