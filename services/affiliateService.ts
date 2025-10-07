import { Affiliate, AffiliateStatus, AddAffiliateData, UpdateAffiliateData, AffiliatePaymentDetails } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const AFFILIATES_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AFFILIATES}`;

const getInitialAffiliates = (): Affiliate[] => [
  {
    id: uuidv4(),
    name: 'Juan Afiliado Ejemplo',
    email: 'juan.afiliado@example.com',
    referralCode: 'JUANAFIL123',
    referralLink: `https://yourapp.com/register?ref=JUANAFIL123`,
    status: AffiliateStatus.Active,
    registrationDate: Date.now() - (1000 * 60 * 60 * 24 * 30), // 30 days ago
    totalActiveReferrals: 5,
    commissionAccumulated: 125.50,
    paymentDetails: { paypalEmail: 'juan.paypal@example.com' },
  },
  {
    id: uuidv4(),
    name: 'Maria Socia Test',
    email: 'maria.socia@example.com',
    referralCode: 'MARIASOC789',
    referralLink: `https://yourapp.com/register?ref=MARIASOC789`,
    status: AffiliateStatus.Inactive,
    registrationDate: Date.now() - (1000 * 60 * 60 * 24 * 10), // 10 days ago
    totalActiveReferrals: 1,
    commissionAccumulated: 20.00,
    paymentDetails: { nequiDaviplata: '3001234567' },
  },
];

const getStoredAffiliates = (): Affiliate[] => {
  try {
    const storedData = localStorage.getItem(AFFILIATES_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    const initialAffiliates = getInitialAffiliates();
    saveStoredAffiliates(initialAffiliates);
    return initialAffiliates;
  } catch (error) {
    console.error("Error reading affiliates from localStorage:", error);
    const initialAffiliates = getInitialAffiliates();
    saveStoredAffiliates(initialAffiliates);
    return initialAffiliates;
  }
};

const saveStoredAffiliates = (affiliates: Affiliate[]): void => {
  try {
    localStorage.setItem(AFFILIATES_STORAGE_KEY, JSON.stringify(affiliates));
  } catch (error) {
    console.error("Error saving affiliates to localStorage:", error);
  }
};

export const getAffiliates = async (): Promise<Affiliate[]> => {
  console.log(`affiliateService (localStorage): Obteniendo afiliados`);
  return Promise.resolve(getStoredAffiliates());
};

export const addAffiliate = async (affiliateData: AddAffiliateData): Promise<Affiliate> => {
  console.log(`affiliateService (localStorage): Añadiendo afiliado`, affiliateData);
  const affiliates = getStoredAffiliates();
  const referralCode = `${affiliateData.name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}${Math.floor(100 + Math.random() * 900)}`;
  const newAffiliate: Affiliate = {
    id: uuidv4(),
    name: affiliateData.name,
    email: affiliateData.email,
    referralCode: referralCode,
    referralLink: `https://yourapp.com/register?ref=${referralCode}`, // Replace yourapp.com with actual domain
    status: affiliateData.status || AffiliateStatus.Inactive,
    registrationDate: Date.now(),
    totalActiveReferrals: 0,
    commissionAccumulated: 0,
    paymentDetails: affiliateData.paymentDetails || {},
  };
  affiliates.unshift(newAffiliate);
  saveStoredAffiliates(affiliates);
  return Promise.resolve(newAffiliate);
};

export const updateAffiliate = async (affiliateId: string, updateData: UpdateAffiliateData): Promise<Affiliate> => {
  console.log(`affiliateService (localStorage): Actualizando afiliado ${affiliateId}`);
  let affiliates = getStoredAffiliates();
  const affiliateIndex = affiliates.findIndex(aff => aff.id === affiliateId);

  if (affiliateIndex === -1) {
    throw new Error(`Afiliado con ID ${affiliateId} no encontrado.`);
  }
  
  affiliates[affiliateIndex] = { 
    ...affiliates[affiliateIndex], 
    ...updateData,
    // Ensure paymentDetails is merged correctly
    paymentDetails: {
        ...(affiliates[affiliateIndex].paymentDetails || {}),
        ...(updateData.paymentDetails || {})
    }
  };
  saveStoredAffiliates(affiliates);
  return Promise.resolve(affiliates[affiliateIndex]);
};

export const deleteAffiliate = async (affiliateId: string): Promise<void> => {
  console.log(`affiliateService (localStorage): Eliminando afiliado ${affiliateId}`);
  let affiliates = getStoredAffiliates();
  affiliates = affiliates.filter(aff => aff.id !== affiliateId);
  saveStoredAffiliates(affiliates);
  return Promise.resolve();
};

export const updateAffiliateStatus = async (affiliateId: string, status: AffiliateStatus): Promise<Affiliate> => {
    const affiliates = getStoredAffiliates();
    const affiliateIndex = affiliates.findIndex(aff => aff.id === affiliateId);
    if (affiliateIndex === -1) {
      throw new Error(`Afiliado con ID ${affiliateId} no encontrado.`);
    }
    affiliates[affiliateIndex].status = status;
    saveStoredAffiliates(affiliates);
    return affiliates[affiliateIndex];
};
