import { ReferredClient, ReferredClientStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const REFERRED_CLIENTS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.REFERRED_CLIENTS}`;

// Mock referred clients based on mock affiliates
const getInitialReferredClients = (): ReferredClient[] => {
  const affiliates = JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.AFFILIATES}`) || '[]');
  const juanAfiliado = affiliates.find((a: any) => a.email === 'juan.afiliado@example.com');
  const mariaSocia = affiliates.find((a: any) => a.email === 'maria.socia@example.com');
  
  let initialClients: ReferredClient[] = [];

  if (juanAfiliado) {
    initialClients.push(
      { id: uuidv4(), affiliateId: juanAfiliado.id, clientName: 'Tienda Referida 1 (Juan)', registrationDate: Date.now() - (1000*60*60*24*20), status: ReferredClientStatus.Active, amountGenerated: 150.00, lastActivityDate: Date.now() - (1000*60*60*24*2) },
      { id: uuidv4(), affiliateId: juanAfiliado.id, clientName: 'Negocio XYZ (Juan)', registrationDate: Date.now() - (1000*60*60*24*15), status: ReferredClientStatus.Active, amountGenerated: 250.75, lastActivityDate: Date.now() - (1000*60*60*24*1) },
      { id: uuidv4(), affiliateId: juanAfiliado.id, clientName: 'Cliente Prueba (Juan)', registrationDate: Date.now() - (1000*60*60*24*5), status: ReferredClientStatus.Trial, amountGenerated: 0, lastActivityDate: Date.now() - (1000*60*60*24*5) }
    );
  }
  if (mariaSocia) {
    initialClients.push(
      { id: uuidv4(), affiliateId: mariaSocia.id, clientName: 'Startup Referida (Maria)', registrationDate: Date.now() - (1000*60*60*24*7), status: ReferredClientStatus.Cancelled, amountGenerated: 50.00, lastActivityDate: Date.now() - (1000*60*60*24*3) }
    );
  }
  return initialClients;
};

const getStoredReferredClients = (): ReferredClient[] => {
  try {
    const storedData = localStorage.getItem(REFERRED_CLIENTS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    const initialClients = getInitialReferredClients();
    saveStoredReferredClients(initialClients);
    return initialClients;
  } catch (error) {
    console.error("Error reading referred clients from localStorage:", error);
    const initialClients = getInitialReferredClients();
    saveStoredReferredClients(initialClients);
    return initialClients;
  }
};

const saveStoredReferredClients = (clients: ReferredClient[]): void => {
  try {
    localStorage.setItem(REFERRED_CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error("Error saving referred clients to localStorage:", error);
  }
};

export const getReferredClientsByAffiliate = async (affiliateId: string): Promise<ReferredClient[]> => {
  console.log(`referredClientService (localStorage): Obteniendo clientes referidos por ${affiliateId}`);
  const allClients = getStoredReferredClients();
  return Promise.resolve(allClients.filter(client => client.affiliateId === affiliateId));
};

export const getAllReferredClients = async (): Promise<ReferredClient[]> => {
  console.log(`referredClientService (localStorage): Obteniendo todos los clientes referidos`);
  return Promise.resolve(getStoredReferredClients());
};

// Add/Update/Delete functions can be added if superadmin needs to manage these directly
// For now, they are primarily for display based on affiliate activity.
