import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { Affiliate, AffiliateStatus, AddAffiliateData, UpdateAffiliateData, AffiliatePaymentDetails } from '../../../types';

interface AffiliateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddAffiliateData | UpdateAffiliateData) => Promise<void>;
  existingAffiliate: Affiliate | null;
  isSubmitting: boolean;
}

const AffiliateFormModal: React.FC<AffiliateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAffiliate,
  isSubmitting,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<AffiliateStatus>(AffiliateStatus.Inactive);
  const [paymentDetails, setPaymentDetails] = useState<AffiliatePaymentDetails>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (existingAffiliate) {
      setName(existingAffiliate.name);
      setEmail(existingAffiliate.email);
      setStatus(existingAffiliate.status);
      setPaymentDetails(existingAffiliate.paymentDetails || {});
    } else {
      setName('');
      setEmail('');
      setStatus(AffiliateStatus.Inactive);
      setPaymentDetails({});
    }
    setFormError(null);
  }, [existingAffiliate, isOpen]);

  const handlePaymentDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }
    setFormError(null);
    
    const formData: AddAffiliateData | UpdateAffiliateData = {
      name,
      email,
      status,
      paymentDetails,
    };
    await onSave(formData);
    // onClose will be called by parent if save is successful
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingAffiliate ? 'Editar Afiliado' : 'Crear Nuevo Afiliado'}
      onConfirm={handleSubmit}
      confirmText={existingAffiliate ? 'Guardar Cambios' : 'Crear Afiliado'}
      isLoading={isSubmitting}
      size="lg"
    >
      <form className="space-y-4">
        {formError && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm border border-red-200">
            {formError}
          </div>
        )}
        <div>
          <label htmlFor="affiliateName" className="block text-sm font-medium text-neutral-700">Nombre Completo <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="affiliateName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="affiliateEmail" className="block text-sm font-medium text-neutral-700">Correo Electrónico <span className="text-red-500">*</span></label>
          <input
            type="email"
            id="affiliateEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="affiliateStatus" className="block text-sm font-medium text-neutral-700">Estado</label>
          <select
            id="affiliateStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as AffiliateStatus)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value={AffiliateStatus.Active}>Activo</option>
            <option value={AffiliateStatus.Inactive}>Inactivo</option>
          </select>
        </div>
        
        <fieldset className="border border-neutral-200 p-3 rounded-md">
            <legend className="text-sm font-medium text-neutral-700 px-1">Detalles de Pago (Opcional)</legend>
            <div className="space-y-3 mt-2">
                <div>
                    <label htmlFor="paypalEmail" className="block text-xs font-medium text-neutral-600">Email de PayPal</label>
                    <input type="email" name="paypalEmail" id="paypalEmail" value={paymentDetails.paypalEmail || ''} onChange={handlePaymentDetailChange} className="mt-0.5 block w-full px-2.5 py-1.5 border border-neutral-300 rounded-md shadow-sm sm:text-xs placeholder-neutral-400" placeholder="paypal@ejemplo.com"/>
                </div>
                 <div>
                    <label htmlFor="bankInfo" className="block text-xs font-medium text-neutral-600">Información Bancaria (Transferencia)</label>
                    <input type="text" name="bankInfo" id="bankInfo" value={paymentDetails.bankInfo || ''} onChange={handlePaymentDetailChange} className="mt-0.5 block w-full px-2.5 py-1.5 border border-neutral-300 rounded-md shadow-sm sm:text-xs placeholder-neutral-400" placeholder="Ej: Nombre Banco, #Cuenta, Tipo"/>
                </div>
                 <div>
                    <label htmlFor="nequiDaviplata" className="block text-xs font-medium text-neutral-600">Nequi / Daviplata (Número)</label>
                    <input type="tel" name="nequiDaviplata" id="nequiDaviplata" value={paymentDetails.nequiDaviplata || ''} onChange={handlePaymentDetailChange} className="mt-0.5 block w-full px-2.5 py-1.5 border border-neutral-300 rounded-md shadow-sm sm:text-xs placeholder-neutral-400" placeholder="Ej: 3001234567"/>
                </div>
            </div>
        </fieldset>

        {existingAffiliate && (
            <div className="text-xs text-neutral-500 pt-2">
                <p><strong>Código de Referido:</strong> {existingAffiliate.referralCode}</p>
                <p><strong>Enlace de Referido:</strong> <a href={existingAffiliate.referralLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{existingAffiliate.referralLink}</a></p>
            </div>
        )}
      </form>
    </Modal>
  );
};

export default AffiliateFormModal;
