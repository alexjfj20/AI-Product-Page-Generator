

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ProductForm, ProductFormData } from './components/ProductForm';
import { ProductList } from './components/ProductList';
import { LoginView } from './components/LoginView';
import { LandingPage } from './components/LandingPage';
import { SettingsPage } from './components/SettingsPage';
import { StorefrontPage } from './components/StorefrontPage';
import { CartPage } from './components/CartPage';
import { OnboardingStep1BusinessInfo, OnboardingStep1Data } from './components/OnboardingStep1BusinessInfo';
import { OnboardingStep2Personalization, OnboardingStep2Data } from './components/OnboardingStep2Personalization';
import { OrdersDashboardPage } from './components/OrdersDashboardPage';
import { AIMarketingAssistantPage } from './components/AIMarketingAssistantPage';
import { AdminMessagesView } from './components/AdminMessagesView'; 
import { SuperadminPanel } from "@/components/SuperadminPanel"; 
import { SparklesIcon, LogoutIcon, CogIcon, BuildingStorefrontIcon, ClipboardListIcon, MenuIcon, XIcon, ChatBubbleLeftEllipsisIcon, InboxIcon, SunIcon, MoonIcon } from './components/icons';
import { Product, ProductStatus, BusinessSettings, CartItem, OnboardingStatus, Order, OrderStatus, User, AuthResponse, UserRole, ProductInput } from './types';
import { ProductFilterControls, ActiveFilters } from './components/ProductFilterControls';

import * as authService from './services/authService';
import * as productService from './services/productService';
import * as businessSettingsService from './services/businessSettingsService';
import * as cartService from './services/cartService';
import * as orderService from './services/orderService';
import * as onboardingService from './services/onboardingService';
import { decodeCartFromString, encodeCartToString } from './utils';

type Screen =
  | 'landing'
  | 'login'
  | 'onboardingStep1'
  | 'onboardingStep2'
  | 'app' 
  | 'settings'
  | 'storefront'
  | 'cart'
  | 'ordersDashboard'
  | 'marketingAI'
  | 'adminMessagesView' 
  | 'superadminPanel'; 

const calculateScreen = (
  user: User | null,
  isAuth: boolean,
  currentOnboardingStatus: OnboardingStatus
): Screen => {
  if (!isAuth) {
    return 'landing';
  }
  if (user?.role === 'superadmin') {
    return 'superadminPanel';
  }
  if (user?.role === 'sme') {
    if (currentOnboardingStatus === 'NOT_STARTED') {
        return 'onboardingStep1';
    }
    if (currentOnboardingStatus === 'BUSINESS_INFO_SUBMITTED') {
        return 'onboardingStep2';
    }
    return 'app';
  }
  console.error("calculateScreen: Unhandled user state", { user, isAuth, currentOnboardingStatus });
  return 'landing';
};

// Theme Toggle Button Component
const ThemeToggleButton: React.FC<{ isDarkMode: boolean; onToggle: () => void; className?: string }> = ({ isDarkMode, onToggle, className = "" }) => {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-card)] focus-visible:ring-[var(--app-primary-color)] transition-colors duration-200 ${className} bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 shadow-sm`}
      aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDarkMode ? "Tema Claro" : "Tema Oscuro"}
    >
      {isDarkMode ? (
        <SunIcon className="w-5 h-5 text-yellow-400" />
      ) : (
        <MoonIcon className="w-5 h-5 text-primary" />
      )}
    </button>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(authService.getToken());
  const isAuthenticated = !!currentUser && !!token;

  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [isLoadingBusinessSettings, setIsLoadingBusinessSettings] = useState<boolean>(false);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isLoadingOnboardingStatus, setIsLoadingOnboardingStatus] = useState<boolean>(false);
  
  const isLoadingSMEData = isLoadingProducts || isLoadingBusinessSettings || isLoadingCart || isLoadingOrders || isLoadingOnboardingStatus;

  const [products, setProducts] = useState<Product[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({});
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('NOT_STARTED');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Theme initialization and effect
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialDarkMode = false;

    if (storedTheme === 'dark') {
      initialDarkMode = true;
    } else if (storedTheme === 'light') {
      initialDarkMode = false;
    } else {
      initialDarkMode = prefersDark;
    }
    
    setIsDarkMode(initialDarkMode);
    if (initialDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      if (newMode) {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  }, []);


  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role === 'sme') { 
      setIsLoadingProducts(true);
      setIsLoadingBusinessSettings(true);
      setIsLoadingCart(true);
      setIsLoadingOrders(true);
      setIsLoadingOnboardingStatus(true);

      Promise.all([
        productService.getProducts().then(setProducts).catch(err => { console.error("App: Error al cargar productos:", err); setProducts([]); }),
        businessSettingsService.getBusinessSettings().then(setBusinessSettings).catch(err => { console.error("App: Error al cargar config. negocio:", err); setBusinessSettings({}); }),
        cartService.getCart().then(userCart => {
            const urlParams = new URLSearchParams(window.location.search);
            const sharedCartParam = urlParams.get('sharedCart');
            if (sharedCartParam) {
                const decodedCart = decodeCartFromString(sharedCartParam);
                if (decodedCart) {
                  setCart(decodedCart);
                  cartService.saveCart(decodedCart);
                  const newUrl = window.location.pathname + window.location.hash;
                  window.history.replaceState({}, document.title, newUrl);
                } else {
                  setCart(userCart);
                }
            } else {
                setCart(userCart);
            }
        }).catch(err => { console.error("App: Error al cargar carrito:", err); setCart([]); }),
        orderService.getOrders().then(setOrders).catch(err => { console.error("App: Error al cargar pedidos:", err); setOrders([]); }),
        onboardingService.getOnboardingStatus().then(setOnboardingStatus).catch(err => { console.error("App: Error al cargar estado onboarding:", err); setOnboardingStatus('NOT_STARTED'); })
      ]).finally(() => {
        setIsLoadingProducts(false);
        setIsLoadingBusinessSettings(false);
        setIsLoadingCart(false);
        setIsLoadingOrders(false);
        setIsLoadingOnboardingStatus(false);
      });
    } else if (!currentUser || currentUser.role !== 'sme') { 
      setProducts([]);
      setBusinessSettings({});
      setCart([]);
      setOrders([]);
      setOnboardingStatus('NOT_STARTED');
      setIsLoadingProducts(false);
      setIsLoadingBusinessSettings(false);
      setIsLoadingCart(false);
      setIsLoadingOrders(false);
      setIsLoadingOnboardingStatus(false);
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-primary-color',
      businessSettings?.primaryColor || '#2563eb' 
    );
  }, [businessSettings?.primaryColor]);


  const [currentScreen, setCurrentScreen] = useState<Screen>(() => 
    calculateScreen(currentUser, isAuthenticated, onboardingStatus)
  );
  
  useEffect(() => {
    const newCalculatedScreen = calculateScreen(currentUser, isAuthenticated, onboardingStatus);
    if (newCalculatedScreen !== currentScreen) {
      // If user is currently on adminMessagesView, and still authenticated, let them stay
      // unless calculateScreen is trying to send them to login/landing (meaning they lost auth)
      if (currentScreen === 'adminMessagesView' && isAuthenticated && newCalculatedScreen !== 'landing' && newCalculatedScreen !== 'login') {
        // Don't navigate away from adminMessagesView if user is still authenticated
        // and the new screen isn't a forced non-auth screen.
      } else {
        setCurrentScreen(newCalculatedScreen);
      }
    }
  }, [currentUser, isAuthenticated, onboardingStatus]);


  const handleSetBusinessSettings = useCallback(async (settingsUpdate: Partial<BusinessSettings>) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    const newSettings = { ...businessSettings, ...settingsUpdate };
    setBusinessSettings(newSettings);
    try {
      await businessSettingsService.saveBusinessSettings(newSettings);
    } catch (error) {
      console.error("App: Error al guardar config. negocio:", error);
    }
  }, [currentUser, businessSettings]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    searchTerm: '',
    category: '',
    status: '',
    sortOrder: 'date-desc',
  });
  
  const handleNavigateToLogin = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  const handleNavigateToSettings = useCallback(() => {
    setCurrentScreen('settings');
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigateToStorefront = useCallback(() => {
    setCurrentScreen('storefront');
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigateToCart = useCallback(() => {
    setCurrentScreen('cart');
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigateToApp = useCallback(() => { 
    if (currentUser?.role === 'superadmin') {
        setCurrentScreen('superadminPanel');
    } else {
        // Let the useEffect handle the correct screen based on auth and onboarding
        // This ensures that if onboardingStatus changed, it navigates correctly.
        const smeTargetScreen = calculateScreen(currentUser, isAuthenticated, onboardingStatus);
        setCurrentScreen(smeTargetScreen);
    }
    setIsMobileMenuOpen(false);
  }, [currentUser, isAuthenticated, onboardingStatus]);

  const handleNavigateToOrdersDashboard = useCallback(() => {
    setCurrentScreen('ordersDashboard');
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigateToMarketingAI = useCallback(() => {
    setCurrentScreen('marketingAI');
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigateToAdminMessages = useCallback(() => {
    setCurrentScreen('adminMessagesView');
    setIsMobileMenuOpen(false);
  }, []);
  
  const handleOnboardingStep1Submit = useCallback(async (data: OnboardingStep1Data) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    handleSetBusinessSettings({ 
      businessName: data.businessName, 
      businessCategory: data.businessCategory 
    });
    try {
      await onboardingService.saveOnboardingStatus('BUSINESS_INFO_SUBMITTED');
      setOnboardingStatus('BUSINESS_INFO_SUBMITTED'); 
    } catch (error) {
        console.error("App: Error al guardar estado onboarding (step 1):", error);
    }
  }, [currentUser, handleSetBusinessSettings]);

  const handleOnboardingStep2Submit = useCallback(async (settings: OnboardingStep2Data) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    handleSetBusinessSettings(settings);
    try {
      await onboardingService.saveOnboardingStatus('PERSONALIZATION_SUBMITTED');
      setOnboardingStatus('PERSONALIZATION_SUBMITTED'); 
    } catch (error) {
        console.error("App: Error al guardar estado onboarding (step 2):", error);
    }
  }, [currentUser, handleSetBusinessSettings]);


  const handleLoginSuccess = useCallback(async (authData: AuthResponse) => {
    setCurrentUser(authData.user); 
    setToken(authData.token);
    if (authData.user.role === 'sme') {
        setIsLoadingProducts(true); 
        setIsLoadingBusinessSettings(true);
        setIsLoadingCart(true);
        setIsLoadingOrders(true);
        setIsLoadingOnboardingStatus(true);
        // Onboarding status will be fetched by the main useEffect for currentUser changes
    }
    // The main useEffect watching [currentUser, isAuthenticated, onboardingStatus]
    // will handle setting the correct screen after login.
  }, []); 

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
    setToken(null);
    setProducts([]);
    setBusinessSettings({}); 
    setCart([]);
    setOrders([]);
    setOnboardingStatus('NOT_STARTED'); 
    setEditingProduct(null);
    setActiveFilters({ searchTerm: '', category: '', status: '', sortOrder: 'date-desc' });
    setIsMobileMenuOpen(false);
    document.documentElement.style.setProperty('--app-primary-color', '#2563eb'); 
  }, []);

  const addProductHandler = useCallback(async (productFormData: ProductFormData) => {
    if (!currentUser || currentUser.role !== 'sme') {
      console.error("No hay usuario SME actual para añadir el producto.");
      return;
    }
    const { stock: stockString, basePrice: inputBasePrice, currency: inputCurrency, taxRate: inputTaxRate, discountRate: inputDiscountRate, ...restInput } = productFormData.input;
    
    let stockAsNumber: number | undefined = undefined;
    if (stockString !== undefined && stockString.trim() !== '') {
      const parsedStock = parseInt(stockString, 10);
      if (!isNaN(parsedStock)) stockAsNumber = parsedStock;
    }

    const productDataForService: Omit<Product, 'id' | 'createdAt'> = {
      name: restInput.name,
      category: restInput.category,
      idea: restInput.idea,
      basePrice: inputBasePrice || '0', 
      currency: inputCurrency || 'USD', 
      taxRate: inputTaxRate || undefined,
      discountRate: inputDiscountRate || undefined,
      generatedDescription: productFormData.generatedDescription,
      imagePreviewUrls: productFormData.imagePreviewUrls || [],
      videoUrl: productFormData.videoUrl || undefined,
      status: productFormData.input.status || ProductStatus.Activo,
      stock: stockAsNumber,
    };

    try {
      const newProduct = await productService.addProduct(productDataForService);
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      setEditingProduct(null);
      if (onboardingStatus === 'PERSONALIZATION_SUBMITTED') {
        await onboardingService.saveOnboardingStatus('COMPLETED');
        setOnboardingStatus('COMPLETED');
      }
    } catch (error) {
      console.error("App: Error al añadir producto vía servicio:", error);
    }
  }, [currentUser, onboardingStatus]);


  const handleSetEditingProduct = useCallback((product: Product | null) => {
    setEditingProduct(product);
    if (product && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    try {
      await productService.deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      if (editingProduct && editingProduct.id === productId) {
        setEditingProduct(null);
      }
      const newCart = cart.filter(item => item.productId !== productId);
      if (newCart.length !== cart.length) {
        setCart(newCart);
        await cartService.saveCart(newCart);
      }
    } catch (error) {
      console.error("App: Error al eliminar producto vía servicio:", error);
    }
  }, [currentUser, editingProduct, cart]);

  const handleUpdateProduct = useCallback(async (productToUpdate: Product) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    try {
      const updatedProduct = await productService.updateProduct(productToUpdate);
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      const newCart = cart.map(item =>
          item.productId === updatedProduct.id
          ? { ...item, name: updatedProduct.name, imagePreviewUrl: updatedProduct.imagePreviewUrls?.[0] } 
          : item
      );
      if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
          setCart(newCart);
          await cartService.saveCart(newCart);
      }
      handleSetEditingProduct(null);
    } catch (error) {
      console.error("App: Error al actualizar producto vía servicio:", error);
    }
  }, [currentUser, cart, handleSetEditingProduct]);


  const handleDuplicateProduct = useCallback(async (productToDuplicate: Product) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    const { id, createdAt, ...restOfProduct } = productToDuplicate;
    const duplicatedProductData: Omit<Product, 'id' | 'createdAt'> = {
      ...restOfProduct, 
      name: `${productToDuplicate.name} (Copia)`,
      status: ProductStatus.Inactivo,
    };
    try {
      const newProduct = await productService.addProduct(duplicatedProductData);
      setProducts(prevProducts => [newProduct, ...prevProducts]);
    } catch (error) {
      console.error("App: Error al duplicar producto vía servicio:", error);
    }
  }, [currentUser]);


  const handleFilterChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters);
  }, []);

  const handleAddToCart = useCallback(async (product: Product, finalPrice: number) => { 
    if (!currentUser || currentUser.role !== 'sme') return;
    let updatedCart;
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: finalPrice.toFixed(2), 
          quantity: 1,
          imagePreviewUrl: product.imagePreviewUrls?.[0],
        },
      ];
    }
    setCart(updatedCart);
    await cartService.saveCart(updatedCart);
  }, [currentUser, cart]);

  const handleRemoveFromCart = useCallback(async (productId: string) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    await cartService.saveCart(updatedCart);
  }, [currentUser, cart]);

  const handleUpdateCartQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    let updatedCart;
    if (newQuantity <= 0) {
      updatedCart = cart.filter(item => item.productId !== productId);
    } else {
      updatedCart = cart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    }
    setCart(updatedCart);
    await cartService.saveCart(updatedCart);
  }, [currentUser, cart]);

  const handleClearCart = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'sme') return;
    setCart([]);
    await cartService.saveCart([]);
  }, [currentUser]);

  const handleUpdateProductStatus = useCallback(async (productId: string) => {
    if(!currentUser || currentUser.role !== 'sme') return;
    
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) return;

    let newStatus: ProductStatus;
    switch (productToUpdate.status) {
        case ProductStatus.Activo: newStatus = ProductStatus.Inactivo; break;
        case ProductStatus.Inactivo: newStatus = ProductStatus.Activo; break;
        case ProductStatus.Agotado: newStatus = ProductStatus.Activo; break;
        default: newStatus = ProductStatus.Activo;
    }
    const updatedProductData = { ...productToUpdate, status: newStatus };

    try {
        const updatedProduct = await productService.updateProduct(updatedProductData);
        setProducts(prevProducts =>
            prevProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
        );
    } catch (error) {
        console.error("App: Error al actualizar estado del producto vía servicio:", error);
    }
  }, [currentUser, products]);

  const handleAddOrder = useCallback(async (orderData: Pick<Order, 'items' | 'totalAmount' | 'customerNotes'>) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    try {
      const newOrder = await orderService.addOrder(orderData);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
    } catch (error) {
      console.error("App: Error al añadir pedido vía servicio:", error);
    }
  }, [currentUser]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser || currentUser.role !== 'sme') return;
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, newStatus);
      if (updatedOrder) {
        setOrders(prevOrders =>
          prevOrders.map(order => (order.id === orderId ? updatedOrder : order))
        );
      }
    } catch (error) {
      console.error("App: Error al actualizar estado del pedido vía servicio:", error);
    }
  }, [currentUser]);


  const filteredProducts = useMemo(() => {
    if (currentUser?.role !== 'sme') return []; 
    let sortedProducts = [...products];

    sortedProducts = sortedProducts.filter(product => {
      const searchTermMatch = activeFilters.searchTerm
        ? product.name.toLowerCase().includes(activeFilters.searchTerm.toLowerCase()) ||
          product.idea.toLowerCase().includes(activeFilters.searchTerm.toLowerCase())
        : true;
      const categoryMatch = activeFilters.category
        ? product.category === activeFilters.category
        : true;
      const statusMatch = activeFilters.status
        ? product.status === activeFilters.status
        : true;
      return searchTermMatch && categoryMatch && statusMatch;
    });

    switch (activeFilters.sortOrder) {
      case 'date-desc':
        sortedProducts.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'date-asc':
        sortedProducts.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'name-asc':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sortedProducts.sort((a, b) => {
          const priceA = parseFloat(a.basePrice) || Infinity; 
          const priceB = parseFloat(b.basePrice) || Infinity; 
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        sortedProducts.sort((a, b) => {
          const priceA = parseFloat(a.basePrice) || -Infinity; 
          const priceB = parseFloat(b.basePrice) || -Infinity; 
          return priceB - priceA;
        });
        break;
      default:
        sortedProducts.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sortedProducts;
  }, [products, activeFilters, currentUser]);
  
  if (currentUser?.role === 'sme' && isLoadingSMEData && (currentScreen === 'app' || currentScreen === 'marketingAI' || currentScreen === 'settings' || currentScreen === 'storefront' || currentScreen === 'cart' || currentScreen === 'ordersDashboard' || currentScreen === 'adminMessagesView')) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-default)] text-[var(--text-default)]">
            <SparklesIcon className="w-16 h-16 text-primary animate-pulse mb-4" />
            <p className="text-[var(--text-muted)]">Cargando datos de tu tienda...</p>
        </div>
    );
  }
  
  if (isLoadingOnboardingStatus && (currentScreen === 'onboardingStep1' || currentScreen === 'onboardingStep2')) {
     return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-default)] text-[var(--text-default)]">
            <SparklesIcon className="w-16 h-16 text-primary animate-pulse mb-4" />
            <p className="text-[var(--text-muted)]">Cargando configuración inicial...</p>
        </div>
    );
  }

  if (currentScreen === 'landing') {
    return <LandingPage onNavigateToLogin={handleNavigateToLogin} />;
  }

  if (currentScreen === 'login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === 'superadminPanel' && currentUser?.role === 'superadmin') {
    return <SuperadminPanel currentUser={currentUser} onLogout={handleLogout} />;
  }
  
  if (currentUser?.role === 'sme') {
    if (currentScreen === 'onboardingStep1') {
      return <OnboardingStep1BusinessInfo 
                initialBusinessName={businessSettings?.businessName || ''}
                initialBusinessCategory={businessSettings?.businessCategory || ''}
                onSubmit={handleOnboardingStep1Submit} 
             />;
    }

    if (currentScreen === 'onboardingStep2') {
      return <OnboardingStep2Personalization 
                initialSettings={{
                  primaryColor: businessSettings?.primaryColor || '#2563eb',
                  logoPreviewUrl: businessSettings?.logoPreviewUrl || '',
                  whatsappNumber: businessSettings?.whatsappNumber || '',
                  contactInfo: businessSettings?.contactInfo || ''
                }}
                onSubmit={handleOnboardingStep2Submit} 
                onNavigateBack={() => setCurrentScreen('onboardingStep1')}
             />;
    }

    if (currentScreen === 'settings') {
      return (
        <SettingsPage
          initialSettings={businessSettings}
          onSaveSettings={handleSetBusinessSettings}
          onNavigateBack={handleNavigateToApp}
        />
      );
    }

    if (currentScreen === 'storefront') {
      return (
        <StorefrontPage
          allProducts={products} 
          settings={businessSettings}
          onNavigateBack={handleNavigateToApp}
          cart={cart}
          onAddToCart={handleAddToCart}
          onNavigateToCart={handleNavigateToCart}
        />
      );
    }

    if (currentScreen === 'cart') {
      return (
        <CartPage
          cartItems={cart}
          settings={businessSettings}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onNavigateBackToStore={handleNavigateToStorefront}
          onAddOrder={handleAddOrder}
          encodeCartToString={encodeCartToString}
        />
      );
    }

    if (currentScreen === 'ordersDashboard') {
      return (
        <OrdersDashboardPage
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onNavigateBack={handleNavigateToApp}
        />
      );
    }

    if (currentScreen === 'marketingAI') {
      return (
        <AIMarketingAssistantPage
          onNavigateBack={handleNavigateToApp}
        />
      );
    }

    if (currentScreen === 'adminMessagesView') {
      return (
        <AdminMessagesView
          currentUser={currentUser}
          onNavigateBack={handleNavigateToApp}
        />
      );
    }
  }

  if (currentScreen === 'app' && currentUser?.role === 'sme') {
    const appTitle = businessSettings?.businessName
      ? `Panel de ${businessSettings.businessName}`
      : 'Gestor de Productos AI';
    
    const showOnboardingProductTip = onboardingStatus === 'PERSONALIZATION_SUBMITTED' && products.length === 0 && !isLoadingProducts;

    const NavButton: React.FC<{onClick: () => void; title: string; ariaLabel: string; icon: JSX.Element; text?: string; className?: string}> = 
      ({onClick, title, ariaLabel, icon, text, className=""}) => (
      <button
        onClick={onClick}
        className={`flex items-center p-2 sm:p-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 shadow-sm transition-colors duration-150 ${className}`}
        title={title}
        aria-label={ariaLabel}
      >
        {React.cloneElement(icon, { className: `w-5 h-5 text-neutral-600 dark:text-neutral-300`})}
        {text && <span className="ml-1.5 sm:ml-2 text-sm sm:text-base hidden sm:inline">{text}</span>}
      </button>
    );

    const MobileMenuLink: React.FC<{onClick: () => void; icon: JSX.Element; text: string; isThemeToggle?: boolean}> = ({onClick, icon, text, isThemeToggle = false}) => (
       <button
          onClick={onClick}
          className={`flex items-center w-full px-4 py-3 text-left text-neutral-700 dark:text-neutral-200 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-[var(--app-primary-color)] transition-colors duration-150 rounded-md group`}
          aria-label={text}
        >
          {isThemeToggle ? icon : React.cloneElement(icon, { className: "w-5 h-5 mr-3 text-neutral-500 dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-[var(--app-primary-color)]"})}
          <span className="text-sm font-medium">{text}</span>
        </button>
    );

    return (
      <div className="min-h-screen bg-[var(--bg-default)] text-[var(--text-default)] py-8 px-4 flex flex-col items-center themed-transition">
        <header className="mb-10 w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mr-2 sm:mr-3" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-default)]">
                {appTitle}
              </h1>
              <p className="text-sm sm:text-base text-[var(--text-muted)]">
                {currentUser ? `Hola, ${currentUser.name || currentUser.email}! ` : ''}Gestiona tus ideas y productos.
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            <ThemeToggleButton isDarkMode={isDarkMode} onToggle={toggleTheme} />
            <NavButton onClick={handleNavigateToAdminMessages} title="Ver Mensajes" ariaLabel="Ver Mensajes de Administradores" icon={<InboxIcon />} />
            <NavButton onClick={handleNavigateToOrdersDashboard} title="Ver Pedidos" ariaLabel="Ver Pedidos" icon={<ClipboardListIcon />} />
            <NavButton onClick={handleNavigateToStorefront} title="Ver Mi Tienda" ariaLabel="Ver Mi Tienda" icon={<BuildingStorefrontIcon />} />
            <NavButton onClick={handleNavigateToMarketingAI} title="Asistente Marketing IA" ariaLabel="Asistente de Marketing IA" icon={<ChatBubbleLeftEllipsisIcon />} />
            <NavButton onClick={handleNavigateToSettings} title="Configuración" ariaLabel="Configuración del Negocio" icon={<CogIcon />} />
            <NavButton onClick={handleLogout} title="Cerrar Sesión" ariaLabel="Cerrar Sesión" icon={<LogoutIcon />} text="Salir" className="px-3 sm:px-4"/>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 shadow-sm"
              title="Abrir menú"
              aria-label="Abrir menú de navegación"
            >
              <MenuIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          >
            <div 
              className="fixed top-0 right-0 h-full w-64 sm:w-72 bg-white dark:bg-neutral-800 shadow-xl p-4 transition-transform duration-300 ease-in-out transform translate-x-0 themed-transition"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="mobile-menu-title" className="text-lg font-semibold text-primary">Menú</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" aria-label="Cerrar menú">
                  <XIcon className="w-5 h-5"/>
                </button>
              </div>
              <nav className="flex flex-col space-y-1">
                <MobileMenuLink onClick={handleNavigateToApp} icon={<SparklesIcon />} text="Panel Principal"/>
                <MobileMenuLink onClick={handleNavigateToAdminMessages} icon={<InboxIcon />} text="Mis Mensajes" />
                <MobileMenuLink onClick={handleNavigateToOrdersDashboard} icon={<ClipboardListIcon />} text="Ver Pedidos" />
                <MobileMenuLink onClick={handleNavigateToStorefront} icon={<BuildingStorefrontIcon />} text="Ver Mi Tienda" />
                <MobileMenuLink onClick={handleNavigateToMarketingAI} icon={<ChatBubbleLeftEllipsisIcon />} text="Asistente Marketing" />
                <MobileMenuLink onClick={handleNavigateToSettings} icon={<CogIcon />} text="Configuración" />
                <MobileMenuLink 
                    onClick={toggleTheme} 
                    icon={isDarkMode ? <SunIcon className="w-5 h-5 mr-3 text-yellow-400" /> : <MoonIcon className="w-5 h-5 mr-3 text-primary" />} 
                    text={isDarkMode ? "Tema Claro" : "Tema Oscuro"}
                    isThemeToggle={true}
                />
                <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <MobileMenuLink onClick={handleLogout} icon={<LogoutIcon />} text="Cerrar Sesión" />
                </div>
              </nav>
            </div>
          </div>
        )}

        {showOnboardingProductTip && (
          <div className="w-full max-w-3xl mb-8 p-6 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg text-center shadow-md animate-pulse themed-transition">
            <h3 className="text-lg font-semibold text-primary mb-2">¡Casi listo!</h3>
            <p className="text-neutral-700 dark:text-neutral-200">
              Solo falta un paso: añade tu primer producto para completar la configuración de tu tienda y hacerla visible.
            </p>
          </div>
        )}

        <div ref={formRef} className="w-full max-w-3xl mb-10">
          <ProductForm
            onAddProduct={addProductHandler}
            productToEdit={editingProduct}
            onUpdateProduct={handleUpdateProduct}
            onCancelEdit={() => setEditingProduct(null)}
            isFirstProductAfterOnboarding={showOnboardingProductTip}
          />
        </div>

        {products.length > 0 && !isLoadingProducts && (
          <ProductFilterControls
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        )}

        <ProductList
          products={filteredProducts}
          onEditProduct={handleSetEditingProduct}
          onDeleteProduct={handleDeleteProduct}
          onDuplicateProduct={handleDuplicateProduct}
          onUpdateProductStatus={handleUpdateProductStatus}
          activeFilters={activeFilters}
        />
        
        <footer className="mt-12 text-center text-[var(--text-muted)] text-sm">
          <p>&copy; {new Date().getFullYear()} {businessSettings.businessName || 'Gestor de Productos AI'}. Potenciando PYMEs.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-default)] text-[var(--text-default)] themed-transition">
      <SparklesIcon className="w-16 h-16 text-primary animate-pulse mb-4" />
      <p className="text-[var(--text-muted)]">Cargando aplicación...</p>
    </div>
  );
};

export default App;