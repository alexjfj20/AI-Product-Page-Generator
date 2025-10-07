import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { Affiliate, AffiliatePayout, PaymentMethod, PayoutStatus } from '../../../types';
import * as affiliatePayoutService from '../../../services/affiliatePayoutService';
import * as affiliateService from '../../../services/affiliateService'; // To update affiliate's commission

interface ManualPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliate: Affiliate | null;
  availablePaymentMethods: PaymentMethod[]; // Pass from settings
  onPayoutSuccess: () => void; // Callback to refresh data
}

const ManualPayoutModal: React.FC<ManualPayoutModalProps> = ({
  isOpen,
  onClose,
  affiliate,
  availablePaymentMethods,
  onPayoutSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && affiliate) {
      // Pre-fill amount if there's accumulated commission, up to that amount
      setAmount(affiliate.commissionAccumulated > 0 ? affiliate.commissionAccumulated.toFixed(2) : '');
      // Select first available method or affiliate's preferred if set and available
      const preferredPaypal = affiliate.paymentDetails?.paypalEmail && availablePaymentMethods.includes('paypal');
      const preferredBank = affiliate.paymentDetails?.bankInfo && availablePaymentMethods.includes('bank_transfer');
      const preferredNequi = affiliate.paymentDetails?.nequiDaviplata && availablePaymentMethods.includes('nequi_daviplata');

      if (preferredPaypal) setSelectedMethod('paypal');
      else if (preferredBank) setSelectedMethod('bank_transfer');
      else if (preferredNequi) setSelectedMethod('nequi_daviplata');
      else if (availablePaymentMethods.length > 0) setSelectedMethod(availablePaymentMethods[0]);
      else setSelectedMethod('');
      
      setNotes('');
    }
    setFormError(null);
  }, [isOpen, affiliate, availablePaymentMethods]);

  const handleSubmit = async () => {
    if (!affiliate) return;
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      setFormError('El monto del pago debe ser un número positivo.');
      return;
    }
    if (!selectedMethod) {
      setFormError('Debes seleccionar un método de pago.');
      return;
    }
    // Optional: Check if payoutAmount exceeds commissionAccumulated
    // if (payoutAmount > affiliate.commissionAccumulated) {
    //   setFormError('El monto del pago no puede exceder la comisión acumulada.');
    //   return;
    // }

    setFormError(null);
    setIsSubmitting(true);

    const payoutData: Omit<AffiliatePayout, 'id' | 'payoutDate'> = {
      affiliateId: affiliate.id,
      amount: payoutAmount,
      method: selectedMethod,
      status: PayoutStatus.Pending, // Or Paid if processed immediately and manually
      notes: notes.trim() || undefined,
      // transactionId could be added later if payment is confirmed
    };

    try {
      await affiliatePayoutService.addAffiliatePayout(payoutData);
      // Deduct from affiliate's accumulated commission
      const newCommission = Math.max(0, affiliate.commissionAccumulated - payoutAmount);
      await affiliateService.updateAffiliate(affiliate.id, { commissionAccumulated: newCommission });
      
      onPayoutSuccess(); // Refresh lists in parent
      onClose(); // Close modal
    } catch (err) {
      console.error("Error processing manual payout:", err);
      setFormError(err instanceof Error ? err.message : "Error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!affiliate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generar Pago Manual para ${affiliate.name}`}
      onConfirm={handleSubmit}
      confirmText="Registrar Pago"
      isLoading={isSubmitting}
    >
      <form className="space-y-4">
        {formError && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm border border-red-200">
            {formError}
          </div>
        )}
        <div>
            <p className="text-sm text-neutral-600">Comisión Acumulada: <strong className="text-green-600">${affiliate.commissionAccumulated.toFixed(2)}</strong></p>
        </div>
        <div>
          <label htmlFor="payoutAmount" className="block text-sm font-medium text-neutral-700">Monto a Pagar (USD) <span className="text-red-500">*</span></label>
          <input
            type="number"
            id="payoutAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-neutral-700">Método de Pago <span className="text-red-500">*</span></label>
          <select
            id="paymentMethod"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            required
          >
            <option value="" disabled>Selecciona un método...</option>
            {availablePaymentMethods.map(method => (
              <option key={method} value={method}>
                {method === 'paypal' ? 'PayPal' : method === 'bank_transfer' ? 'Transferencia Bancaria' : method === 'nequi_daviplata' ? 'Nequi/Daviplata' : 'Manual'}
              </option>
            ))}
            {!availablePaymentMethods.includes('manual') && <option value="manual">Manual (Otro)</option>}
          </select>
        </div>
        <div>
          <label htmlFor="payoutNotes" className="block text-sm font-medium text-neutral-700">Notas (Opcional)</label>
          <textarea
            id="payoutNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ej: ID de transacción, referencia, etc."
          />
        </div>
      </form>
    </Modal>
  );
};

export default ManualPayoutModal;
