import { SubscriptionPlan, SubscriptionPlanFeature, SubscriptionPlanLimits } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const PLANS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.SUBSCRIPTION_PLANS}`;

const getInitialSubscriptionPlans = (): SubscriptionPlan[] => [
  {
    id: 'free-plan-001',
    name: "Gratis",
    price: 0,
    priceSuffix: "/mes",
    features: [
      { text: "5 productos máximo", enabled: true },
      { text: "Generación de descripción básica AI", enabled: true },
      { text: "Soporte comunitario", enabled: true },
    ],
    limits: { maxProducts: 5, aiGenerationsPerMonth: 50 },
    isPopular: false,
    isArchived: false,
  },
  {
    id: 'pro-plan-001',
    name: "Pro",
    price: 29,
    priceSuffix: "/mes",
    features: [
      { text: "100 productos", enabled: true },
      { text: "Generación de descripción avanzada AI", enabled: true },
      { text: "Soporte prioritario por email", enabled: true },
      { text: "Analíticas básicas", enabled: true },
    ],
    limits: { maxProducts: 100, aiGenerationsPerMonth: 500 },
    isPopular: true,
    isArchived: false,
  },
  {
    id: 'premium-plan-001',
    name: "Premium",
    price: 79,
    priceSuffix: "/mes",
    features: [
      { text: "Productos ilimitados", enabled: true },
      { text: "Todas las funciones Pro", enabled: true },
      { text: "Generación AI ilimitada (sujeto a FUP)", enabled: true },
      { text: "Analíticas avanzadas", enabled: true },
      { text: "Acceso API (Próximamente)", enabled: false },
    ],
    limits: { maxProducts: undefined, aiGenerationsPerMonth: undefined },
    isPopular: false,
    isArchived: false,
  },
];

const getStoredSubscriptionPlans = (): SubscriptionPlan[] => {
  try {
    const storedData = localStorage.getItem(PLANS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    const initialPlans = getInitialSubscriptionPlans();
    saveStoredSubscriptionPlans(initialPlans);
    return initialPlans;
  } catch (error) {
    console.error("Error reading subscription plans from localStorage:", error);
    const initialPlans = getInitialSubscriptionPlans();
    saveStoredSubscriptionPlans(initialPlans);
    return initialPlans;
  }
};

const saveStoredSubscriptionPlans = (plans: SubscriptionPlan[]): void => {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error("Error saving subscription plans to localStorage:", error);
  }
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  console.log(`subscriptionPlanService (localStorage): Obteniendo planes`);
  return Promise.resolve(getStoredSubscriptionPlans());
};

export const addSubscriptionPlan = async (planData: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
  console.log(`subscriptionPlanService (localStorage): Añadiendo plan`, planData);
  const plans = getStoredSubscriptionPlans();
  const newPlan: SubscriptionPlan = {
    ...planData,
    id: uuidv4(),
  };
  plans.push(newPlan);
  saveStoredSubscriptionPlans(plans);
  return Promise.resolve(newPlan);
};

export const updateSubscriptionPlan = async (updatedPlanData: SubscriptionPlan): Promise<SubscriptionPlan> => {
  console.log(`subscriptionPlanService (localStorage): Actualizando plan ${updatedPlanData.id}`);
  let plans = getStoredSubscriptionPlans();
  const planIndex = plans.findIndex(p => p.id === updatedPlanData.id);

  if (planIndex === -1) {
    throw new Error(`Plan con ID ${updatedPlanData.id} no encontrado.`);
  }
  
  plans[planIndex] = { ...updatedPlanData };
  saveStoredSubscriptionPlans(plans);
  return Promise.resolve(plans[planIndex]);
};

export const toggleArchiveSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan | null> => {
    console.log(`subscriptionPlanService (localStorage): Archivando/Desarchivando plan ${planId}`);
    let plans = getStoredSubscriptionPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
        throw new Error("Plan no encontrado para archivar/desarchivar");
    }
    
    plans[planIndex].isArchived = !plans[planIndex].isArchived;
    saveStoredSubscriptionPlans(plans);
    return Promise.resolve(plans[planIndex]);
};