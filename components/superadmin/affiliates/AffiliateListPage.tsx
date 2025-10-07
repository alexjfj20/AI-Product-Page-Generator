import React, { useState, useEffect, useCallback } from 'react';
import { Affiliate, AffiliateStatus, AddAffiliateData, UpdateAffiliateData } from '../../../types';
import * as affiliateService from '../../../services/affiliateService';
import { LoadingSpinnerIcon, UserPlusIcon, PencilIcon, TrashIcon, LinkIcon, CheckCircleIcon, MinusCircleIcon, CurrencyDollarIcon, UserGroupIcon } from '../../icons';
import { Modal } from '../../Modal'; // Assuming Modal component exists
import AffiliateFormModal from './AffiliateFormModal'; // To be created
import AffiliateDetailModal from './AffiliateDetailModal'; // To be created


const AffiliateListPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliateForDetail, setSelectedAffiliateForDetail] = useState<Affiliate | null>(null);
  const [affiliateToDelete, setAffiliateToDelete] = useState<Affiliate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await affiliateService.getAffiliates();
      setAffiliates(data.sort((a,b) => b.registrationDate - a.registrationDate));
    } catch (err) {
      console.error("Error fetching affiliates:", err);
      setError(err instanceof Error ? err.message : "Error al cargar afiliados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const handleCreateAffiliate = () => {
    setEditingAffiliate(null);
    setIsFormModalOpen(true);
  };

  const handleEditAffiliate = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setIsFormModalOpen(true);
  };

  const handleViewAffiliateDetails = (affiliate: Affiliate) => {
    setSelectedAffiliateForDetail(affiliate);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingAffiliate(null);
  };
  
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAffiliateForDetail(null);
  };

  const handleSaveAffiliate = async (formData: AddAffiliateData | UpdateAffiliateData) => {
    setIsSubmitting(true);
    try {
      if (editingAffiliate) {
        await affiliateService.updateAffiliate(editingAffiliate.id, formData as UpdateAffiliateData);
      } else {
        await affiliateService.addAffiliate(formData as AddAffiliateData);
      }
      fetchAffiliates();
      handleCloseFormModal();
    } catch (err) {
      console.error("Error saving affiliate:", err);
      // Potentially set a modal-specific error here
      alert(err instanceof Error ? err.message : "Error al guardar afiliado.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteRequest = (affiliate: Affiliate) => {
    setAffiliateToDelete(affiliate);
  };

  const confirmDeleteAffiliate = async () => {
    if (!affiliateToDelete) return;
    setIsSubmitting(true);
    try {
      await affiliateService.deleteAffiliate(affiliateToDelete.id);
      fetchAffiliates();
    } catch (err) {
      console.error("Error deleting affiliate:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar afiliado.");
    } finally {
      setIsSubmitting(false);
      setAffiliateToDelete(null);
    }
  };
  
  const toggleAffiliateStatus = async (affiliate: Affiliate) => {
    const newStatus = affiliate.status === AffiliateStatus.Active ? AffiliateStatus.Inactive : AffiliateStatus.Active;
    try {
        await affiliateService.updateAffiliateStatus(affiliate.id, newStatus);
        fetchAffiliates();
    } catch (err) {
        console.error("Error toggling affiliate status:", err);
        setError(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  };

  const getStatusBadge = (status: AffiliateStatus) => {
    return status === AffiliateStatus.Active 
      ? <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1 inline"/>Activo</span>
      : <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"><MinusCircleIcon className="w-3 h-3 mr-1 inline"/>Inactivo</span>;
  };


  if (isLoading && !isFormModalOpen && !isDetailModalOpen && !affiliateToDelete) {
    return <div className="flex justify-center items-center h-40"><LoadingSpinnerIcon className="w-8 h-8 text-primary" /> <p className="ml-2">Cargando afiliados...</p></div>;
  }

  if (error) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-700">Listado de Afiliados ({affiliates.length})</h2>
        <button
          onClick={handleCreateAffiliate}
          className="flex items-center px-3 py-2 bg-primary text-white text-xs font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
        >
          <UserPlusIcon className="w-4 h-4 mr-1.5"/>
          Nuevo Afiliado
        </button>
      </div>

      {affiliates.length === 0 ? (
        <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
          <UserGroupIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No hay afiliados registrados todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar shadow border-b border-neutral-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email / Código</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Referidos / Comisión</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Registro</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {affiliates.map((aff) => (
                <tr key={aff.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-800">{aff.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-neutral-600">{aff.email}</div>
                    <div className="text-xs text-primary mt-0.5 flex items-center">
                      <LinkIcon className="w-3 h-3 mr-1"/> {aff.referralCode}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">{getStatusBadge(aff.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                     <div className="text-xs text-neutral-600">Activos: {aff.totalActiveReferrals}</div>
                     <div className="text-xs text-green-600 font-medium">${aff.commissionAccumulated.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
                    {new Date(aff.registrationDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                    <button onClick={() => handleViewAffiliateDetails(aff)} className="p-1 text-neutral-500 hover:text-indigo-600 rounded-md hover:bg-indigo-500/10" title="Ver Detalles">
                        <UserGroupIcon className="w-4 h-4"/>
                    </button>
                     <button onClick={() => toggleAffiliateStatus(aff)} className={`p-1 rounded-md ${aff.status === AffiliateStatus.Active ? 'text-yellow-600 hover:bg-yellow-500/10' : 'text-green-600 hover:bg-green-500/10'}`} title={aff.status === AffiliateStatus.Active ? 'Desactivar' : 'Activar'}>
                        {aff.status === AffiliateStatus.Active ? <MinusCircleIcon className="w-4 h-4"/> : <CheckCircleIcon className="w-4 h-4"/>}
                    </button>
                    <button onClick={() => handleEditAffiliate(aff)} className="p-1 text-blue-600 hover:text-blue-700 rounded-md hover:bg-blue-500/10" title="Editar">
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDeleteRequest(aff)} className="p-1 text-red-600 hover:text-red-700 rounded-md hover:bg-red-500/10" title="Eliminar">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormModalOpen && (
        <AffiliateFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSave={handleSaveAffiliate}
          existingAffiliate={editingAffiliate}
          isSubmitting={isSubmitting}
        />
      )}
      
      {isDetailModalOpen && selectedAffiliateForDetail && (
        <AffiliateDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
            affiliate={selectedAffiliateForDetail}
        />
      )}

      {affiliateToDelete && (
        <Modal
          isOpen={!!affiliateToDelete}
          onClose={() => setAffiliateToDelete(null)}
          title="Confirmar Eliminación de Afiliado"
          onConfirm={confirmDeleteAffiliate}
          confirmText="Eliminar Afiliado"
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          isLoading={isSubmitting}
        >
          <p className="text-sm text-neutral-600">
            ¿Estás seguro de que quieres eliminar al afiliado 
            <strong className="font-semibold text-neutral-800"> "{affiliateToDelete.name}"</strong>?
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AffiliateListPage;
