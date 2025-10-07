export const LOCAL_STORAGE_KEY_PREFIX = 'aiProductGeneratorApp';

// Claves base para localStorage (sin prefijo de usuario/guest)
export const BASE_KEYS = {
  PRODUCTS: 'products',
  BUSINESS_SETTINGS: 'businessSettings',
  CART: 'cart',
  ONBOARDING_STATUS: 'onboardingStatus',
  ORDERS: 'orders',
  // Superadmin keys
  ADMIN_ACCOUNTS: 'superadmin_adminAccounts',
  SUBSCRIPTION_PLANS: 'superadmin_subscriptionPlans',
  AI_PROVIDER_CONFIGS: 'superadmin_aiProviderConfigs',
  ADMIN_MESSAGES: 'superadmin_adminMessages',
  BACKUP_LOGS: 'superadmin_backupLogs',
  // Affiliate System Keys (Superadmin)
  AFFILIATES: 'superadmin_affiliates',
  REFERRED_CLIENTS: 'superadmin_referredClients',
  AFFILIATE_PAYOUTS: 'superadmin_affiliatePayouts',
  AFFILIATE_SETTINGS: 'superadmin_affiliateSettings',
};
