import { AIProviderConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';
import { GEMINI_TEXT_MODEL } from '../constants';

const AI_PROVIDERS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AI_PROVIDER_CONFIGS}`;

const getInitialAIProviders = (): AIProviderConfig[] => [
  {
    id: uuidv4(),
    providerName: `Gemini (${GEMINI_TEXT_MODEL})`,
    apiKey: 'YOUR_GEMINI_API_KEY_HERE_OR_FROM_ENV', // Placeholder
    endpointUrl: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
    status: 'active',
    isDefault: true,
    monthlyLimit: 1000000, // Example limit
    dailyLimit: 50000,    // Example limit
    avgResponseTimeMs: 1500, // Mocked
    successRatePercent: 99.5, // Mocked
  },
];

const getStoredAIProviders = (): AIProviderConfig[] => {
  try {
    const storedData = localStorage.getItem(AI_PROVIDERS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    const initialProviders = getInitialAIProviders();
    saveStoredAIProviders(initialProviders);
    return initialProviders;
  } catch (error) {
    console.error("Error reading AI providers from localStorage:", error);
    const initialProviders = getInitialAIProviders();
    saveStoredAIProviders(initialProviders);
    return initialProviders;
  }
};

const saveStoredAIProviders = (providers: AIProviderConfig[]): void => {
  try {
    localStorage.setItem(AI_PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
  } catch (error) {
    console.error("Error saving AI providers to localStorage:", error);
  }
};

export const getAIProviders = async (): Promise<AIProviderConfig[]> => {
  console.log(`aiProviderConfigService (localStorage): Obteniendo proveedores de IA`);
  return Promise.resolve(getStoredAIProviders());
};

export const addAIProvider = async (providerData: Omit<AIProviderConfig, 'id' | 'avgResponseTimeMs' | 'successRatePercent'>): Promise<AIProviderConfig> => {
  console.log(`aiProviderConfigService (localStorage): Añadiendo proveedor de IA`, providerData);
  const providers = getStoredAIProviders();
  const newProvider: AIProviderConfig = {
    ...providerData,
    id: uuidv4(),
    avgResponseTimeMs: undefined, // These would be dynamically tracked
    successRatePercent: undefined,
  };
  
  if (newProvider.isDefault) {
    providers.forEach(p => p.isDefault = false);
  }
  providers.push(newProvider);
  saveStoredAIProviders(providers);
  return Promise.resolve(newProvider);
};

export const updateAIProvider = async (updatedProviderData: AIProviderConfig): Promise<AIProviderConfig> => {
  console.log(`aiProviderConfigService (localStorage): Actualizando proveedor de IA ${updatedProviderData.id}`);
  let providers = getStoredAIProviders();
  const providerIndex = providers.findIndex(p => p.id === updatedProviderData.id);

  if (providerIndex === -1) {
    throw new Error(`Proveedor de IA con ID ${updatedProviderData.id} no encontrado.`);
  }
  
  if (updatedProviderData.isDefault) {
    providers.forEach(p => { if(p.id !== updatedProviderData.id) p.isDefault = false; });
  }

  providers[providerIndex] = { 
      ...providers[providerIndex], // Preserve existing untracked fields like avgResponseTimeMs
      ...updatedProviderData 
  };
  saveStoredAIProviders(providers);
  return Promise.resolve(providers[providerIndex]);
};

export const deleteAIProvider = async (providerId: string): Promise<void> => {
  console.log(`aiProviderConfigService (localStorage): Eliminando proveedor de IA ${providerId}`);
  let providers = getStoredAIProviders();
  providers = providers.filter(p => p.id !== providerId);
  saveStoredAIProviders(providers);
  return Promise.resolve();
};