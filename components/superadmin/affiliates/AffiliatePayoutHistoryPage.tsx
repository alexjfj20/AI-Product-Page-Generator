import React, { useState, useEffect, useCallback } from 'react';
import { AffiliatePayout, PayoutStatus } from '../../../types';
import * as affiliatePayoutService from '../../../services/affiliatePayoutService';
import { LoadingSpinnerIcon, ClipboardListIcon } from '../../icons';

const AffiliatePayoutHistoryPage: React.FC = () => {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add filter states here if needed: dateRange, statusFilter

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await affiliatePayoutService.getAffiliatePayouts(); // Get all payouts
        setPayouts(data.sort((a, b) => b.payoutDate - a.payoutDate));
    } catch (err) {
        setError("Error al cargar el historial de pagos.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const getStatusClass = (status: PayoutStatus) => {
    switch (status) {
        case PayoutStatus.Paid: return 'bg-green-100 text-green-700';
        case PayoutStatus.Pending: return 'bg-yellow-100 text-yellow-700';
        case PayoutStatus.Failed: return 'bg-red-100 text-red-700';
        default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><LoadingSpinnerIcon className="w-8 h-8 text-primary" /> <p className="ml-2">Cargando historial de pagos...</p></div>;
  }

  if (error) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-700">Historial de Pagos a Afiliados</h2>
       {/* Placeholder for filters and export */}
       <div className="flex justify-between items-center mb-4 p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <p className="text-sm text-neutral-600">Filtros y exportación (Próximamente)</p>
            <button className="px-3 py-1.5 text-xs bg-primary/80 text-white rounded-md hover:bg-primary shadow-sm" disabled>Exportar CSV</button>
       </div>

      {payouts.length === 0 ? (
        <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
          <ClipboardListIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No hay pagos registrados todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar shadow border-b border-neutral-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">ID Afiliado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Fecha Pago</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Método</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Transacción ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {payouts.map(payout => (
                <tr key={payout.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500" title={payout.affiliateId}>{payout.affiliateId.substring(0,12)}...</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-600">{new Date(payout.payoutDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-green-600">${payout.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-600">{payout.method}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <span className={`px-2 py-0.5 inline-flex font-semibold rounded-full border ${getStatusClass(payout.status)}`}>
                        {payout.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500" title={payout.transactionId}>{payout.transactionId ? payout.transactionId.substring(0,15)+'...' : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AffiliatePayoutHistoryPage;
