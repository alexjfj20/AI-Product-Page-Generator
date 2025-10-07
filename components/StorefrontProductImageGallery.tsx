
import React, { useState, useEffect } from 'react';
import { PhotoIcon, VideoCameraIcon } from './icons'; // Added VideoCameraIcon

interface StorefrontProductImageGalleryProps {
  imageUrls: string[];
  videoUrl?: string; // Added videoUrl
  productName: string; 
  onImageClick?: (imageUrl: string) => void; 
  onVideoClick?: (videoUrl: string) => void; // Callback when video thumbnail is clicked
}

export const StorefrontProductImageGallery: React.FC<StorefrontProductImageGalleryProps> = ({ 
  imageUrls, 
  videoUrl,
  productName, 
  onImageClick,
  onVideoClick
}) => {
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string | null>(null);
  
  const images = imageUrls || [];

  useEffect(() => {
    if (images.length > 0) {
      setCurrentDisplayUrl(images[0]);
      setCurrentMediaType('image');
    } else if (videoUrl) {
      setCurrentDisplayUrl(videoUrl);
      setCurrentMediaType('video');
    } else {
      setCurrentDisplayUrl(null);
      setCurrentMediaType('image');
    }
  }, [imageUrls, videoUrl]);

  const handleImageThumbnailClick = (imageUrl: string) => {
    setCurrentDisplayUrl(imageUrl);
    setCurrentMediaType('image');
  };

  const handleVideoThumbnailClick = () => {
    if (videoUrl) {
      setCurrentDisplayUrl(videoUrl);
      setCurrentMediaType('video');
      if (onVideoClick) {
        onVideoClick(videoUrl); // Notify parent if it wants to handle this (e.g., open in lightbox)
      }
    }
  };
  
  const handleMainMediaClick = () => {
    if (currentMediaType === 'image' && currentDisplayUrl && onImageClick) {
        onImageClick(currentDisplayUrl);
    } else if (currentMediaType === 'video' && currentDisplayUrl && onVideoClick) {
        onVideoClick(currentDisplayUrl);
    }
    // If it's a video and onVideoClick is not defined, it will just play inline if controls are enabled.
  };


  const MAX_THUMBNAILS_VISIBLE = 4; // Increased from 3 to 4
  const displayedImageThumbnails = images.slice(0, videoUrl ? MAX_THUMBNAILS_VISIBLE -1 : MAX_THUMBNAILS_VISIBLE);

  const mainMediaContent = () => {
    if (currentMediaType === 'video' && currentDisplayUrl) {
        return (
            <video 
                key={currentDisplayUrl} // Key to re-mount if URL changes
                src={currentDisplayUrl} 
                controls 
                autoPlay={false} // Consider UX for autoplay
                className="w-full h-full object-contain"
                aria-label={`Video de ${productName}`}
            >
                Tu navegador no soporta la etiqueta de video.
            </video>
        );
    }
    if (currentMediaType === 'image' && currentDisplayUrl) {
      return (
        <img
          src={currentDisplayUrl}
          alt={`Vista principal de ${productName}`}
          className="w-full h-full object-cover transition-opacity duration-300 ease-in-out group-hover:scale-105"
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
        <PhotoIcon className="w-16 h-16 text-neutral-400" />
      </div>
    );
  };
  

  if (images.length === 0 && !videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
        <PhotoIcon className="w-16 h-16 text-neutral-400" />
      </div>
    );
  }


  return (
    <div className="w-full h-full flex">
      {/* Thumbnails Column */}
      {(images.length > 0 || videoUrl) && (
        <div className="w-1/5 h-full flex flex-col space-y-1 p-1 overflow-y-auto custom-scrollbar-thin">
          {videoUrl && (
            <button
              onClick={handleVideoThumbnailClick}
              className={`aspect-square w-full rounded-sm overflow-hidden border-2 focus:outline-none transition-all duration-200 flex items-center justify-center
                          ${currentMediaType === 'video' ? 'border-primary shadow-md' : 'border-transparent hover:border-neutral-400 opacity-70 hover:opacity-100'}`}
              aria-label={`Ver video de ${productName}`}
            >
              <VideoCameraIcon className={`w-3/5 h-3/5 ${currentMediaType === 'video' ? 'text-primary' : 'text-neutral-500'}`} />
            </button>
          )}
          {displayedImageThumbnails.map((imgUrl, index) => (
            <button
              key={index}
              onClick={() => handleImageThumbnailClick(imgUrl)}
              className={`aspect-square w-full rounded-sm overflow-hidden border-2 focus:outline-none transition-all duration-200
                          ${currentMediaType === 'image' && imgUrl === currentDisplayUrl ? 'border-primary shadow-md' : 'border-transparent hover:border-neutral-400 opacity-70 hover:opacity-100'}`}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
            >
              <img
                src={imgUrl}
                alt={`Miniatura ${index + 1} de ${productName}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {/* Main Media Display */}
      <div className="w-4/5 h-full relative">
        <button
          type="button"
          onClick={handleMainMediaClick}
          className="w-full h-full block cursor-pointer focus:outline-none group"
          aria-label={`Ver ${currentMediaType === 'image' ? 'imagen ampliada' : 'video'} de ${productName}`}
        >
          {mainMediaContent()}
        </button>
      </div>
    </div>
  );
};
