import React, { useState, useEffect, useCallback } from 'react';
import { AIProviderConfig } from '../../types';
import * as aiProviderConfigService from '../../services/aiProviderConfigService';
import { LoadingSpinnerIcon, CogIcon, PlusCircleIcon, PencilIcon, TrashIcon, CheckCircleIcon, SparklesIcon, XCircleIcon } from '../icons';
import { Modal } from '../Modal';

const AIGeneratorConfigPage: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<AIProviderConfig | null>(null);

  const initialFormState: Partial<AIProviderConfig> = {
    providerName: '',
    apiKey: '',
    endpointUrl: '',
    status: 'inactive',
    isDefault: false,
    // monthlyLimit, dailyLimit, perUserLimit can be added later
  };
  const [currentProviderData, setCurrentProviderData] = useState<Partial<AIProviderConfig>>(initialFormState);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProviders = await aiProviderConfigService.getAIProviders();
      setProviders(fetchedProviders);
    } catch (err) {
      console.error("Error fetching AI providers:", err);
      setError(err instanceof Error ? err.message : "Error al cargar proveedores de IA.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const openCreateModal = () => {
    setEditingProvider(null);
    setCurrentProviderData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (provider: AIProviderConfig) => {
    setEditingProvider(provider);
    setCurrentProviderData({ ...provider });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
    setCurrentProviderData(initialFormState);
    setError(null);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setCurrentProviderData(prev => ({ ...prev, [name]: checked }));
    } else {
      setCurrentProviderData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProvider = async () => {
    if (!currentProviderData.providerName?.trim() || !currentProviderData.apiKey?.trim()) {
      setError("El nombre del proveedor y la API Key son obligatorios.");
      return;
    }
    setError(null);
    setIsLoading(true); // Indicate loading for save operation

    const providerToSave: AIProviderConfig = {
      id: editingProvider?.id || '', // Will be ignored if new
      providerName: currentProviderData.providerName!,
      apiKey: currentProviderData.apiKey!,
      endpointUrl: currentProviderData.endpointUrl || undefined,
      status: currentProviderData.status || 'inactive',
      isDefault: currentProviderData.isDefault || false,
      // Default other fields for now
      monthlyLimit: currentProviderData.monthlyLimit,
      dailyLimit: currentProviderData.dailyLimit,
      perUserLimit: currentProviderData.perUserLimit,
      avgResponseTimeMs: currentProviderData.avgResponseTimeMs,
      successRatePercent: currentProviderData.successRatePercent,
    };

    try {
      if (editingProvider) {
        await aiProviderConfigService.updateAIProvider({ ...providerToSave, id: editingProvider.id });
      } else {
        await aiProviderConfigService.addAIProvider(providerToSave);
      }
      fetchProviders();
      handleModalClose();
    } catch (err) {
      console.error("Error saving AI provider:", err);
      setError(err instanceof Error ? err.message : "Error al guardar el proveedor.");
    } finally {
      setIsLoading(false); // Stop loading indicator for save
    }
  };
  
  const handleDeleteRequest = (provider: AIProviderConfig) => {
    setProviderToDelete(provider);
  };

  const confirmDeleteProvider = async () => {
    if (!providerToDelete) return;
    setIsLoading(true);
    try {
      await aiProviderConfigService.deleteAIProvider(providerToDelete.id);
      fetchProviders();
    } catch (err) {
      console.error("Error deleting provider:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar proveedor.");
    } finally {
      setIsLoading(false);
      setProviderToDelete(null);
    }
  };


  if (isLoading && !isModalOpen && !providerToDelete) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinnerIcon className="w-12 h-12 text-primary" />
        <p className="ml-3 text-neutral-600">Cargando configuración de IA...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <header className="pb-6 border-b border-neutral-200 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Configuración del Generador AI</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Gestiona las APIs de IA, establece límites y visualiza métricas de rendimiento.
          </p>
        </div>
        <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
            <PlusCircleIcon className="w-5 h-5 mr-2"/>
            Agregar Proveedor
        </button>
      </header>

      {error && !isModalOpen && <div className="text-red-600 bg-red-50 p-4 rounded-md">Error: {error}</div>}

      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Proveedores de IA Conectados</h2>
        {providers.length === 0 && !isLoading ? (
            <div className="text-center py-10">
                <CogIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No hay proveedores de IA configurados.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Predeterminado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Endpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                {providers.map(provider => (
                    <tr key={provider.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">{provider.providerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        provider.status === 'active' ? 'bg-green-100 text-green-800' : 
                        provider.status === 'inactive' ? 'bg-neutral-200 text-neutral-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {provider.isDefault ? 
                            <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 
                            <XCircleIcon className="w-5 h-5 text-neutral-300" />
                        }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 truncate max-w-xs" title={provider.endpointUrl}>
                        {provider.endpointUrl || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => openEditModal(provider)} className="p-1.5 text-blue-600 hover:text-blue-700 rounded-md hover:bg-blue-500/10" title="Editar Proveedor">
                            <PencilIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDeleteRequest(provider)} className="p-1.5 text-red-600 hover:text-red-700 rounded-md hover:bg-red-500/10" title="Eliminar Proveedor">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>
      
      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Métricas Globales y Configuración Avanzada</h2>
         <div className="text-center py-10">
            <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">
                Opciones para rotación automática de IA, asignación de IA por cuenta de administrador,
                y métricas comparativas detalladas se mostrarán aquí.
                <br/>(Funcionalidad pendiente de implementación)
            </p>
        </div>
      </div>

    {/* Modal for Creating/Editing AI Provider */}
    <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingProvider ? 'Editar Proveedor de IA' : 'Agregar Nuevo Proveedor de IA'}
        onConfirm={handleSaveProvider}
        confirmText={editingProvider ? 'Guardar Cambios' : 'Agregar Proveedor'}
        isLoading={isLoading && isModalOpen}
    >
        <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {error && isModalOpen && <div className="text-red-500 bg-red-50 p-3 rounded-md text-xs">{error}</div>}
            <div>
                <label htmlFor="providerName" className="block text-sm font-medium text-neutral-700">Nombre del Proveedor <span className="text-red-500">*</span></label>
                <input type="text" name="providerName" id="providerName" value={currentProviderData.providerName || ''} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700">API Key <span className="text-red-500">*</span></label>
                <input type="password" name="apiKey" id="apiKey" value={currentProviderData.apiKey || ''} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" placeholder="************" required />
            </div>
            <div>
                <label htmlFor="endpointUrl" className="block text-sm font-medium text-neutral-700">Endpoint URL (Opcional)</label>
                <input type="url" name="endpointUrl" id="endpointUrl" value={currentProviderData.endpointUrl || ''} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm" placeholder="https://api.example.com/v1/generate" />
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-neutral-700">Estado</label>
                <select name="status" id="status" value={currentProviderData.status || 'inactive'} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm sm:text-sm bg-white">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="error">Error</option>
                </select>
            </div>
            <div className="flex items-center space-x-3">
                <input 
                    type="checkbox" 
                    name="isDefault" 
                    id="isDefaultProvider" 
                    checked={currentProviderData.isDefault || false} 
                    onChange={handleFormInputChange} 
                    className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary" 
                />
                <label htmlFor="isDefaultProvider" className="text-sm font-medium text-neutral-700">Establecer como Proveedor Predeterminado</label>
            </div>
             <p className="text-xs text-neutral-500">
                Nota: Los campos como límites de consumo, latencia promedio y tasa de éxito se registrarán y mostrarán automáticamente por el sistema en el futuro.
            </p>
        </form>
    </Modal>

    {/* Confirmation Modal for Deleting Provider */}
    {providerToDelete && (
    <Modal
        isOpen={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        title="Confirmar Eliminación de Proveedor"
        onConfirm={confirmDeleteProvider}
        confirmText="Eliminar Proveedor"
        isLoading={isLoading && !!providerToDelete}
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
    >
        <p>
            ¿Estás seguro de que quieres eliminar el proveedor de IA 
            <strong className="font-semibold"> "{providerToDelete.providerName}"</strong>?
        </p>
        <p className="mt-2 text-xs text-neutral-500">
            Esta acción no se puede deshacer.
        </p>
    </Modal>
    )}

    </div>
  );
};

export default AIGeneratorConfigPage;