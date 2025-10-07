
export enum ProductStatus {
  Activo = "Activo",
  Inactivo = "Inactivo",
  Agotado = "Agotado",
}

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: string; // Renamed from price
  currency: string;  // New
  taxRate?: string;   // New (percentage string "19")
  discountRate?: string; // New (percentage string "10")
  idea: string;
  generatedDescription: string;
  imagePreviewUrls?: string[];
  videoUrl?: string;
  status: ProductStatus;
  createdAt: number; 
  stock?: number;
}

export interface ProductInput { 
  name: string;
  category: string;
  price: string; // Retained for AI service compatibility; will be populated with final_price_currency string.
  basePrice?: string; // New: User input for base price of the product.
  currency?: string;  // New: Currency for the basePrice (e.g., "USD", "EUR", "COP").
  taxRate?: string;   // New: Tax rate as a percentage string (e.g., "19" for 19%).
  discountRate?: string; // New: Discount rate as a percentage string (e.g., "10" for 10%).
  idea: string;
  videoUrl?: string;
  status?: ProductStatus; 
  stock?: string;
}


export enum ProductCategory {
  CLOTHING = "Ropa y Accesorios",
  FOOD_DRINK = "Alimentos y Bebidas",
  TECHNOLOGY = "Tecnología y Electrónicos",
  HOME_GARDEN = "Hogar y Jardín",
  BEAUTY_PERSONAL_CARE = "Belleza y Cuidado Personal",
  SPORTS_OUTDOORS = "Deportes y Aire Libre",
  TOYS_GAMES = "Juguetes y Juegos",
  BOOKS_MEDIA = "Libros y Multimedia",
  SERVICES = "Servicios",
  OTHER = "Otro",
}

export interface WhatsAppBusinessApiConfig {
  phoneNumberId?: string;
  accountId?: string;
  accessToken?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  statusMessage?: string;
}

export interface BusinessSettings {
  businessName?: string;
  businessCategory?: string; 
  primaryColor?: string; 
  logoPreviewUrl?: string;
  contactInfo?: string;
  whatsappNumber?: string; 
  whatsappOrderTemplate?: string; 
  whatsappInquiryTemplate?: string; 
  
  enableCashOnDelivery?: boolean;
  cashOnDeliveryInstructions?: string;
  stripeApiKeyMock?: string;
  stripeSecretKeyMock?: string;
  paypalEmailMock?: string;

  enableQrPayment?: boolean;
  qrCodeImageUrl?: string;
  qrPaymentInstructions?: string;
  enableNequiPayment?: boolean;
  nequiPhoneNumber?: string;
  nequiPaymentInstructions?: string;

  whatsappBusinessApiConfig?: WhatsAppBusinessApiConfig;
}

export interface CartItem {
  productId: string;
  name: string;
  price: string; // This price here refers to the basePrice of the product at the time it was added to cart.
  quantity: number;
  imagePreviewUrl?: string; 
}

export type OnboardingStatus =
  | 'NOT_STARTED'
  | 'BUSINESS_INFO_SUBMITTED' 
  | 'PERSONALIZATION_SUBMITTED' 
  | 'COMPLETED'; 

export enum OrderStatus {
  PENDIENTE = "Pendiente",
  EN_PROCESO = "En Proceso",
  COMPLETADO = "Completado",
  CANCELADO = "Cancelado",
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  customerNotes?: string;
  orderDate: number; 
  status: OrderStatus;
}

export type UserRole = 'sme' | 'superadmin';

export interface User {
  id: string;
  email: string;
  name?: string; 
  role?: UserRole; 
  profileImageUrl?: string; 
}

export interface AuthResponse {
  token: string;
  user: User;
}

export enum AdminAccountStatus { 
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  status: AdminAccountStatus;
  planId?: string; 
  createdAt: number;
  lastLogin?: number;
}

export interface AddAdminAccountData {
  name: string;
  email: string;
  password?: string; 
  status?: AdminAccountStatus;
  planId?: string;
}

export interface SubscriptionPlanFeature {
  text: string;
  enabled: boolean;
}

export interface SubscriptionPlanLimits {
  maxProducts?: number;
  aiGenerationsPerMonth?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string; 
  price: number; 
  priceSuffix?: string; 
  features: SubscriptionPlanFeature[];
  limits: SubscriptionPlanLimits;
  isPopular?: boolean;
  isArchived?: boolean; 
}

export interface AIProviderConfig {
  id: string;
  providerName: string; 
  apiKey: string; 
  endpointUrl?: string;
  status: 'active' | 'inactive' | 'error';
  isDefault: boolean; 
  monthlyLimit?: number; 
  dailyLimit?: number;
  perUserLimit?: number;
  avgResponseTimeMs?: number; 
  successRatePercent?: number; 
}

export type AdminMessageCategory = 'info' | 'alert' | 'payment_reminder' | 'feature_update' | 'congratulations';

export interface AdminMessage {
  id: string;
  subject: string;
  body: string; 
  recipients: string[]; 
  category: AdminMessageCategory;
  sentAt: number;
  readBy?: string[]; 
}

export interface SendMessageData {
  subject: string;
  body: string;
  recipients: string[];
  category: AdminMessageCategory;
}

export interface BackupLog {
  id: string;
  type: 'full_system' | 'account_specific';
  accountId?: string; 
  timestamp: number;
  status: 'completed' | 'failed' | 'in_progress';
  filePath?: string; 
  sizeMb?: number;
  triggeredBy: 'manual' | 'scheduled';
}

export interface CreateBackupLogData {
  type: 'full_system' | 'account_specific';
  accountId?: string;
}

// --- Affiliate System Types ---
export enum AffiliateStatus {
  Active = "active",
  Inactive = "inactive",
}

export enum ReferredClientStatus {
  Active = "active",
  Trial = "trial",
  Cancelled = "cancelled",
}

export enum PayoutStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
}

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'nequi_daviplata' | 'manual';

export interface AffiliatePaymentDetails {
  paypalEmail?: string;
  bankInfo?: string; // Could be a structured object in a real app
  nequiDaviplata?: string; // Phone number
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referralLink: string;
  status: AffiliateStatus;
  registrationDate: number; // timestamp
  totalActiveReferrals: number;
  commissionAccumulated: number; // In USD or a base currency
  paymentDetails: AffiliatePaymentDetails;
}

export interface AddAffiliateData extends Omit<Affiliate, 'id' | 'referralCode' | 'referralLink' | 'registrationDate' | 'totalActiveReferrals' | 'commissionAccumulated'> {
  // Basic fields for creation
}

export interface UpdateAffiliateData extends Partial<Omit<Affiliate, 'id' | 'referralCode' | 'referralLink' | 'registrationDate' | 'totalActiveReferrals'>> {
  // Fields that can be updated
  // commissionAccumulated is now allowed to be updated
}


export interface ReferredClient {
  id: string;
  affiliateId: string;
  clientName: string;
  registrationDate: number; // timestamp
  status: ReferredClientStatus;
  amountGenerated: number; // Revenue from this client contributing to commission
  lastActivityDate?: number; // timestamp
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  payoutDate: number; // timestamp
  amount: number;
  method: PaymentMethod;
  status: PayoutStatus;
  transactionId?: string; // e.g., PayPal transaction ID
  notes?: string; // Admin notes for this payout
}

export interface AffiliateCommissionRule {
  commissionRatePercent: number; // e.g., 20 for 20%
  commissionType: 'one_time' | 'recurring';
  minimumPayoutAmount: number; // e.g., 50 (USD)
  retentionPeriodDays: number; // e.g., 30 days after referred client's qualifying action
}

export interface AffiliateSettings {
  commissionRule: AffiliateCommissionRule;
  availablePaymentMethods: PaymentMethod[];
  termsAndConditionsUrl?: string;
  // Other global settings
}
