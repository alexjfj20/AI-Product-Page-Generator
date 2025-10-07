import React, { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '../types';
import * as authService from '../services/authService'; // Import authService
import { 
    SparklesIcon, UserCircleIcon, CreditCardIcon, CogIcon, 
    ChatBubbleLeftEllipsisIcon, ArchiveIcon, LogoutIcon, MenuIcon, XIcon, PhotoIcon,
    UserGroupIcon // Added for Affiliates
} from './icons'; 

// Import sub-pages
import SuperadminDashboardPage from './superadmin/SuperadminDashboardPage';
import AdminAccountManagementPage from './superadmin/AdminAccountManagementPage';
import SubscriptionPlanManagementPage from './superadmin/SubscriptionPlanManagementPage';
import AIGeneratorConfigPage from './superadmin/AIGeneratorConfigPage';
import AdminMessagingPage from './superadmin/AdminMessagingPage';
import BackupManagementPage from './superadmin/BackupManagementPage';
import AffiliateManagementPage from './superadmin/affiliates/AffiliateManagementPage'; // New Affiliate Page

interface SuperadminPanelProps {
  currentUser: User;
  onLogout: () => void;
}

type SuperadminPage = 
  | 'dashboard' 
  | 'adminAccounts' 
  | 'subscriptionPlans' 
  | 'aiConfig' 
  | 'messaging' 
  | 'backups'
  | 'affiliates'; // Added affiliates page type

interface NavItem {
  id: SuperadminPage;
  label: string;
  icon: JSX.Element;
  component: React.FC<any>; // Allow any props for now, or create a common interface
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <SparklesIcon className="w-5 h-5" />, component: SuperadminDashboardPage },
  { id: 'adminAccounts', label: 'Cuentas Admin', icon: <UserCircleIcon className="w-5 h-5" />, component: AdminAccountManagementPage },
  { id: 'subscriptionPlans', label: 'Planes Suscripción', icon: <CreditCardIcon className="w-5 h-5" />, component: SubscriptionPlanManagementPage },
  { id: 'affiliates', label: 'Afiliados', icon: <UserGroupIcon className="w-5 h-5" />, component: AffiliateManagementPage }, // New Affiliates Nav Item
  { id: 'aiConfig', label: 'Config. Generador IA', icon: <CogIcon className="w-5 h-5" />, component: AIGeneratorConfigPage },
  { id: 'messaging', label: 'Mensajería Admin', icon: <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />, component: AdminMessagingPage },
  { id: 'backups', label: 'Copias Seguridad', icon: <ArchiveIcon className="w-5 h-5" />, component: BackupManagementPage },
];

export const SuperadminPanel: React.FC<SuperadminPanelProps> = ({ currentUser, onLogout }) => {
  const [activePage, setActivePage] = useState<SuperadminPage>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<string | undefined>(currentUser.profileImageUrl);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentProfileImageUrl(currentUser.profileImageUrl);
  }, [currentUser.profileImageUrl]);

  const handleNavClick = useCallback((page: SuperadminPage) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  }, []);

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        alert("La imagen es demasiado grande. Máximo 2MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert("Selecciona un archivo de imagen válido.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        try {
          const updatedUser = await authService.updateUserProfileImage(currentUser.id, base64Url);
          if (updatedUser && updatedUser.profileImageUrl) {
            setCurrentProfileImageUrl(updatedUser.profileImageUrl);
            // Note: If App.tsx manages currentUser state globally, it might need an update mechanism too.
            // For this component, updating local state provides immediate feedback.
          }
        } catch (error) {
          console.error("Error updating profile image:", error);
          alert("Error al actualizar la imagen de perfil.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ActivePageComponent = navItems.find(item => item.id === activePage)?.component || SuperadminDashboardPage;

  const SidebarLink: React.FC<{item: NavItem; isActive: boolean; onClick: () => void;}> = ({item, isActive, onClick}) => (
    <button
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group
                    ${isActive 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-neutral-700 hover:bg-primary/10 hover:text-primary'
                    }`}
    >
        {React.cloneElement(item.icon, { 
            className: `w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-primary'}`
        })}
        {item.label}
    </button>
  );

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col
                   ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú principal del superadministrador"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 h-16">
          <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-primary mr-2" />
            <span className="text-lg font-semibold text-neutral-800">Superadmin</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-1 text-neutral-500 hover:text-neutral-700"
            aria-label="Cerrar menú"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink 
                key={item.id}
                item={item}
                isActive={activePage === item.id}
                onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-red-500/10 hover:text-red-600 transition-colors duration-150 group"
          >
            <LogoutIcon className="w-5 h-5 mr-3 text-neutral-500 group-hover:text-red-600" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between md:justify-end px-6 border-b border-neutral-200">
            <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="md:hidden p-2 text-neutral-600 hover:text-primary"
                aria-label="Abrir menú"
                aria-controls="superadmin-sidebar"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
          <div className="flex items-center">
            <span className="text-sm text-neutral-600 mr-3 hidden sm:inline">Hola, {currentUser.name || currentUser.email}</span>
            <input
              type="file"
              ref={profileImageInputRef}
              onChange={handleProfileImageChange}
              accept="image/png, image/jpeg, image/gif, image/webp"
              className="sr-only"
              id="superadmin-profile-image-input"
            />
            <label htmlFor="superadmin-profile-image-input" className="cursor-pointer" title="Cambiar foto de perfil">
                {currentProfileImageUrl ? (
                    <img src={currentProfileImageUrl} alt="Foto de perfil" className="w-9 h-9 rounded-full object-cover border-2 border-neutral-200 hover:border-primary transition-colors" />
                ) : (
                    <UserCircleIcon className="w-9 h-9 text-neutral-400 hover:text-primary transition-colors" />
                )}
            </label>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-6">
          <ActivePageComponent />
        </main>
      </div>
    </div>
  );
};

export default SuperadminPanel;
