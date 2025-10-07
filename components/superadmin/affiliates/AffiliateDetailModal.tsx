import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../Modal';
import { Affiliate, ReferredClient, AffiliatePayout } from '../../../types';
import * as referredClientService from '../../../services/referredClientService';
import * as affiliatePayoutService from '../../../services/affiliatePayoutService';
import { LoadingSpinnerIcon, UserGroupIcon, CurrencyDollarIcon, ClipboardListIcon } from '../../icons';

interface AffiliateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliate: Affiliate | null;
}

const AffiliateDetailModal: React.FC<AffiliateDetailModalProps> = ({ isOpen, onClose, affiliate }) => {
  const [referredClients, setReferredClients] = useState<ReferredClient[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && affiliate) {
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const [clientsData, payoutsData] = await Promise.all([
            referredClientService.getReferredClientsByAffiliate(affiliate.id),
            affiliatePayoutService.getAffiliatePayouts(affiliate.id),
          ]);
          setReferredClients(clientsData);
          setPayouts(payoutsData);
        } catch (error) {
          console.error("Error fetching affiliate details:", error);
          // Handle error display if needed
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, affiliate]);

  if (!affiliate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles del Afiliado: ${affiliate.name}`}
      size="xl"
      onConfirm={onClose} // Added onConfirm to satisfy ModalProps
      confirmText="Cerrar"  // Make the confirm button act as close
    >
      {isLoadingDetails ? (
        <div className="flex justify-center items-center h-40">
            <LoadingSpinnerIcon className="w-8 h-8 text-primary" />
            <p className="ml-2">Cargando detalles...</p>
        </div>
      ) : (
        <div className="space-y-6 text-sm max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <section>
            <h3 className="text-md font-semibold text-neutral-700 mb-2 border-b pb-1">Información General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <p><strong>Email:</strong> {affiliate.email}</p>
              <p><strong>Estado:</strong> <span className={`font-medium ${affiliate.status === 'active' ? 'text-green-600' : 'text-neutral-500'}`}>{affiliate.status}</span></p>
              <p><strong>Código Referido:</strong> {affiliate.referralCode}</p>
              <p><strong>Enlace Referido:</strong> <a href={affiliate.referralLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{affiliate.referralLink}</a></p>
              <p><strong>Fecha Registro:</strong> {new Date(affiliate.registrationDate).toLocaleDateString()}</p>
              <p><strong>Referidos Activos:</strong> {affiliate.totalActiveReferrals}</p>
              <p><strong>Comisión Acumulada:</strong> ${affiliate.commissionAccumulated.toFixed(2)}</p>
            </div>
            <div className="mt-2">
                <h4 className="text-xs font-semibold text-neutral-600">Detalles de Pago:</h4>
                <p className="text-xs text-neutral-500">PayPal: {affiliate.paymentDetails?.paypalEmail || 'N/A'}</p>
                <p className="text-xs text-neutral-500">Banco: {affiliate.paymentDetails?.bankInfo || 'N/A'}</p>
                <p className="text-xs text-neutral-500">Nequi/Daviplata: {affiliate.paymentDetails?.nequiDaviplata || 'N/A'}</p>
            </div>
          </section>

          <section>
            <h3 className="text-md font-semibold text-neutral-700 mb-2 border-b pb-1 flex items-center"><UserGroupIcon className="w-4 h-4 mr-1.5"/>Clientes Referidos ({referredClients.length})</h3>
            {referredClients.length > 0 ? (
              <div className="max-h-48 overflow-y-auto custom-scrollbar-thin border rounded-md">
                <table className="min-w-full text-xs">
                    <thead className="bg-neutral-50 sticky top-0"><tr>
                        <th className="p-1.5 text-left">Cliente</th><th className="p-1.5 text-left">Registro</th>
                        <th className="p-1.5 text-left">Estado</th><th className="p-1.5 text-left">Generado</th>
                    </tr></thead>
                    <tbody>
                    {referredClients.map(client => (
                        <tr key={client.id} className="border-b last:border-b-0 hover:bg-neutral-50/50">
                            <td className="p-1.5">{client.clientName}</td>
                            <td className="p-1.5">{new Date(client.registrationDate).toLocaleDateString()}</td>
                            <td className="p-1.5">{client.status}</td>
                            <td className="p-1.5">${client.amountGenerated.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-neutral-500">No hay clientes referidos por este afiliado.</p>}
          </section>

          <section>
            <h3 className="text-md font-semibold text-neutral-700 mb-2 border-b pb-1 flex items-center"><CurrencyDollarIcon className="w-4 h-4 mr-1.5"/>Historial de Pagos ({payouts.length})</h3>
             {payouts.length > 0 ? (
                <div className="max-h-48 overflow-y-auto custom-scrollbar-thin border rounded-md">
                 <table className="min-w-full text-xs">
                    <thead className="bg-neutral-50 sticky top-0"><tr>
                        <th className="p-1.5 text-left">Fecha</th><th className="p-1.5 text-left">Monto</th>
                        <th className="p-1.5 text-left">Método</th><th className="p-1.5 text-left">Estado</th>
                    </tr></thead>
                    <tbody>
                    {payouts.map(payout => (
                        <tr key={payout.id} className="border-b last:border-b-0 hover:bg-neutral-50/50">
                            <td className="p-1.5">{new Date(payout.payoutDate).toLocaleDateString()}</td>
                            <td className="p-1.5">${payout.amount.toFixed(2)}</td>
                            <td className="p-1.5">{payout.method}</td>
                            <td className="p-1.5">{payout.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            ) : <p className="text-xs text-neutral-500">No hay pagos registrados para este afiliado.</p>}
          </section>
          {/* Placeholder for Generate Manual Payout button */}
          <div className="mt-4 text-right">
            <button className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 shadow-sm">
              Generar Pago Manual (Próximamente)
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AffiliateDetailModal;