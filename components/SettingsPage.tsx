
import React, { useState, useEffect, useRef } from 'react';
import { BusinessSettings, WhatsAppBusinessApiConfig } from '../types';
import { UploadCloudIcon, CheckCircleIcon, XIcon, SparklesIcon, LightbulbIcon, CreditCardIcon, CurrencyDollarIcon, QrCodeIcon, WhatsAppIcon, MinusCircleIcon, LoadingSpinnerIcon, EyeIcon, EyeOffIcon } from './icons';

interface SettingsPageProps {
  initialSettings: BusinessSettings | null;
  onSaveSettings: (settings: BusinessSettings) => void;
  onNavigateBack: () => void;
}

const MAX_IMAGE_SIZE_MB = 2; // Reutilizado para logo y QR

const orderPlaceholders = [
  { placeholder: "{businessName}", description: "Nombre de tu negocio." },
  { placeholder: "{cartItemsList}", description: "Lista de productos en el carrito (ej: - Producto A (x1) - $10.00)." },
  { placeholder: "{totalAmount}", description: "Monto total del pedido (ej: $25.50)." },
  { placeholder: "{customerNotes}", description: "Notas adicionales dejadas por el cliente." },
];

const inquiryPlaceholders = [
  { placeholder: "{businessName}", description: "Nombre de tu negocio." },
  { placeholder: "{productName}", description: "Nombre del producto (solo para consultas de producto)." },
  { placeholder: "{productPrice}", description: "Precio del producto (solo para consultas de producto)." },
];


export const SettingsPage: React.FC<SettingsPageProps> = ({ initialSettings, onSaveSettings, onNavigateBack }) => {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    primaryColor: '#2563eb', // Default Tailwind blue-600
    logoPreviewUrl: '',
    contactInfo: '',
    whatsappNumber: '',
    whatsappOrderTemplate: '',
    whatsappInquiryTemplate: '',
    enableCashOnDelivery: false,
    cashOnDeliveryInstructions: '',
    stripeApiKeyMock: '',
    stripeSecretKeyMock: '',
    paypalEmailMock: '',
    enableQrPayment: false,
    qrCodeImageUrl: '',
    qrPaymentInstructions: '',
    enableNequiPayment: false,
    nequiPhoneNumber: '',
    nequiPaymentInstructions: '',
    whatsappBusinessApiConfig: {
        phoneNumberId: '',
        accountId: '',
        accessToken: '',
        connectionStatus: 'disconnected',
        statusMessage: 'No configurado.',
    },
    ...initialSettings,
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null); // Específico para el logo
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null); // Específico para el QR
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);
  const [showToken, setShowToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessageResult, setTestMessageResult] = useState<{type: 'success' | 'error', message: string} | null>(null);


  useEffect(() => {
    // Esta función combina los valores iniciales con los defaults, asegurando que todos los campos existan.
    const mergedSettings: BusinessSettings = {
        businessName: '',
        primaryColor: '#2563eb',
        logoPreviewUrl: '',
        contactInfo: '',
        whatsappNumber: '',
        whatsappOrderTemplate: '',
        whatsappInquiryTemplate: '',
        enableCashOnDelivery: false,
        cashOnDeliveryInstructions: '',
        stripeApiKeyMock: '',
        stripeSecretKeyMock: '',
        paypalEmailMock: '',
        enableQrPayment: false,
        qrCodeImageUrl: '',
        qrPaymentInstructions: '',
        enableNequiPayment: false,
        nequiPhoneNumber: '',
        nequiPaymentInstructions: '',
        ...initialSettings,
        whatsappBusinessApiConfig: {
            ... {
                phoneNumberId: '',
                accountId: '',
                accessToken: '',
                connectionStatus: 'disconnected',
                statusMessage: 'No configurado.',
            },
            ...initialSettings?.whatsappBusinessApiConfig,
        }
    };
    setSettings(mergedSettings);
  }, [initialSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  };
  
  const handleWpApiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      whatsappBusinessApiConfig: {
        ...prev.whatsappBusinessApiConfig,
        [name]: value,
      }
    }));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, primaryColor: e.target.value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>,
    setImagePreviewUrlKey: keyof Pick<BusinessSettings, 'logoPreviewUrl' | 'qrCodeImageUrl'>,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`La imagen es demasiado grande. Límite: ${MAX_IMAGE_SIZE_MB}MB.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Archivo no válido. Selecciona una imagen.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [setImagePreviewUrlKey]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      setErrorMessage(null);
    }
  };

  const handleRemoveImage = (
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>,
    setImagePreviewUrlKey: keyof Pick<BusinessSettings, 'logoPreviewUrl' | 'qrCodeImageUrl'>,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    setSettings(prev => ({ ...prev, [setImagePreviewUrlKey]: '' }));
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settings);
    setSuccessMessage("¡Configuración guardada exitosamente!");
    window.scrollTo(0, 0); // Scroll to top to see success message
  };

  const handleValidateWpApi = () => {
    if (!settings.whatsappBusinessApiConfig?.phoneNumberId || !settings.whatsappBusinessApiConfig?.accessToken) {
        setErrorMessage("El ID de Número de Teléfono y el Token de Acceso son obligatorios para validar.");
        return;
    }
    
    setIsTestingConnection(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    setTimeout(() => {
        let newConfig: WhatsAppBusinessApiConfig = { ...settings.whatsappBusinessApiConfig };

        // Simulación: Un token específico funciona.
        if (settings.whatsappBusinessApiConfig?.accessToken === 'VALID_MOCK_TOKEN') {
            newConfig.connectionStatus = 'connected';
            newConfig.statusMessage = `Conectado exitosamente el ${new Date().toLocaleString()}`;
            setSuccessMessage("¡Conexión con WhatsApp Business API validada exitosamente!");
        } else {
            newConfig.connectionStatus = 'error';
            newConfig.statusMessage = `Falló la conexión. Token de acceso inválido o expirado.`;
            setErrorMessage("Falló la validación de la conexión. Revisa tus credenciales.");
        }

        const updatedSettings = {...settings, whatsappBusinessApiConfig: newConfig };
        setSettings(updatedSettings);
        onSaveSettings(updatedSettings); // Guardar el nuevo estado de conexión

        setIsTestingConnection(false);
    }, 1500);
  };

  const handleSendTestMessage = () => {
    if (!testPhoneNumber) {
        setTestMessageResult({ type: 'error', message: 'Ingresa un número para la prueba.' });
        return;
    }
    setIsSendingTest(true);
    setTestMessageResult(null);

    setTimeout(() => {
        // Simulación de envío
        setTestMessageResult({ type: 'success', message: `Mensaje de prueba enviado a ${testPhoneNumber}.` });
        setIsSendingTest(false);
        setTimeout(() => setTestMessageResult(null), 5000);
    }, 1500);
  };
  
  const predefinedColors = [
    { label: "Azul (Por defecto)", value: "#2563eb" },
    { label: "Verde Esmeralda", value: "#10b981" },
    { label: "Rojo Carmesí", value: "#dc2626" },
    { label: "Púrpura Intenso", value: "#7c3aed" },
    { label: "Naranja Brillante", value: "#f97316" },
    { label: "Gris Pizarra", value: "#475569" },
  ];

  const PlaceholderInfo: React.FC<{ placeholders: { placeholder: string; description: string }[] }> = ({ placeholders }) => (
    <div className="mt-2 p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-600">
      <p className="font-medium mb-1 flex items-center"><LightbulbIcon className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />Placeholders Disponibles:</p>
      <ul className="list-disc list-inside pl-1 space-y-0.5">
        {placeholders.map(p => <li key={p.placeholder}><strong>{p.placeholder}</strong>: {p.description}</li>)}
      </ul>
    </div>
  );
  
  const ConnectionStatusIndicator = () => {
    const config = settings.whatsappBusinessApiConfig;
    if (!config) return null;
    let icon, color, text;
    switch(config.connectionStatus) {
        case 'connected':
            icon = <CheckCircleIcon className="w-4 h-4 text-green-500" />;
            color = 'text-green-700';
            text = 'Conectado';
            break;
        case 'error':
            icon = <XIcon className="w-4 h-4 text-red-500" />;
            color = 'text-red-700';
            text = 'Error de Conexión';
            break;
        case 'disconnected':
        default:
            icon = <MinusCircleIcon className="w-4 h-4 text-neutral-500" />;
            color = 'text-neutral-600';
            text = 'No Conectado';
            break;
    }
    return (
        <div className="flex items-center space-x-2" title={config.statusMessage}>
            {icon}
            <span className={`text-sm font-medium ${color}`}>{text}</span>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 w-full max-w-3xl flex items-center justify-between">
         <div className="flex items-center">
           <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mr-2 sm:mr-3" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
              Configuración del Negocio
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Personaliza la apariencia y datos de tu tienda.
            </p>
          </div>
        </div>
         <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 shadow-sm transition-colors duration-150 text-sm font-medium"
            title="Volver al Panel"
          >
            Volver al Panel
        </button>
      </header>

      <main className="w-full max-w-2xl bg-white p-6 sm:p-8 shadow-xl rounded-xl border border-neutral-200">
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-neutral-200">
          
          {/* General Settings Section */}
          <section className="pt-8 first:pt-0">
            <h2 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2 text-primary/80" />
                Información General y Apariencia
            </h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  value={settings.businessName || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                  placeholder="Ej: Mi Tienda Fantástica"
                />
              </div>

              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700 mb-1">
                  Color Principal de la Marca
                </label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="color"
                    name="primaryColor"
                    id="primaryColor"
                    value={settings.primaryColor || '#2563eb'}
                    onChange={handleColorChange}
                    className="h-10 w-10 sm:h-12 sm:w-12 p-0 border-none rounded-md cursor-pointer shadow-sm"
                    title="Seleccionar color principal"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor || '#2563eb'}
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
                            onClick={() => setSettings(prev => ({ ...prev, primaryColor: color.value }))}
                            className={`w-6 h-6 rounded-full shadow-sm border-2 ${settings.primaryColor === color.value ? 'border-neutral-700 ring-2 ring-offset-1 ring-neutral-500' : 'border-transparent hover:border-neutral-400'}`}
                            style={{ backgroundColor: color.value }}
                            aria-label={`Seleccionar color ${color.label}`}
                        />
                    ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Logo del Negocio (Máx. {MAX_IMAGE_SIZE_MB}MB)
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary"
                    onClick={() => logoInputRef.current?.click()}
                    role="button"
                    aria-label="Cargar o cambiar logo"
                  >
                    {settings.logoPreviewUrl ? (
                      <img src={settings.logoPreviewUrl} alt="Vista previa del logo" className="w-full h-full object-contain" />
                    ) : (
                      <UploadCloudIcon className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    ref={logoInputRef}
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={(e) => handleImageChange(e, setLogoFile, 'logoPreviewUrl', logoInputRef)}
                    className="sr-only"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                    >
                      {settings.logoPreviewUrl ? 'Cambiar Logo' : 'Subir Logo'}
                    </button>
                    {settings.logoPreviewUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(setLogoFile, 'logoPreviewUrl', logoInputRef)}
                        className="ml-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
                 <p className="mt-1 text-xs text-neutral-500">
                  Recomendado: Archivo PNG transparente o JPG cuadrado.
                </p>
              </div>

              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-neutral-700 mb-1">
                  Número de WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  id="whatsappNumber"
                  value={settings.whatsappNumber || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                  placeholder="Ej: +521234567890 (con código de país)"
                />
                 <p className="mt-1 text-xs text-neutral-500">
                  Incluye el código de país (ej. +52 para México, +34 para España).
                </p>
              </div>

              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Información de Contacto Adicional (Opcional)
                </label>
                <textarea
                  name="contactInfo"
                  id="contactInfo"
                  rows={3}
                  value={settings.contactInfo || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                  placeholder="Ej: email@ejemplo.com, dirección de la tienda"
                />
              </div>

              {/* Plantilla de Mensaje de Pedido por WhatsApp */}
              <div>
                <label htmlFor="whatsappOrderTemplate" className="block text-sm font-medium text-neutral-700 mb-1">
                  Plantilla de Mensaje de Pedido por WhatsApp (Opcional)
                </label>
                <textarea
                  name="whatsappOrderTemplate"
                  id="whatsappOrderTemplate"
                  rows={5}
                  value={settings.whatsappOrderTemplate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                  placeholder="Ej: Hola {businessName}, quiero confirmar mi pedido: {cartItemsList} Total: {totalAmount}. Mis notas: {customerNotes}. Gracias."
                />
                <PlaceholderInfo placeholders={orderPlaceholders} />
              </div>

              {/* Plantilla de Mensaje de Consulta por WhatsApp */}
              <div>
                <label htmlFor="whatsappInquiryTemplate" className="block text-sm font-medium text-neutral-700 mb-1">
                  Plantilla de Mensaje de Consulta por WhatsApp (Opcional)
                </label>
                <textarea
                  name="whatsappInquiryTemplate"
                  id="whatsappInquiryTemplate"
                  rows={4}
                  value={settings.whatsappInquiryTemplate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                  placeholder="Ej: Hola {businessName}, estoy interesado/a en el producto: {productName}. ¿Podrías darme más información?"
                />
                 <PlaceholderInfo placeholders={inquiryPlaceholders} />
              </div>
            </div>
          </section>

          {/* WhatsApp Business API Section */}
          <section className="pt-8">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-neutral-700 flex items-center">
                    <WhatsAppIcon className="w-6 h-6 mr-2 text-green-500" />
                    Configuración de WhatsApp Business API
                </h2>
                <ConnectionStatusIndicator />
            </div>

            <div className="p-4 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-50 text-yellow-800 text-xs mb-6">
                <strong>Advertencia de Seguridad:</strong> No guardes tokens de acceso reales en esta demostración. Esta funcionalidad es <strong>simulada</strong> y los datos se guardan localmente en tu navegador sin cifrado real. Para probar la conexión, usa el token: <code className="font-mono bg-yellow-200 px-1 rounded">VALID_MOCK_TOKEN</code>.
            </div>

            <div className="space-y-6">
                 <div>
                    <label htmlFor="phoneNumberId" className="block text-sm font-medium text-neutral-700 mb-1">ID de Número de Teléfono (Phone Number ID)</label>
                    <input type="text" name="phoneNumberId" id="phoneNumberId" value={settings.whatsappBusinessApiConfig?.phoneNumberId || ''} onChange={handleWpApiInputChange} className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Ej: 1054..." />
                </div>
                 <div>
                    <label htmlFor="accountId" className="block text-sm font-medium text-neutral-700 mb-1">ID de Cuenta de WhatsApp Business (Account ID)</label>
                    <input type="text" name="accountId" id="accountId" value={settings.whatsappBusinessApiConfig?.accountId || ''} onChange={handleWpApiInputChange} className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Ej: 1098..." />
                </div>
                <div>
                    <label htmlFor="accessToken" className="block text-sm font-medium text-neutral-700 mb-1">Token de Acceso Permanente</label>
                    <div className="relative">
                        <input type={showToken ? 'text' : 'password'} name="accessToken" id="accessToken" value={settings.whatsappBusinessApiConfig?.accessToken || ''} onChange={handleWpApiInputChange} className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Pega tu token aquí"/>
                        <button type="button" onClick={() => setShowToken(!showToken)} className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-500 hover:text-primary" title={showToken ? "Ocultar token" : "Mostrar token"}>
                            {showToken ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
                 <button type="button" onClick={handleValidateWpApi} disabled={isTestingConnection} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60">
                    {isTestingConnection ? <><LoadingSpinnerIcon className="w-4 h-4 mr-2"/> Validando...</> : 'Guardar y Validar Conexión'}
                </button>
            </div>
            
            {settings.whatsappBusinessApiConfig?.connectionStatus === 'connected' && (
                <div className="mt-6 pt-6 border-t border-dashed">
                    <h3 className="text-md font-semibold text-neutral-700 mb-2">Probar Envío de Mensaje</h3>
                    <div className="flex items-center space-x-2">
                        <input type="tel" value={testPhoneNumber} onChange={(e) => setTestPhoneNumber(e.target.value)} className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" placeholder="Número de prueba (ej: +52...)" />
                        <button type="button" onClick={handleSendTestMessage} disabled={isSendingTest} className="px-4 py-2 text-sm font-medium text-primary border border-primary/50 rounded-md hover:bg-primary/10 disabled:opacity-60 flex items-center whitespace-nowrap">
                             {isSendingTest && <LoadingSpinnerIcon className="w-4 h-4 mr-1.5 text-primary" />}
                            Enviar
                        </button>
                    </div>
                    {testMessageResult && (
                        <p className={`mt-2 text-xs ${testMessageResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{testMessageResult.message}</p>
                    )}
                </div>
            )}
          </section>


          {/* Payment Settings Section */}
          <section className="pt-8">
            <h2 className="text-lg font-semibold text-neutral-700 mb-6 flex items-center">
                <CreditCardIcon className="w-6 h-6 mr-2 text-primary/80" />
                Configuración de Pagos (Simulado)
            </h2>
            <div className="space-y-6">
                {/* Pago Contra Entrega */}
                <div className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="enableCashOnDelivery"
                            id="enableCashOnDelivery"
                            checked={settings.enableCashOnDelivery || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="enableCashOnDelivery" className="ml-2 block text-sm font-medium text-neutral-700">
                            Habilitar Pago Contra Entrega
                        </label>
                    </div>
                    {settings.enableCashOnDelivery && (
                         <div className="mt-3">
                            <label htmlFor="cashOnDeliveryInstructions" className="block text-xs font-medium text-neutral-600 mb-1">
                                Instrucciones para Pago Contra Entrega
                            </label>
                            <textarea
                                name="cashOnDeliveryInstructions"
                                id="cashOnDeliveryInstructions"
                                rows={2}
                                value={settings.cashOnDeliveryInstructions || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                placeholder="Ej: Prepara el monto exacto. Nuestro repartidor te contactará."
                            />
                        </div>
                    )}
                </div>

                {/* Pago con Código QR */}
                <div className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            name="enableQrPayment"
                            id="enableQrPayment"
                            checked={settings.enableQrPayment || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="enableQrPayment" className="ml-2 block text-sm font-medium text-neutral-700">
                            Habilitar Pago con Código QR
                        </label>
                    </div>
                    {settings.enableQrPayment && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="qrCodeImage" className="block text-xs font-medium text-neutral-600 mb-1">
                                    Imagen del Código QR (Máx. {MAX_IMAGE_SIZE_MB}MB)
                                </label>
                                <div className="mt-1 flex items-center space-x-4">
                                     <div 
                                        className="w-20 h-20 rounded-lg border border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary"
                                        onClick={() => qrCodeInputRef.current?.click()}
                                        role="button"
                                        aria-label="Cargar o cambiar imagen QR"
                                    >
                                        {settings.qrCodeImageUrl ? (
                                        <img src={settings.qrCodeImageUrl} alt="Vista previa del QR" className="w-full h-full object-contain" />
                                        ) : (
                                        <QrCodeIcon className="w-10 h-10 text-neutral-400" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="qrCodeImage"
                                        name="qrCodeImage"
                                        ref={qrCodeInputRef}
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        onChange={(e) => handleImageChange(e, setQrCodeFile, 'qrCodeImageUrl', qrCodeInputRef)}
                                        className="sr-only"
                                    />
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => qrCodeInputRef.current?.click()}
                                            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                                        >
                                            {settings.qrCodeImageUrl ? 'Cambiar QR' : 'Subir QR'}
                                        </button>
                                        {settings.qrCodeImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(setQrCodeFile, 'qrCodeImageUrl', qrCodeInputRef)}
                                            className="ml-2 text-xs text-red-600 hover:text-red-800"
                                        >
                                            Quitar
                                        </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="qrPaymentInstructions" className="block text-xs font-medium text-neutral-600 mb-1">
                                    Instrucciones para Pago con QR
                                </label>
                                <textarea
                                    name="qrPaymentInstructions"
                                    id="qrPaymentInstructions"
                                    rows={2}
                                    value={settings.qrPaymentInstructions || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                    placeholder="Ej: Escanea el QR. Envía comprobante a WhatsApp."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Pago con Nequi */}
                 <div className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            name="enableNequiPayment"
                            id="enableNequiPayment"
                            checked={settings.enableNequiPayment || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="enableNequiPayment" className="ml-2 block text-sm font-medium text-neutral-700">
                            Habilitar Pago con Nequi
                        </label>
                    </div>
                    {settings.enableNequiPayment && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nequiPhoneNumber" className="block text-xs font-medium text-neutral-600 mb-1">
                                    Número de Celular Nequi
                                </label>
                                <input
                                    type="tel"
                                    name="nequiPhoneNumber"
                                    id="nequiPhoneNumber"
                                    value={settings.nequiPhoneNumber || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                    placeholder="Ej: 3001234567"
                                />
                            </div>
                            <div>
                                <label htmlFor="nequiPaymentInstructions" className="block text-xs font-medium text-neutral-600 mb-1">
                                    Instrucciones para Pago con Nequi
                                </label>
                                <textarea
                                    name="nequiPaymentInstructions"
                                    id="nequiPaymentInstructions"
                                    rows={2}
                                    value={settings.nequiPaymentInstructions || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                    placeholder="Ej: Envía el pago a este número. Confirma por WhatsApp."
                                />
                            </div>
                        </div>
                    )}
                </div>


                {/* Stripe Simulado */}
                <div className="p-4 border border-neutral-200 rounded-lg">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Stripe (Simulado)</h3>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="stripeApiKeyMock" className="block text-xs font-medium text-neutral-600 mb-1">
                                Clave API Publicable
                            </label>
                            <input
                                type="text"
                                name="stripeApiKeyMock"
                                id="stripeApiKeyMock"
                                value={settings.stripeApiKeyMock || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                placeholder="pk_test_xxxxxxxxxxxx (simulado)"
                            />
                        </div>
                         <div>
                            <label htmlFor="stripeSecretKeyMock" className="block text-xs font-medium text-neutral-600 mb-1">
                                Clave API Secreta
                            </label>
                            <input
                                type="password" 
                                name="stripeSecretKeyMock"
                                id="stripeSecretKeyMock"
                                value={settings.stripeSecretKeyMock || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                                placeholder="sk_test_xxxxxxxxxxxx (simulado)"
                            />
                        </div>
                    </div>
                </div>

                {/* PayPal Simulado */}
                 <div className="p-4 border border-neutral-200 rounded-lg">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">PayPal (Simulado)</h3>
                    <div>
                        <label htmlFor="paypalEmailMock" className="block text-xs font-medium text-neutral-600 mb-1">
                            Email de Cuenta PayPal
                        </label>
                        <input
                            type="email"
                            name="paypalEmailMock"
                            id="paypalEmailMock"
                            value={settings.paypalEmailMock || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400 text-xs"
                            placeholder="tu_paypal@ejemplo.com (simulado)"
                        />
                    </div>
                </div>
                 <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                    <p className="flex items-center"><CurrencyDollarIcon className="w-4 h-4 mr-1.5 text-yellow-600" /><strong>Nota Importante:</strong> Estas configuraciones de pago son únicamente para fines de demostración y no se conectan a ningún sistema de pago real. No ingreses credenciales reales.</p>
                </div>
            </div>
          </section>

          {errorMessage && <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center"><XIcon className="w-5 h-5 mr-2 text-red-600"/>{errorMessage}</div>}
          {successMessage && <div role="status" aria-live="polite" className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-success" /> {successMessage}</div>}

          <div className="pt-8 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </main>
      <footer className="mt-12 text-center text-neutral-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Generador AI de Páginas de Producto. Potenciando PYMEs.</p>
      </footer>
    </div>
  );
};
