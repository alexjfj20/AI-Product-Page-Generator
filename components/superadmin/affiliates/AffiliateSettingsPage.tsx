import React, { useState, useEffect, useCallback } from 'react';
import { AffiliateSettings, PaymentMethod } from '../../../types';
import * as affiliateSettingsService from '../../../services/affiliateSettingsService';
import { LoadingSpinnerIcon, CheckCircleIcon, XCircleIcon, CogIcon } from '../../icons';

const paymentMethodOptions: { key: PaymentMethod, label: string }[] = [
    { key: 'paypal', label: 'PayPal' },
    { key: 'bank_transfer', label: 'Transferencia Bancaria' },
    { key: 'nequi_daviplata', label: 'Nequi / Daviplata (Colombia)' },
];

const AffiliateSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<AffiliateSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentSettings = await affiliateSettingsService.getAffiliateSettings();
            setSettings(currentSettings);
        } catch (err) {
            setError("Error al cargar la configuración de afiliados.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value, type, checked } = e.target;
        const [group, key] = name.split('.'); // For nested commissionRule

        if (group === 'commissionRule') {
            setSettings(prev => ({
                ...prev!,
                commissionRule: {
                    ...prev!.commissionRule,
                    [key]: type === 'number' ? parseFloat(value) || 0 : value,
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev!,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
        if (successMessage) setSuccessMessage(null);
        if (error) setError(null);
    };
    
    const handleCommissionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!settings) return;
        setSettings(prev => ({
            ...prev!,
            commissionRule: {
                ...prev!.commissionRule,
                commissionType: e.target.value as 'one_time' | 'recurring',
            }
        }));
    };

    const handlePaymentMethodToggle = (methodKey: PaymentMethod) => {
        if (!settings) return;
        const updatedMethods = settings.availablePaymentMethods.includes(methodKey)
            ? settings.availablePaymentMethods.filter(m => m !== methodKey)
            : [...settings.availablePaymentMethods, methodKey];
        setSettings(prev => ({ ...prev!, availablePaymentMethods: updatedMethods }));
    };

    const handleSaveChanges = async () => {
        if (!settings) return;
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await affiliateSettingsService.saveAffiliateSettings(settings);
            setSuccessMessage("Configuración guardada exitosamente.");
        } catch (err) {
            setError("Error al guardar la configuración.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><LoadingSpinnerIcon className="w-8 h-8 text-primary" /> <p className="ml-2">Cargando configuración...</p></div>;
    }

    if (!settings) {
        return <div className="text-red-600 bg-red-50 p-4 rounded-md">No se pudo cargar la configuración de afiliados.</div>;
    }


  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-neutral-700">Configuración General del Programa de Afiliados</h2>
        
        {error && <div role="alert" className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center"><XCircleIcon className="w-5 h-5 mr-2"/>{error}</div>}
        {successMessage && <div role="status" className="text-green-700 bg-green-50 p-3 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2"/>{successMessage}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50/30">
            <div>
                <label htmlFor="commissionRatePercent" className="block text-sm font-medium text-neutral-700">Porcentaje de Comisión (%)</label>
                <input 
                    type="number" 
                    name="commissionRule.commissionRatePercent" 
                    id="commissionRatePercent"
                    value={settings.commissionRule.commissionRatePercent}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" 
                />
            </div>
            <div>
                <label htmlFor="commissionType" className="block text-sm font-medium text-neutral-700">Tipo de Comisión</label>
                <select 
                    name="commissionRule.commissionType"
                    id="commissionType"
                    value={settings.commissionRule.commissionType}
                    onChange={handleCommissionTypeChange}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm sm:text-sm"
                >
                    <option value="one_time">Única Vez</option>
                    <option value="recurring">Recurrente</option>
                </select>
            </div>
            <div>
                <label htmlFor="minimumPayoutAmount" className="block text-sm font-medium text-neutral-700">Monto Mínimo de Pago (USD)</label>
                 <input 
                    type="number" 
                    name="commissionRule.minimumPayoutAmount" 
                    id="minimumPayoutAmount"
                    value={settings.commissionRule.minimumPayoutAmount}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" 
                />
            </div>
            <div>
                <label htmlFor="retentionPeriodDays" className="block text-sm font-medium text-neutral-700">Período de Retención (días)</label>
                 <input 
                    type="number" 
                    name="commissionRule.retentionPeriodDays" 
                    id="retentionPeriodDays"
                    value={settings.commissionRule.retentionPeriodDays}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" 
                />
            </div>
        </div>
        
        <div>
            <h3 className="text-md font-semibold text-neutral-700 mb-2">Métodos de Pago Disponibles</h3>
            <div className="space-y-2">
                {paymentMethodOptions.map(pm => (
                    <label key={pm.key} className="flex items-center p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={settings.availablePaymentMethods.includes(pm.key)}
                            onChange={() => handlePaymentMethodToggle(pm.key)}
                            className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary mr-2"
                        />
                        <span className="text-sm text-neutral-700">{pm.label}</span>
                    </label>
                ))}
            </div>
        </div>
        
        <div>
            <label htmlFor="termsAndConditionsUrl" className="block text-sm font-medium text-neutral-700">URL de Términos y Condiciones de Afiliados</label>
            <input 
                type="url" 
                name="termsAndConditionsUrl" 
                id="termsAndConditionsUrl"
                value={settings.termsAndConditionsUrl || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" 
                placeholder="Ej: /terminos-afiliados"
            />
        </div>

        <div className="pt-4 text-right">
            <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center justify-center px-5 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
            >
                {isSaving ? <LoadingSpinnerIcon className="w-5 h-5 mr-2" /> : <CogIcon className="w-5 h-5 mr-2" />}
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
    </div>
  );
};

export default AffiliateSettingsPage;
