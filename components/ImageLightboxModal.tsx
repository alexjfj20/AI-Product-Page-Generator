
import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { XIcon, PhotoIcon, VideoCameraIcon } from './icons';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialSelectedImageUrl: string | null;
}

const imageLightboxKeyframes = `
  @keyframes lightboxFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes lightboxContentScaleUp {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('image-lightbox-keyframes')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "image-lightbox-keyframes";
  styleSheet.type = "text/css";
  styleSheet.innerText = imageLightboxKeyframes;
  document.head.appendChild(styleSheet);
}

// Helper function to get YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper function to get Vimeo video ID
const getVimeoId = (url: string): string | null => {
  const regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return match ? match[3] : null;
};


export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  product,
  initialSelectedImageUrl,
}) => {
  const [currentLargeImage, setCurrentLargeImage] = useState<string | null>(initialSelectedImageUrl);
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');

  useEffect(() => {
    if (product?.videoUrl && !initialSelectedImageUrl) {
      setActiveTab('videos');
    } else if (initialSelectedImageUrl) {
        setActiveTab('images');
        setCurrentLargeImage(initialSelectedImageUrl);
    } else if (product?.imagePreviewUrls && product.imagePreviewUrls.length > 0) {
        setActiveTab('images');
        setCurrentLargeImage(product.imagePreviewUrls[0]);
    } else if (product?.videoUrl) {
        setActiveTab('videos');
    } else {
        setActiveTab('images'); // Default fallback
        setCurrentLargeImage(null);
    }
  }, [initialSelectedImageUrl, product]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) {
    return null;
  }

  const images = product.imagePreviewUrls || [];
  const videoUrl = product.videoUrl;

  const renderMediaContent = () => {
    if (activeTab === 'videos' && videoUrl) {
      const youtubeId = getYouTubeId(videoUrl);
      if (youtubeId) {
        return (
          <iframe
            className="w-full h-full aspect-video"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={`Video de ${product.name} en YouTube`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            aria-label={`Video de ${product.name} en YouTube`}
          ></iframe>
        );
      }
      const vimeoId = getVimeoId(videoUrl);
      if (vimeoId) {
        return (
          <iframe
            className="w-full h-full aspect-video"
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
            title={`Video de ${product.name} en Vimeo`}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            aria-label={`Video de ${product.name} en Vimeo`}
          ></iframe>
        );
      }
      // Fallback to <video> tag for direct links or other platforms
      return (
        <video
          key={videoUrl} // Key to re-mount if URL changes
          src={videoUrl}
          controls
          autoPlay
          className="max-w-full max-h-full object-contain"
          aria-label={`Video de ${product.name}`}
        >
          Tu navegador no soporta la etiqueta de video. <a href={videoUrl} target="_blank" rel="noopener noreferrer">Ver video</a>
        </video>
      );
    } else if (activeTab === 'images') {
      const imageToDisplay = currentLargeImage || (images.length > 0 ? images[0] : null);
      if (imageToDisplay) {
        return (
          <img
            src={imageToDisplay}
            alt={`Vista ampliada de ${product.name}`}
            className="max-w-full max-h-full object-contain transition-opacity duration-300"
          />
        );
      } else {
        return <div className="flex flex-col items-center justify-center text-neutral-500"><PhotoIcon className="w-24 h-24" /><p>No hay imagen</p></div>;
      }
    }
    // Default fallback if no media available for the active tab
    return <div className="flex flex-col items-center justify-center text-neutral-500"><VideoCameraIcon className="w-24 h-24" /><p>No hay contenido multimedia disponible.</p></div>;
  };


  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-0 sm:p-4"
      style={{ animation: 'lightboxFadeIn 0.3s ease-out forwards' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-product-name"
    >
      <div
        className="bg-white shadow-2xl rounded-none sm:rounded-lg w-full h-full sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl sm:max-h-[800px] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'lightboxContentScaleUp 0.3s ease-out 0.1s forwards', opacity: 0 }}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {videoUrl && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`text-sm font-medium px-2 py-1 ${activeTab === 'videos' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                VIDEOS
              </button>
            )}
            {images.length > 0 && (
              <button
                onClick={() => { setActiveTab('images'); if(images.length > 0 && !currentLargeImage) setCurrentLargeImage(images[0]);}}
                className={`text-sm font-medium px-2 py-1 ${activeTab === 'images' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                IMÁGENES
              </button>
            )}
          </div>
          <div className="flex items-center">
            <h2 id="lightbox-product-name" className="text-sm sm:text-base font-semibold text-neutral-700 mr-4 hidden sm:block truncate max-w-xs" title={product.name}>
                {product.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded-full transition-colors"
              aria-label="Cerrar vista ampliada"
            >
              <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-3/4 h-2/3 md:h-full bg-neutral-900 flex items-center justify-center p-1 sm:p-2 overflow-hidden relative">
            {renderMediaContent()}
          </div>

          <div className="w-full md:w-1/4 h-1/3 md:h-full bg-white border-l border-neutral-200 flex flex-col p-3 sm:p-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-800 mb-2 sm:hidden">{product.name}</h3>
            <p className="text-xs sm:text-sm text-neutral-600 mb-3 leading-relaxed line-clamp-5 md:line-clamp-none">
              {product.generatedDescription}
            </p>
            {activeTab === 'images' && (
              <p className="text-xs text-neutral-500 mb-3">
                Estilo: <span className="font-medium text-neutral-600">RTX 4060 | 1TB (Ejemplo)</span>
              </p>
            )}
            {activeTab === 'videos' && (
                 <p className="text-xs text-neutral-500 mb-3">
                    Viendo video del producto.
                </p>
            )}

            <div className="mt-auto pt-3 border-t border-neutral-200">
              <h4 className="text-xs font-semibold text-neutral-700 mb-2">
                {activeTab === 'images' ? 'Más imágenes:' : (images.length > 0 ? 'Cambiar a Imágenes:' : 'Imágenes no disponibles')}
              </h4>
              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-1.5 sm:gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveTab('images');
                        setCurrentLargeImage(img);
                      }}
                      className={`aspect-square rounded-md overflow-hidden border-2 focus:outline-none transition-all duration-150
                                  ${activeTab === 'images' && img === currentLargeImage ? 'border-primary ring-1 ring-primary' : 'border-neutral-200 hover:border-neutral-400'}`}
                      aria-label={`Seleccionar imagen ${index + 1}`}
                    >
                      <img src={img} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : activeTab === 'images' && (
                <p className="text-xs text-neutral-400">No hay más imágenes disponibles.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
