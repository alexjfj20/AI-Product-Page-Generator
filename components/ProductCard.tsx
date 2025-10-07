
import React, { useState, useEffect } from 'react';
import { Product, ProductStatus } from '../types';
import { TagIcon, LightbulbIcon, PencilIcon, TrashIcon, PhotoIcon, CheckCircleIcon, MinusCircleIcon, ExclamationCircleIcon, Square2StackIcon, CubeIcon, SwitchHorizontalIcon, VideoCameraIcon, CurrencyDollarIcon } from './icons';
import { Modal } from './Modal';
import { calculateDisplayPrices, formatPrice } from '../utils'; // Importar utilidades

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
  onUpdateStatus: (productId: string) => void;
}

const getStatusStyles = (status: ProductStatus): { icon: JSX.Element, badgeClass: string, text: string } => {
  switch (status) {
    case ProductStatus.Activo:
      return { 
        icon: <CheckCircleIcon className="w-4 h-4 text-green-500" />, 
        badgeClass: "bg-green-100 text-green-700",
        text: "Activo"
      };
    case ProductStatus.Inactivo:
      return { 
        icon: <MinusCircleIcon className="w-4 h-4 text-neutral-500" />, 
        badgeClass: "bg-neutral-200 text-neutral-700",
        text: "Inactivo"
      };
    case ProductStatus.Agotado:
      return { 
        icon: <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />, 
        badgeClass: "bg-yellow-100 text-yellow-700",
        text: "Agotado"
      };
    default: 
      return { 
        icon: <MinusCircleIcon className="w-4 h-4 text-neutral-500" />, 
        badgeClass: "bg-neutral-200 text-neutral-700",
        text: "Desconocido"
      };
  }
};

const getStockStyles = (stock: number | undefined): { text: string; className: string } => {
  if (stock === undefined) {
    return { text: 'N/D', className: 'text-neutral-500' };
  }
  if (stock === 0) {
    return { text: `${stock} Unidades`, className: 'text-red-500 font-medium' };
  }
  if (stock < 5) { // Umbral de bajo stock
    return { text: `${stock} Unidades`, className: 'text-yellow-600 font-medium' };
  }
  return { text: `${stock} Unidades`, className: 'text-neutral-600' };
};

const DESCRIPTION_PREVIEW_MAX_HEIGHT_COLLAPSED = 'max-h-20'; // Approx 3-4 lines
const DESCRIPTION_MAX_HEIGHT_EXPANDED = 'max-h-60'; // Allow more space, then scroll
const DESCRIPTION_TOGGLE_THRESHOLD = 100; // Character length to determine if toggle is needed


export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onDuplicate, onUpdateStatus }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMainImageUrl, setCurrentMainImageUrl] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const images = product.imagePreviewUrls || [];
  const displayPrices = calculateDisplayPrices(product);

  useEffect(() => {
    if (images.length > 0) {
      setCurrentMainImageUrl(images[0]);
    } else {
      setCurrentMainImageUrl(null);
    }
  }, [product.imagePreviewUrls]); 

  const handleThumbnailClick = (imageUrl: string) => {
    setCurrentMainImageUrl(imageUrl);
  };

  const handleDeleteRequest = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(product.id);
    setIsDeleteModalOpen(false);
  };

  const statusInfo = getStatusStyles(product.status);
  const stockInfo = getStockStyles(product.stock);

  const getNextStatusActionText = (): string => {
    switch (product.status) {
      case ProductStatus.Activo: return "Marcar como Inactivo";
      case ProductStatus.Inactivo: return "Marcar como Activo";
      case ProductStatus.Agotado: return "Marcar como Activo";
      default: return "Cambiar Estado";
    }
  };

  const MAX_THUMBNAILS_VISIBLE = 4; 
  const displayedThumbnails = images.slice(0, MAX_THUMBNAILS_VISIBLE);

  return (
    <>
      <article aria-labelledby={`product-name-${product.id}`} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-neutral-200 hover:shadow-xl transition-shadow duration-300">
        <div className="w-full h-56 bg-neutral-200 overflow-hidden relative flex">
          {images.length > 1 ? (
            <>
              <div className="w-1/5 h-full flex flex-col space-y-1 p-1 overflow-y-auto custom-scrollbar-thin">
                {displayedThumbnails.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(imgUrl)}
                    className={`aspect-square w-full rounded-sm overflow-hidden border-2 focus:outline-none transition-all duration-200
                                ${imgUrl === currentMainImageUrl ? 'border-primary shadow-md' : 'border-transparent hover:border-neutral-400 opacity-70 hover:opacity-100'}`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${index + 1} de ${product.name}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="w-4/5 h-full relative">
                {currentMainImageUrl ? (
                  <img
                    src={currentMainImageUrl}
                    alt={`Imagen principal de ${product.name}`}
                    className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                    <PhotoIcon className="w-16 h-16 text-neutral-400" />
                  </div>
                )}
              </div>
            </>
          ) : images.length === 1 ? (
            <div className="w-full h-full relative">
              <img
                src={images[0]}
                alt={`Imagen de ${product.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <PhotoIcon className="w-16 h-16 text-neutral-400" />
            </div>
          )}
           <span 
              className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full flex items-center shadow ${statusInfo.badgeClass} z-10`}
              title={`Estado: ${statusInfo.text}`}
            >
              {statusInfo.icon}
              <span className="ml-1.5">{statusInfo.text}</span>
            </span>
            {product.videoUrl && (
                <span
                    className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center shadow-lg z-10"
                    title="Video disponible"
                >
                    <VideoCameraIcon className="w-3.5 h-3.5 mr-1" strokeWidth={2}/> Video
                </span>
            )}
        </div>
        
        <div className="p-5 sm:p-6 flex-grow flex flex-col">
          <h3 id={`product-name-${product.id}`} className="text-xl font-semibold text-primary mb-3 truncate" title={product.name}>
            {product.name}
          </h3>
          
          <div className="space-y-3 text-sm text-neutral-600 mb-4 flex-grow">
            <p className="flex items-center">
              <TagIcon className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0" />
              <span className="font-medium text-neutral-700 mr-1">Categoría:</span> {product.category}
            </p>
            
            <div className="flex items-start">
              <CurrencyDollarIcon className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-neutral-700 mr-1">Precio:</span>
                <span className="font-semibold text-lg text-neutral-800">{formatPrice(displayPrices.finalPrice, displayPrices.currency)}</span>
                {displayPrices.hasDiscount && (
                  <div className="text-xs text-neutral-500">
                    <span>Antes: {formatPrice(displayPrices.originalPriceForDisplay, displayPrices.currency)}</span>
                    <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                      -{displayPrices.discountPercentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>

             <p className="flex items-center">
              <CubeIcon className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0" />
              <span className="font-medium text-neutral-700 mr-1">Stock:</span> 
              <span className={stockInfo.className}>{stockInfo.text}</span>
            </p>
            <p className="flex items-start">
              <LightbulbIcon className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-neutral-700">Idea:</span>
                <span className="block text-neutral-500 italic text-xs leading-tight">{product.idea}</span>
              </div>
            </p>
          </div>

          <div className="mt-auto">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-1">Descripción Generada:</h4>
            <div 
              className={`text-sm text-neutral-700 bg-neutral-50 p-3 rounded-md border border-neutral-200 leading-relaxed whitespace-pre-wrap transition-all duration-300 ease-in-out overflow-hidden
                          ${isDescriptionExpanded ? `${DESCRIPTION_MAX_HEIGHT_EXPANDED} overflow-y-auto custom-scrollbar` : `${DESCRIPTION_PREVIEW_MAX_HEIGHT_COLLAPSED}`}`}
              title={!isDescriptionExpanded && product.generatedDescription.length > DESCRIPTION_TOGGLE_THRESHOLD ? product.generatedDescription : undefined}
            >
              {product.generatedDescription}
            </div>
            {product.generatedDescription.length > DESCRIPTION_TOGGLE_THRESHOLD && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-1.5 text-xs text-primary hover:text-blue-700 font-medium"
                aria-expanded={isDescriptionExpanded}
              >
                {isDescriptionExpanded ? 'Leer menos' : 'Leer más'}
              </button>
            )}
          </div>
        </div>
        
         <div className="bg-neutral-50 p-3 border-t border-neutral-200 flex justify-end space-x-2">
              <button 
                onClick={() => onUpdateStatus(product.id)}
                className="p-2 text-neutral-600 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-colors duration-150"
                aria-label={getNextStatusActionText()}
                title={getNextStatusActionText()}
              >
                <SwitchHorizontalIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onDuplicate(product)}
                className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-500/10 rounded-md transition-colors duration-150"
                aria-label={`Duplicar ${product.name}`}
                title="Duplicar Producto"
              >
                <Square2StackIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onEdit(product)}
                className="p-2 text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-md transition-colors duration-150"
                aria-label={`Editar ${product.name}`}
                title="Editar Producto"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDeleteRequest}
                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors duration-150"
                aria-label={`Eliminar ${product.name}`}
                title="Eliminar Producto"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
          </div>
      </article>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      >
        <p>¿Estás seguro de que quieres eliminar el producto <strong className="font-medium text-neutral-700">"{product.name}"</strong>?</p>
        <p className="mt-2 text-xs text-neutral-500">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  );
};

if (typeof document !== 'undefined' && !document.getElementById('custom-scrollbar-thin-styles')) {
  const style = document.createElement('style');
  style.id = 'custom-scrollbar-thin-styles';
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
