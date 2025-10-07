
import React, { useState, useMemo, useEffect } from 'react';
import { Product, BusinessSettings, ProductStatus, CartItem } from '../types';
import { ArrowLeftIcon, PhotoIcon, SparklesIcon, WhatsAppIcon, ShoppingCartIcon, SearchIcon, XCircleIcon, CurrencyDollarIcon } from './icons';
import { replacePlaceholders, calculateDisplayPrices, formatPrice } from '../utils'; // Importar utilidades
import { StorefrontProductImageGallery } from './StorefrontProductImageGallery';
import { ImageLightboxModal } from './ImageLightboxModal';

interface StorefrontPageProps {
  allProducts: Product[];
  settings: BusinessSettings | null;
  onNavigateBack: () => void;
  cart: CartItem[];
  onAddToCart: (product: Product, finalPrice: number) => void; 
  onNavigateToCart: () => void;
}

const STOREFRONT_DESC_PREVIEW_LINE_CLAMP = 'line-clamp-3'; // Number of lines for preview
const STOREFRONT_DESC_TOGGLE_THRESHOLD = 150; // Character length to determine if toggle is needed


export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  allProducts,
  settings,
  onNavigateBack,
  cart,
  onAddToCart,
  onNavigateToCart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [lightboxInitialImage, setLightboxInitialImage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const activeProducts = useMemo(() => {
    return allProducts.filter(product => product.status === ProductStatus.Activo);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return activeProducts;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return activeProducts.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      product.generatedDescription.toLowerCase().includes(lowercasedSearchTerm) ||
      product.idea.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [activeProducts, searchTerm]);

  const businessName = settings?.businessName || "Mi Tienda";
  const logoUrl = settings?.logoPreviewUrl;
  const whatsappNumber = settings?.whatsappNumber;
  const inquiryTemplate = settings?.whatsappInquiryTemplate;

  const handleOpenLightbox = (product: Product, imageUrl: string) => {
    setLightboxProduct(product);
    setLightboxInitialImage(imageUrl);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxProduct(null);
    setLightboxInitialImage(null);
  };
  
  const handleWhatsAppInquiry = (product: Product) => {
    if (!whatsappNumber) {
      alert("El número de WhatsApp no está configurado por el negocio.");
      return;
    }
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
    let message: string;
    const displayPrices = calculateDisplayPrices(product); 

    if (inquiryTemplate) {
      const placeholderData = {
        businessName: businessName,
        productName: product.name,
        productPrice: formatPrice(displayPrices.finalPrice, displayPrices.currency),
      };
      message = replacePlaceholders(inquiryTemplate, placeholderData);
    } else {
      message = `Hola ${businessName}, estoy interesado/a en el producto: "${product.name}". Precio: ${formatPrice(displayPrices.finalPrice, displayPrices.currency)}. ¿Podrías darme más información?`;
    }
    
    const encodedMessage = encodeURIComponent(message); // Define encodedMessage here
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  
  const handleFloatingWhatsAppInquiry = () => {
     if (!whatsappNumber) {
      alert("El número de WhatsApp no está configurado por el negocio.");
      return;
    }
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
    let message: string;

    if (inquiryTemplate) {
      const placeholderData = {
        businessName: businessName,
        productName: "", 
        productPrice: "", 
      };
      message = replacePlaceholders(inquiryTemplate, placeholderData);
      if (message.length < `Hola ${businessName}, `.length + 5) { 
         message = `Hola ${businessName}, tengo una consulta general sobre tus productos/servicios.`;
      }
    } else {
      message = `Hola ${businessName}, tengo una consulta general.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const toggleDescription = (productId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white shadow-md sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={`Logo de ${businessName}`} className="h-10 w-auto mr-3 sm:h-12" />
                ) : (
                  <SparklesIcon className="h-10 w-10 text-primary mr-3 sm:h-12 sm:w-12" />
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-800" style={{ color: 'var(--app-primary-color)' }}>
                  {businessName}
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary w-32 sm:w-48 md:w-64"
                    aria-label="Buscar productos en la tienda"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-neutral-400" />
                  </div>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="absolute inset-y-0 right-8 pr-1 flex items-center"
                      aria-label="Limpiar búsqueda"
                    >
                      <XCircleIcon className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                    </button>
                  )}
                </div>
                <button
                  onClick={onNavigateToCart}
                  className="relative p-2 text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                  aria-label="Ver carrito de compras"
                  title="Ver Carrito"
                >
                  <ShoppingCartIcon className="w-6 h-6" />
                  {getTotalCartItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalCartItems()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-800 mb-6 sm:mb-8">
            {searchTerm ? `Resultados para "${searchTerm}"` : "Nuestros Productos"}
          </h2>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                  const displayPrices = calculateDisplayPrices(product);
                  const isDescriptionExpanded = expandedDescriptions[product.id] || false;
                  const showDescriptionToggle = product.generatedDescription.length > STOREFRONT_DESC_TOGGLE_THRESHOLD;

                  return (
                    <article key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col group border border-neutral-200 hover:shadow-xl transition-shadow duration-300">
                      <div className="w-full h-56 bg-neutral-200 overflow-hidden relative">
                         <StorefrontProductImageGallery 
                            imageUrls={product.imagePreviewUrls || []} 
                            videoUrl={product.videoUrl}
                            productName={product.name}
                            onImageClick={(imageUrl) => handleOpenLightbox(product, imageUrl)}
                            onVideoClick={(videoUrl) => { /* Optionally handle video click directly or let lightbox handle */ }}
                         />
                      </div>
                      <div className="p-4 sm:p-5 flex-grow flex flex-col">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-1 group-hover:text-primary transition-colors truncate" title={product.name}>
                          {product.name}
                        </h3>
                        
                        <div className="flex items-start mb-3">
                          <CurrencyDollarIcon className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-neutral-700 mr-1 text-sm">Precio:</span>
                            <span className="font-semibold text-lg text-neutral-800">{formatPrice(displayPrices.finalPrice, displayPrices.currency)}</span>
                            {displayPrices.hasDiscount && (
                              <div className="text-xs text-neutral-500 mt-0.5">
                                <span>Antes: <del>{formatPrice(displayPrices.originalPriceForDisplay, displayPrices.currency)}</del></span>
                                <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  -{displayPrices.discountPercentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-neutral-500 mt-1 mb-2 flex-grow">
                          <p 
                            className={`whitespace-pre-wrap transition-all duration-300 ease-in-out ${!isDescriptionExpanded && showDescriptionToggle ? STOREFRONT_DESC_PREVIEW_LINE_CLAMP : ''}`}
                            title={!isDescriptionExpanded && showDescriptionToggle ? product.generatedDescription : undefined}
                          >
                            {product.generatedDescription}
                          </p>
                          {showDescriptionToggle && (
                            <button
                              onClick={() => toggleDescription(product.id)}
                              className="mt-1 text-xs text-primary hover:text-blue-700 font-semibold py-0.5 px-1 rounded hover:bg-primary/10 transition-colors"
                              aria-expanded={isDescriptionExpanded}
                            >
                              {isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>

                        <div className="mt-auto space-y-2">
                           <button
                            onClick={() => onAddToCart(product, displayPrices.finalPrice)}
                            className="w-full flex items-center justify-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150"
                            aria-label={`Añadir ${product.name} al carrito`}
                          >
                            <ShoppingCartIcon className="w-4 h-4 mr-2" />
                            Añadir al Carrito
                          </button>
                          <button
                            onClick={() => handleWhatsAppInquiry(product)}
                            disabled={!whatsappNumber}
                            className="w-full flex items-center justify-center px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            aria-label={`Consultar sobre ${product.name} por WhatsApp`}
                          >
                            <WhatsAppIcon className="w-4 h-4 mr-2" />
                            Consultar por WhatsApp
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <SearchIcon className="w-20 h-20 text-neutral-400 mx-auto mb-4" strokeWidth={1}/>
                  <p className="text-xl text-neutral-600">
                    No se encontraron productos para "<strong className="text-neutral-700">{searchTerm}</strong>".
                  </p>
                  <p className="text-neutral-500 mt-2">
                    Intenta con otra búsqueda o revisa nuestros productos destacados.
                  </p>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-20 h-20 text-neutral-400 mx-auto mb-4" />
                  <p className="text-xl text-neutral-600">
                    Actualmente no hay productos activos para mostrar.
                  </p>
                  <p className="text-neutral-500 mt-2">
                    Visita el panel de administración para agregar o activar productos.
                  </p>
                </>
              )}
            </div>
          )}
        </main>
        
        {whatsappNumber && (
          <button
              onClick={handleFloatingWhatsAppInquiry}
              className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 z-30"
              aria-label="Contactar por WhatsApp para una consulta general"
              title="Consulta General por WhatsApp"
          >
              <WhatsAppIcon className="w-7 h-7" />
          </button>
        )}


        <footer className="py-8 mt-12 border-t border-neutral-200 bg-neutral-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-neutral-500 text-sm">
            <p>
              {settings?.contactInfo ? (
                <>
                  Contacto: {settings.contactInfo} <br />
                </>
              ) : null}
               {settings?.whatsappNumber ? (
                <>
                  WhatsApp: {settings.whatsappNumber} <br />
                </>
              ) : null}
              &copy; {new Date().getFullYear()} {businessName}. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {isLightboxOpen && lightboxProduct && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={handleCloseLightbox}
          product={lightboxProduct}
          initialSelectedImageUrl={lightboxInitialImage}
        />
      )}
    </>
  );
};

if (typeof document !== 'undefined' && !document.getElementById('custom-scrollbar-thin-styles-storefront')) {
    const style = document.createElement('style');
    style.id = 'custom-scrollbar-thin-styles-storefront';
    style.textContent = `
      .custom-scrollbar-thin::-webkit-scrollbar {
        width: 4px; 
        height: 4px; 
      }
      .custom-scrollbar-thin::-webkit-scrollbar-track {
        background: transparent; 
      }
      .custom-scrollbar-thin::-webkit-scrollbar-thumb {
        background: #94a3b8; 
        border-radius: 2px; 
      }
      .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #64748b; 
      }
      .custom-scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: #94a3b8 transparent; 
      }
    `;
    document.head.appendChild(style);
}
