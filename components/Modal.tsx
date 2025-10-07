
import React, { useEffect, useRef } from 'react';
import { XIcon, LoadingSpinnerIcon } from './icons'; // Added LoadingSpinnerIcon

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
  size?: 'md' | 'lg' | 'xl'; // Optional size prop
}

const modalKeyframes = `
  @keyframes modalShowAnim {
    0% {
      transform: translateY(20px) scale(0.98);
      opacity: 0;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

let keyframesInjected = false;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonClass = "bg-primary hover:bg-blue-700 focus:ring-primary",
  isLoading = false,
  size = 'md', // Default size
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!keyframesInjected) {
      const styleElement = document.createElement('style');
      styleElement.id = 'modal-animation-keyframes';
      styleElement.textContent = modalKeyframes;
      document.head.appendChild(styleElement);
      keyframesInjected = true;
    }
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Focus the modal panel or the confirm button for accessibility
      // Prefer focusing the confirm button if available, otherwise the panel.
      setTimeout(() => { // Timeout helps ensure the element is focusable after rendering
        if (confirmButtonRef.current) {
           // confirmButtonRef.current.focus();
        } else if (modalRef.current) {
          // modalRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-150 ease-linear"
      // onClick={!isLoading ? onClose : undefined} // Close on overlay click only if not loading
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]} flex flex-col transform opacity-0 scale-95`}
        onClick={e => e.stopPropagation()}
        style={{
          animationName: 'modalShowAnim',
          animationDuration: '0.25s',
          animationTimingFunction: 'cubic-bezier(0.165, 0.84, 0.44, 1)', // Smoother ease-out
          animationFillMode: 'forwards',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <h3 id="modal-title" className="text-lg font-semibold text-neutral-800">
            {title}
          </h3>
          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 120px)' }}> {/* Adjusted max height */}
          {children}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-5 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-400 disabled:opacity-70 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-70 transition-colors flex items-center justify-center min-w-[100px] ${confirmButtonClass} ${isLoading ? 'cursor-wait' : ''}`}
          >
            {isLoading ? (
              <LoadingSpinnerIcon className="w-4 h-4 text-white" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
