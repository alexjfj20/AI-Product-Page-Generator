import { OnboardingStatus } from '../types';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const ONBOARDING_STATUS_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.ONBOARDING_STATUS}`;

const validStatuses: OnboardingStatus[] = ['NOT_STARTED', 'BUSINESS_INFO_SUBMITTED', 'PERSONALIZATION_SUBMITTED', 'COMPLETED'];

const mapOnboardingStatus = (status: any): OnboardingStatus => {
  if (typeof status === 'string' && validStatuses.includes(status as OnboardingStatus)) {
    return status as OnboardingStatus;
  }
  return 'NOT_STARTED';
};

export const getOnboardingStatus = async (): Promise<OnboardingStatus> => {
  console.log(`onboardingService (localStorage): Obteniendo estado de onboarding`);
  try {
    const storedStatus = localStorage.getItem(ONBOARDING_STATUS_KEY);
    return Promise.resolve(mapOnboardingStatus(storedStatus));
  } catch (error) {
    console.error("Error reading onboarding status from localStorage:", error);
    return Promise.resolve('NOT_STARTED');
  }
};

export const saveOnboardingStatus = async (status: OnboardingStatus): Promise<OnboardingStatus> => {
  console.log(`onboardingService (localStorage): Guardando estado de onboarding ${status}`);
  try {
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid onboarding status: ${status}`);
    }
    localStorage.setItem(ONBOARDING_STATUS_KEY, status);
    return Promise.resolve(status);
  } catch (error) {
    console.error("Error saving onboarding status to localStorage:", error);
    throw error; // Re-throw to allow UI to handle it
  }
};
