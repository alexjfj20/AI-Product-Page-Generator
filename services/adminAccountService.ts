
import { AdminAccount, AdminAccountStatus, AddAdminAccountData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const ADMIN_ACCOUNTS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.ADMIN_ACCOUNTS}`;

const getInitialAdminAccounts = (): AdminAccount[] => [
  { 
    id: uuidv4(), 
    name: 'Admin Principal', 
    email: 'admin@example.com', 
    status: AdminAccountStatus.Active, 
    planId: 'pro-plan-001', // Example, ensure this ID matches a mock plan if needed
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 7), // 7 days ago
    lastLogin: Date.now() - (1000 * 60 * 60 * 3), // 3 hours ago
  },
  { 
    id: uuidv4(), 
    name: 'Usuario Admin de Prueba', 
    email: 'testadmin@example.com', 
    status: AdminAccountStatus.Inactive, 
    planId: 'free-plan-001', // Example
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];


const getStoredAdminAccounts = (): AdminAccount[] => {
  const storedData = localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);

  if (storedData === null) { // Key truly not found in localStorage
    console.log(`adminAccountService: No data found for key ${ADMIN_ACCOUNTS_STORAGE_KEY}. Initializing with default accounts.`);
    const initialAccounts = getInitialAdminAccounts();
    // Attempt to save the initial set, so subsequent loads don't re-initialize if this save works.
    saveStoredAdminAccounts(initialAccounts); 
    return initialAccounts;
  }

  // Key exists, try to parse
  try {
    const parsedData = JSON.parse(storedData);
    if (Array.isArray(parsedData)) {
      // Optional: Add deeper validation here to ensure items are AdminAccount-like
      return parsedData;
    } else {
      // Data found but it's not an array (corrupted state)
      console.warn(`adminAccountService: Stored data for ${ADMIN_ACCOUNTS_STORAGE_KEY} is not an array. Returning empty array. Data:`, storedData);
      // Return empty to prevent app crash and avoid overwriting potentially recoverable (though corrupt) data.
      return [];
    }
  } catch (error) {
    // JSON.parse failed (corrupted JSON string)
    console.error(`adminAccountService: Error parsing admin accounts from localStorage for key ${ADMIN_ACCOUNTS_STORAGE_KEY}. Data was:`, storedData, "Error:", error);
    // Avoid overwriting potentially recoverable (though corrupt) data with initial mocks. Return empty.
    return [];
  }
};

const saveStoredAdminAccounts = (accounts: AdminAccount[]): void => {
  try {
    localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    console.log(`adminAccountService: Successfully saved ${accounts.length} admin accounts to localStorage for key ${ADMIN_ACCOUNTS_STORAGE_KEY}.`);
  } catch (error) {
    console.error(`adminAccountService: Error saving admin accounts to localStorage for key ${ADMIN_ACCOUNTS_STORAGE_KEY}. Error:`, error);
    // Consider if you want to throw the error here or notify the user,
    // as a silent failure means data won't persist.
  }
};

export const getAdminAccounts = async (): Promise<AdminAccount[]> => {
  console.log(`adminAccountService (localStorage): Obteniendo cuentas de administrador`);
  return Promise.resolve(getStoredAdminAccounts());
};

export const addAdminAccount = async (accountData: AddAdminAccountData): Promise<AdminAccount> => {
  console.log(`adminAccountService (localStorage): Añadiendo cuenta de admin`, accountData);
  const accounts = getStoredAdminAccounts(); // Get current list (might be initial if first time)
  const newAccount: AdminAccount = {
    id: uuidv4(),
    name: accountData.name,
    email: accountData.email,
    status: accountData.status || AdminAccountStatus.Inactive,
    planId: accountData.planId,
    createdAt: Date.now(),
    lastLogin: undefined, // New accounts typically haven't logged in
  };
  // Note: Password from accountData.password is ignored for this localStorage mock.
  accounts.unshift(newAccount); // Add to the beginning of the array
  saveStoredAdminAccounts(accounts); // Save the updated array
  return Promise.resolve(newAccount);
};

export const updateAdminAccount = async (updatedAccountData: AdminAccount): Promise<AdminAccount> => {
  console.log(`adminAccountService (localStorage): Actualizando cuenta de admin ${updatedAccountData.id}`);
  let accounts = getStoredAdminAccounts();
  const accountIndex = accounts.findIndex(acc => acc.id === updatedAccountData.id);

  if (accountIndex === -1) {
    throw new Error(`Cuenta de administrador con ID ${updatedAccountData.id} no encontrada.`);
  }
  
  accounts[accountIndex] = {
    ...accounts[accountIndex],
    ...updatedAccountData,
  };
  saveStoredAdminAccounts(accounts);
  return Promise.resolve(accounts[accountIndex]);
};

export const deleteAdminAccount = async (accountId: string): Promise<void> => {
  console.log(`adminAccountService (localStorage): Eliminando cuenta de admin ${accountId}`);
  let accounts = getStoredAdminAccounts();
  accounts = accounts.filter(acc => acc.id !== accountId);
  saveStoredAdminAccounts(accounts);
  return Promise.resolve();
};
    