import React, { useState, useRef } from 'react';
import { BusinessSettings } from '../types';
import { UploadCloudIcon, SparklesIcon, ArrowLeftIcon } from './icons';

export interface OnboardingStep2Data extends Pick<BusinessSettings, 'primaryColor' | 'logoPreviewUrl' | 'whatsappNumber' | 'contactInfo'> {}

interface OnboardingStep2PersonalizationProps {
  initialSettings: OnboardingStep2Data;
  onSubmit: (settings: OnboardingStep2Data) => void;
  onNavigateBack: () => void;
}

const MAX_LOGO_SIZE_MB = 2;

const predefinedColors = [
    { label: "Azul (Por defecto)", value: "#2563eb" },
    { label: "Verde Esmeralda", value: "#10b981" },
    { label: "Rojo Carmesí", value: "#dc2626" },
    { label: "Púrpura Intenso", value: "#7c3aed" },
    { label: "Naranja Brillante", value: "#f97316" },
    { label: "Gris Pizarra", value: "#475569" },
];

export const OnboardingStep2Personalization: React.FC<OnboardingStep2PersonalizationProps> = ({ 
  initialSettings, 
  onSubmit,
  onNavigateBack
}) => {
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor || '#2563eb');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(initialSettings.logoPreviewUrl || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber || '');
  const [contactInfo, setContactInfo] = useState(initialSettings.contactInfo || '');
  
  const [logoFile, setLogoFile] = useState<File | null>(null); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
    setErrorMessage(null);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`El logo es demasiado grande. Límite: ${MAX_LOGO_SIZE_MB}MB.`);
        if (logoInputRef.current) logoInputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Archivo no válido. Selecciona una imagen.");
        if (logoInputRef.current) logoInputRef.current.value = "";
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreviewUrl('');
    setLogoFile(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ primaryColor, logoPreviewUrl, whatsappNumber, contactInfo });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-12 w-full max-w-lg text-center border border-neutral-200">
        <div className="flex items-center justify-center mb-6">
          <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
            Personaliza tu Tienda
          </h1>
        </div>
        <p className="text-neutral-600 mb-2 text-sm sm:text-base">
          Dale un toque personal a tu nueva tienda online.
        </p>
         <p className="text-neutral-500 mb-8 text-xs sm:text-sm">
          Paso 2 de 2: Apariencia y Contacto
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Primary Color */}
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700 mb-1">
              Color Principal de tu Marca (Opcional)
            </label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="color"
                name="primaryColor"
                id="primaryColor"
                value={primaryColor}
                onChange={handleColorChange}
                className="h-10 w-10 sm:h-12 sm:w-12 p-0 border-none rounded-md cursor-pointer shadow-sm"
                title="Seleccionar color principal"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={handleColorChange}
                className="block w-full max-w-xs px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="#RRGGBB"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {predefinedColors.map(color => (
                    <button
                        type="button"
                        key={color.value}
                        title={color.label}
                        onClick={() => setPrimaryColor(color.value)}
                        className={`w-6 h-6 rounded-full shadow-sm border-2 ${primaryColor === color.value ? 'border-neutral-700 ring-2 ring-offset-1 ring-neutral-500' : 'border-transparent hover:border-neutral-400'}`}
                        style={{ backgroundColor: color.value }}
                        aria-label={`Seleccionar color ${color.label}`}
                    />
                ))}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label htmlFor="logoOnboarding" className="block text-sm font-medium text-neutral-700 mb-1">
              Logo de tu Negocio (Opcional, Máx. {MAX_LOGO_SIZE_MB}MB)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary"
                onClick={() => logoInputRef.current?.click()}
                role="button"
                aria-label="Cargar o cambiar logo"
              >
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Vista previa del logo" className="w-full h-full object-contain" />
                ) : (
                  <UploadCloudIcon className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
                )}
              </div>
              <input
                type="file"
                id="logoOnboarding" 
                name="logoOnboarding"
                ref={logoInputRef}
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleLogoChange}
                className="sr-only"
              />
              <div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                >
                  {logoPreviewUrl ? 'Cambiar Logo' : 'Subir Logo'}
                </button>
                {logoPreviewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
             <p className="mt-1 text-xs text-neutral-500">
              Recomendado: PNG transparente o JPG cuadrado.
            </p>
            {errorMessage && <p role="alert" className="mt-1 text-xs text-red-600">{errorMessage}</p>}
          </div>

          {/* WhatsApp Number */}
           <div>
            <label htmlFor="whatsappNumberOnboarding" className="block text-sm font-medium text-neutral-700 mb-1">
              Número de WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              name="whatsappNumberOnboarding"
              id="whatsappNumberOnboarding"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="Ej: +521234567890 (con código de país)"
            />
             <p className="mt-1 text-xs text-neutral-500">
              Para consultas directas de clientes.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <label htmlFor="contactInfoOnboarding" className="block text-sm font-medium text-neutral-700 mb-1">
              Información de Contacto Adicional (Opcional)
            </label>
            <textarea
              name="contactInfoOnboarding"
              id="contactInfoOnboarding"
              rows={2}
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="Ej: email@ejemplo.com, redes sociales"
            />
          </div>
          
          <div className="pt-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <button
                type="button"
                onClick={onNavigateBack}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 shadow-sm transition-colors duration-150 text-sm font-medium"
                title="Volver al paso anterior"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2 text-neutral-600" />
                Anterior
            </button>
            <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150"
            >
                Finalizar Configuración e Ir a la App
            </button>
          </div>
        </form>
      </div>
      <footer className="absolute bottom-6 text-center text-neutral-500 text-sm w-full">
        <p>&copy; {new Date().getFullYear()} Generador AI de Páginas de Producto.</p>
      </footer>
    </div>
  );
};