import { AffiliatePayout, PayoutStatus, PaymentMethod } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const PAYOUTS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AFFILIATE_PAYOUTS}`;

const getInitialAffiliatePayouts = (): AffiliatePayout[] => {
  const affiliates = JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AFFILIATES}`) || '[]');
  const juanAfiliado = affiliates.find((a: any) => a.email === 'juan.afiliado@example.com');
  
  let initialPayouts: AffiliatePayout[] = [];
  if (juanAfiliado) {
    initialPayouts.push({
      id: uuidv4(),
      affiliateId: juanAfiliado.id,
      payoutDate: Date.now() - (1000 * 60 * 60 * 24 * 15), // 15 days ago
      amount: 75.00,
      method: 'paypal',
      status: PayoutStatus.Paid,
      transactionId: 'PAYPAL_TRANS_MOCK_1',
      notes: 'Pago de comisiones Sep 2023',
    });
  }
  return initialPayouts;
};


const getStoredAffiliatePayouts = (): AffiliatePayout[] => {
  try {
    const storedData = localStorage.getItem(PAYOUTS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    const initialPayouts = getInitialAffiliatePayouts();
    saveStoredAffiliatePayouts(initialPayouts);
    return initialPayouts;
  } catch (error) {
    console.error("Error reading affiliate payouts from localStorage:", error);
    const initialPayouts = getInitialAffiliatePayouts();
    saveStoredAffiliatePayouts(initialPayouts);
    return initialPayouts;
  }
};

const saveStoredAffiliatePayouts = (payouts: AffiliatePayout[]): void => {
  try {
    localStorage.setItem(PAYOUTS_STORAGE_KEY, JSON.stringify(payouts));
  } catch (error) {
    console.error("Error saving affiliate payouts to localStorage:", error);
  }
};

export const getAffiliatePayouts = async (affiliateId?: string): Promise<AffiliatePayout[]> => {
  const allPayouts = getStoredAffiliatePayouts();
  if (affiliateId) {
    console.log(`affiliatePayoutService (localStorage): Obteniendo pagos para afiliado ${affiliateId}`);
    return Promise.resolve(allPayouts.filter(payout => payout.affiliateId === affiliateId));
  }
  console.log(`affiliatePayoutService (localStorage): Obteniendo todos los pagos`);
  return Promise.resolve(allPayouts);
};

export const addAffiliatePayout = async (payoutData: Omit<AffiliatePayout, 'id' | 'payoutDate'>): Promise<AffiliatePayout> => {
  console.log(`affiliatePayoutService (localStorage): Añadiendo pago para afiliado`, payoutData);
  const payouts = getStoredAffiliatePayouts();
  const newPayout: AffiliatePayout = {
    id: uuidv4(),
    ...payoutData,
    payoutDate: Date.now(),
  };
  payouts.unshift(newPayout);
  saveStoredAffiliatePayouts(payouts);
  return Promise.resolve(newPayout);
};

export const updateAffiliatePayoutStatus = async (payoutId: string, status: PayoutStatus, transactionId?: string): Promise<AffiliatePayout> => {
  const payouts = getStoredAffiliatePayouts();
  const payoutIndex = payouts.findIndex(p => p.id === payoutId);
  if (payoutIndex === -1) {
    throw new Error(`Pago con ID ${payoutId} no encontrado.`);
  }
  payouts[payoutIndex].status = status;
  if (transactionId) {
    payouts[payoutIndex].transactionId = transactionId;
  }
  saveStoredAffiliatePayouts(payouts);
  return payouts[payoutIndex];
};
