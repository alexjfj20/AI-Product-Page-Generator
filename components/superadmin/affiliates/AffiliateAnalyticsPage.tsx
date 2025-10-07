import React from 'react';
import { SparklesIcon, UserGroupIcon, CurrencyDollarIcon, ClipboardListIcon } from '../../icons'; // Example icons

// Mock data for analytics cards
const summaryStats = [
  { id: 'totalAffiliates', label: 'Total Afiliados', value: '25', icon: <UserGroupIcon className="w-6 h-6 text-blue-500" /> },
  { id: 'activeReferrals', label: 'Referidos Activos (Mes)', value: '120', icon: <ClipboardListIcon className="w-6 h-6 text-green-500" /> },
  { id: 'commissionsGenerated', label: 'Comisiones Generadas (Mes)', value: '$2,350.75', icon: <CurrencyDollarIcon className="w-6 h-6 text-yellow-500" /> },
  { id: 'payoutsPending', label: 'Pagos Pendientes', value: '3 ($450.00)', icon: <CurrencyDollarIcon className="w-6 h-6 text-red-500" /> },
];

const AffiliateAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-700">Analíticas y Métricas de Afiliados</h2>
      
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryStats.map(stat => (
          <div key={stat.id} className="bg-white p-5 shadow-lg rounded-xl border border-neutral-200 flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
              {React.cloneElement(stat.icon, { className: `w-5 h-5 ${stat.icon.props.className || 'text-primary'}` })}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 truncate">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section Placeholder */}
      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">Alertas Importantes</h3>
        <div className="text-center py-8">
            <SparklesIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">
                Alertas (ej. afiliados que alcanzaron mínimo de cobro) aparecerán aquí. (Próximamente)
            </p>
        </div>
      </div>

      {/* Charts Section Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Afiliados Activos por Mes</h3>
          <div className="text-center py-16">
            <SparklesIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Gráfica de afiliados (Próximamente)</p>
          </div>
        </div>
        <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Top 10 Afiliados Efectivos</h3>
           <div className="text-center py-16">
            <SparklesIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Gráfica top afiliados (Próximamente)</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Total Comisiones Pagadas</h3>
           <div className="text-center py-16">
            <SparklesIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Gráfica comisiones pagadas (Próximamente)</p>
          </div>
        </div>
    </div>
  );
};

export default AffiliateAnalyticsPage;
