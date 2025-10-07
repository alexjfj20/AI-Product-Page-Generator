import React from 'react';
import { SparklesIcon } from '../icons';

const SuperadminDashboardPage: React.FC = () => {
  // Mock data - replace with actual data fetching
  const stats = [
    { label: 'Cuentas Admin Activas', value: 15, change: '+2', changeType: 'positive' as const },
    { label: 'Planes Vendidos (Mes)', value: 8, change: '+1', changeType: 'positive' as const },
    { label: 'Generaciones AI (Hoy)', value: 120, change: '-5%', changeType: 'negative' as const },
    { label: 'Errores API (24h)', value: 1, change: 'N/A', changeType: 'neutral' as const },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-6 border-b border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-800">Dashboard Superadmin</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vista general del estado del sistema y actividad de administradores.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 shadow-lg rounded-xl border border-neutral-200">
            <p className="text-sm font-medium text-neutral-500 truncate">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{stat.value}</p>
            {stat.change !== 'N/A' && (
              <p className={`mt-1 text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-neutral-500'
              }`}>
                {stat.change} vs ayer
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Placeholder for recent activity or alerts */}
      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Actividad Reciente</h2>
        <div className="text-center py-10">
          <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            Aquí se mostrará la actividad reciente de los administradores y del sistema.
            (Funcionalidad pendiente de implementación)
          </p>
        </div>
      </div>
       <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Alertas del Sistema</h2>
        <div className="text-center py-10">
          <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            Las alertas importantes del sistema aparecerán aquí.
            (Funcionalidad pendiente de implementación)
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboardPage;