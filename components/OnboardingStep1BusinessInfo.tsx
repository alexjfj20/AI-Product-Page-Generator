import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import { PREDEFINED_CATEGORIES } from '../constants'; // Importar categorías predefinidas

export interface OnboardingStep1Data {
  businessName: string;
  businessCategory: string;
}

interface OnboardingStep1BusinessInfoProps {
  initialBusinessName: string;
  initialBusinessCategory: string;
  onSubmit: (data: OnboardingStep1Data) => void;
}

export const OnboardingStep1BusinessInfo: React.FC<OnboardingStep1BusinessInfoProps> = ({ 
  initialBusinessName, 
  initialBusinessCategory,
  onSubmit 
}) => {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [businessCategory, setBusinessCategory] = useState(initialBusinessCategory || PREDEFINED_CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError("El nombre del negocio es obligatorio.");
      return;
    }
    if (!businessCategory.trim()) {
      setError("La categoría del negocio es obligatoria.");
      return;
    }
    setError(null);
    onSubmit({ businessName: businessName.trim(), businessCategory });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-12 w-full max-w-lg text-center border border-neutral-200">
        <div className="flex items-center justify-center mb-6">
          <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
            ¡Bienvenido/a!
          </h1>
        </div>
        <p className="text-neutral-600 mb-2 text-sm sm:text-base">
          Vamos a configurar tu tienda. Empecemos con lo básico.
        </p>
        <p className="text-neutral-500 mb-8 text-xs sm:text-sm">
          Paso 1 de 2: Información del Negocio
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre de tu Negocio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="businessName"
              id="businessName"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="Ej: Mi Tienda Creativa"
              required
              aria-required="true"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="businessCategory" className="block text-sm font-medium text-neutral-700 mb-1">
              Categoría de tu Negocio <span className="text-red-500">*</span>
            </label>
            <select
              name="businessCategory"
              id="businessCategory"
              value={businessCategory}
              onChange={(e) => {
                setBusinessCategory(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              required
              aria-required="true"
            >
              {PREDEFINED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150"
          >
            Siguiente Paso
          </button>
        </form>
      </div>
      <footer className="absolute bottom-6 text-center text-neutral-500 text-sm w-full">
        <p>&copy; {new Date().getFullYear()} Generador AI de Páginas de Producto.</p>
      </footer>
    </div>
  );
};