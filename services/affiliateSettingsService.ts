import { AffiliateSettings, AffiliateCommissionRule, PaymentMethod } from '../types';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const SETTINGS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AFFILIATE_SETTINGS}`;

const defaultAffiliateSettings: AffiliateSettings = {
  commissionRule: {
    commissionRatePercent: 20,
    commissionType: 'recurring',
    minimumPayoutAmount: 50,
    retentionPeriodDays: 30,
  },
  availablePaymentMethods: ['paypal', 'bank_transfer'],
  termsAndConditionsUrl: '/affiliate-terms', // Example
};

export const getAffiliateSettings = async (): Promise<AffiliateSettings> => {
  console.log(`affiliateSettingsService (localStorage): Obteniendo configuración de afiliados`);
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return { ...defaultAffiliateSettings, ...JSON.parse(storedSettings) };
    }
    // Save default settings if not found
    saveStoredAffiliateSettings(defaultAffiliateSettings);
    return { ...defaultAffiliateSettings };
  } catch (error) {
    console.error("Error reading affiliate settings from localStorage:", error);
    // Save default settings if error occurs during read (e.g. corrupted data)
    saveStoredAffiliateSettings(defaultAffiliateSettings);
    return { ...defaultAffiliateSettings };
  }
};

const saveStoredAffiliateSettings = (settings: AffiliateSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving affiliate settings to localStorage:", error);
  }
};

export const saveAffiliateSettings = async (settings: Partial<AffiliateSettings>): Promise<AffiliateSettings> => {
  console.log(`affiliateSettingsService (localStorage): Guardando configuración de afiliados`, settings);
  try {
    const currentSettings = await getAffiliateSettings();
    const newSettings = { 
      ...currentSettings, 
      ...settings,
      commissionRule: {
        ...(currentSettings.commissionRule),
        ...(settings.commissionRule || {})
      }
    };
    saveStoredAffiliateSettings(newSettings);
    return Promise.resolve(newSettings);
  } catch (error) {
    console.error("Error saving affiliate settings to localStorage:", error);
    throw new Error("No se pudo guardar la configuración de afiliados localmente.");
  }
};
