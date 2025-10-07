
import { BusinessSettings } from '../types';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const SETTINGS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.BUSINESS_SETTINGS}`;

const defaultSettings: BusinessSettings = {
  businessName: '',
  businessCategory: '',
  primaryColor: '#2563eb',
  logoPreviewUrl: '',
  contactInfo: '',
  whatsappNumber: '',
  whatsappOrderTemplate: 'Hola {businessName}, quiero confirmar mi pedido:\n{cartItemsList}\nTotal: ${totalAmount}.\nMis notas: {customerNotes}.\nGracias.',
  whatsappInquiryTemplate: 'Hola {businessName}, estoy interesado/a en el producto: "{productName}". ¿Podrías darme más información?',
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
};

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  console.log(`businessSettingsService (localStorage): Obteniendo configuración`);
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Merge stored settings with defaults to ensure all keys are present, especially nested ones
      return { 
        ...defaultSettings, 
        ...parsed,
        whatsappBusinessApiConfig: {
            ...defaultSettings.whatsappBusinessApiConfig,
            ...parsed.whatsappBusinessApiConfig
        }
      };
    }
    return { ...defaultSettings };
  } catch (error) {
    console.error("Error reading business settings from localStorage:", error);
    return { ...defaultSettings };
  }
};

export const saveBusinessSettings = async (settings: BusinessSettings): Promise<BusinessSettings> => {
  console.log(`businessSettingsService (localStorage): Guardando configuración`, settings);
  try {
    const currentSettings = await getBusinessSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    return Promise.resolve(newSettings);
  } catch (error) {
    console.error("Error saving business settings to localStorage:", error);
    throw new Error("No se pudo guardar la configuración del negocio localmente.");
  }
};
