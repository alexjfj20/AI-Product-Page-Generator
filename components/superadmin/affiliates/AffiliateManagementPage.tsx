import React, { useState, useCallback } from 'react';
import { UserGroupIcon, CogIcon, ClipboardListIcon, SparklesIcon } from '../../icons'; // Assuming Sparkles for Analytics for now
import AffiliateListPage from './AffiliateListPage';
import AffiliateSettingsPage from './AffiliateSettingsPage';
import AffiliatePayoutHistoryPage from './AffiliatePayoutHistoryPage';
import AffiliateAnalyticsPage from './AffiliateAnalyticsPage';

type AffiliateSubPage = 'list' | 'settings' | 'payouts' | 'analytics';

interface TabItem {
  id: AffiliateSubPage;
  label: string;
  icon: JSX.Element;
  component: React.FC;
}

const tabItems: TabItem[] = [
  { id: 'list', label: 'Lista de Afiliados', icon: <UserGroupIcon className="w-5 h-5" />, component: AffiliateListPage },
  { id: 'settings', label: 'Configuración', icon: <CogIcon className="w-5 h-5" />, component: AffiliateSettingsPage },
  { id: 'payouts', label: 'Historial de Pagos', icon: <ClipboardListIcon className="w-5 h-5" />, component: AffiliatePayoutHistoryPage },
  { id: 'analytics', label: 'Analíticas', icon: <SparklesIcon className="w-5 h-5" />, component: AffiliateAnalyticsPage },
];

const AffiliateManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AffiliateSubPage>('list');

  const handleTabChange = useCallback((tabId: AffiliateSubPage) => {
    setActiveTab(tabId);
  }, []);

  const ActivePageComponent = tabItems.find(tab => tab.id === activeTab)?.component || AffiliateListPage;

  return (
    <div className="space-y-6">
      <header className="pb-6 border-b border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-800">Gestión de Afiliados</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Administra tu programa de afiliados, configura comisiones y monitorea el rendimiento.
        </p>
      </header>

      <div className="bg-white shadow-lg rounded-xl border border-neutral-200">
        <nav className="flex border-b border-neutral-200" aria-label="Tabs de Afiliados">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center px-4 py-3 text-sm font-medium focus:outline-none transition-colors duration-150
                ${activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {React.cloneElement(tab.icon, { className: `w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-primary' : 'text-neutral-400 group-hover:text-neutral-500'}` })}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6">
          <ActivePageComponent />
        </div>
      </div>
    </div>
  );
};

export default AffiliateManagementPage;
