
import React, { useState, useEffect, useCallback } from 'react';
import { AdminAccount, AdminAccountStatus, AddAdminAccountData } from '../../types';
import * as adminAccountService from '../../services/adminAccountService';
import { LoadingSpinnerIcon, UserCircleIcon, PlusCircleIcon, PencilIcon, TrashIcon, CheckCircleIcon, MinusCircleIcon, ExclamationCircleIcon } from '../icons';
import { Modal } from '../Modal'; 

const AdminAccountManagementPage: React.FC = () => {
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For modal submission
  const [error, setError] = useState<string | null>(null); // For general page errors
  const [modalError, setModalError] = useState<string | null>(null); // For modal form errors
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AdminAccount | null>(null);

  const initialAccountFormState: AddAdminAccountData = {
    name: '',
    email: '',
    password: '',
    status: AdminAccountStatus.Inactive,
    planId: '',
  };
  const [currentAccountData, setCurrentAccountData] = useState<AddAdminAccountData>(initialAccountFormState);


  const fetchAdminAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await adminAccountService.getAdminAccounts();
      setAdminAccounts(accounts);
    } catch (err) {
      console.error("Error fetching admin accounts:", err);
      setError(err instanceof Error ? err.message : "Error al cargar cuentas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminAccounts();
  }, [fetchAdminAccounts]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setCurrentAccountData(initialAccountFormState);
    setModalError(null);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null); 
    setCurrentAccountData(initialAccountFormState);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: AdminAccount) => {
    setEditingAccount(account);
    setCurrentAccountData({ 
        name: account.name,
        email: account.email,
        status: account.status,
        planId: account.planId,
        password: '', // Clear password field for editing
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAccountData(prev => ({ ...prev, [name]: value as string | AdminAccountStatus }));
    if (modalError) setModalError(null);
  };
  
  const handleSaveAccount = async () => {
    if (!currentAccountData.name?.trim()) {
        setModalError("El Nombre Completo es obligatorio.");
        return;
    }
    if (!currentAccountData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentAccountData.email)) {
        setModalError("Por favor, ingresa un correo electrónico válido.");
        return;
    }
    // Password validation only for new accounts OR if password field is filled for existing
    if ((!editingAccount && (!currentAccountData.password || currentAccountData.password.length < 6)) ||
        (editingAccount && currentAccountData.password && currentAccountData.password.length < 6)) {
      if (!editingAccount || (editingAccount && currentAccountData.password)) { // Only error if pass is required (new) or provided (edit)
        setModalError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    }
    
    setModalError(null);
    setIsSubmitting(true);
    
    try {
      if (editingAccount) {
        const updatedData: AdminAccount = {
            ...editingAccount, 
            name: currentAccountData.name!,
            email: currentAccountData.email!,
            status: currentAccountData.status as AdminAccountStatus,
            planId: currentAccountData.planId || undefined,
        };
        // Password update for existing users is complex for mocks and usually a separate flow.
        // The service won't store it. If a new password was entered, it's not used here for mock persistence.
        await adminAccountService.updateAdminAccount(updatedData);
      } else {
        const newAccountData: AddAdminAccountData = {
            name: currentAccountData.name!,
            email: currentAccountData.email!,
            password: currentAccountData.password || undefined, // Will be required by validation if new
            status: currentAccountData.status as AdminAccountStatus,
            planId: currentAccountData.planId || undefined,
        };
        await adminAccountService.addAdminAccount(newAccountData);
      }
      fetchAdminAccounts();
      handleModalClose();
    } catch (err) {
      console.error("Error saving account:", err);
      setModalError(err instanceof Error ? err.message : "Error al guardar la cuenta.");
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleDeleteRequest = (account: AdminAccount) => {
    setAccountToDelete(account);
  };
  
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setIsSubmitting(true); 
    try {
      await adminAccountService.deleteAdminAccount(accountToDelete.id);
      fetchAdminAccounts(); 
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar cuenta."); 
    } finally {
      setIsSubmitting(false);
      setAccountToDelete(null);
    }
  };
  
  const handleToggleAccountStatus = async (account: AdminAccount) => {
    const newStatus = account.status === AdminAccountStatus.Active ? AdminAccountStatus.Inactive : AdminAccountStatus.Active;
    try {
      await adminAccountService.updateAdminAccount({ ...account, status: newStatus });
      fetchAdminAccounts(); 
    } catch (err) {
      console.error("Error toggling account status:", err);
      setError(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  };

  const getStatusBadge = (status: AdminAccountStatus) => {
    switch (status) {
      case AdminAccountStatus.Active:
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200"><CheckCircleIcon className="w-3.5 h-3.5 mr-1.5 inline"/>Activo</span>;
      case AdminAccountStatus.Inactive:
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"><MinusCircleIcon className="w-3.5 h-3.5 mr-1.5 inline"/>Inactivo</span>;
      case AdminAccountStatus.Suspended:
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700 border border-red-200"><ExclamationCircleIcon className="w-3.5 h-3.5 mr-1.5 inline"/>Suspendido</span>;
      default:
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">Desconocido</span>;
    }
  };

  if (isLoading && !isModalOpen && !accountToDelete) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinnerIcon className="w-12 h-12 text-primary" />
        <p className="ml-3 text-neutral-600">Cargando cuentas de administrador...</p>
      </div>
    );
  }

  if (error && !isModalOpen) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Gestión de Cuentas de Administrador</h1>
            <p className="mt-1 text-sm text-neutral-600">
            Crea, edita y gestiona las cuentas de los administradores del sistema.
            </p>
        </div>
        <button
            onClick={handleCreateAccount}
            className="flex items-center self-start sm:self-center px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
            <PlusCircleIcon className="w-5 h-5 mr-2"/>
            Crear Nueva Cuenta
        </button>
      </header>
      
      {adminAccounts.length === 0 && !isLoading ? (
        <div className="text-center py-12 bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
          <UserCircleIcon className="w-20 h-20 text-neutral-300 mx-auto mb-5" />
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">Sin Cuentas de Administrador</h3>
          <p className="text-neutral-500 text-sm">Aún no se han creado cuentas. ¡Empieza añadiendo una!</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl border border-neutral-200 overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Plan ID</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Creado</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {adminAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-neutral-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{account.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{account.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(account.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{account.planId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(account.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1.5">
                    <button 
                        onClick={() => handleToggleAccountStatus(account)} 
                        className="p-1.5 text-neutral-500 hover:text-primary rounded-md hover:bg-primary/10 transition-colors" 
                        title={account.status === AdminAccountStatus.Active ? 'Marcar como Inactivo' : 'Marcar como Activo'}
                    >
                        {account.status === AdminAccountStatus.Active ? <MinusCircleIcon className="w-4 h-4"/> : <CheckCircleIcon className="w-4 h-4"/>}
                    </button>
                    <button onClick={() => handleEditAccount(account)} className="p-1.5 text-neutral-500 hover:text-yellow-600 rounded-md hover:bg-yellow-500/10 transition-colors" title="Editar Cuenta">
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDeleteRequest(account)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-md hover:bg-red-500/10 transition-colors" title="Eliminar Cuenta">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingAccount ? `Editar Cuenta: ${editingAccount.name}` : 'Crear Nueva Cuenta de Administrador'}
        onConfirm={handleSaveAccount}
        confirmText={editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
        isLoading={isSubmitting}
        size="lg"
    >
        <form className="space-y-5">
            {modalError && 
              <div role="alert" className="text-red-700 bg-red-100 border border-red-300 p-3 rounded-md text-sm">
                {modalError}
              </div>
            }
            <div>
                <label htmlFor="accountNameModal" className="block text-sm font-medium text-neutral-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  id="accountNameModal" 
                  value={currentAccountData.name} 
                  onChange={handleFormInputChange} 
                  className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400" 
                  required 
                  autoFocus={!editingAccount} 
                />
            </div>
            <div>
                <label htmlFor="accountEmailModal" className="block text-sm font-medium text-neutral-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  id="accountEmailModal" 
                  value={currentAccountData.email} 
                  onChange={handleFormInputChange} 
                  className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400" 
                  required 
                />
            </div>
            <div>
                <label htmlFor="accountPasswordModal" className="block text-sm font-medium text-neutral-700 mb-1">
                  {editingAccount ? 'Nueva Contraseña (Opcional)' : 'Contraseña (Mín. 6 caracteres)'}
                  {!editingAccount && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="accountPasswordModal" 
                  value={currentAccountData.password} 
                  onChange={handleFormInputChange} 
                  className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400" 
                  placeholder={editingAccount ? "Dejar en blanco para no cambiar" : "••••••••"}
                />
                {editingAccount && <p className="mt-1 text-xs text-neutral-500">Dejar en blanco para mantener la contraseña actual.</p>}
            </div>
            <div>
                <label htmlFor="accountStatusModal" className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
                <select 
                  name="status" 
                  id="accountStatusModal" 
                  value={currentAccountData.status} 
                  onChange={handleFormInputChange} 
                  className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
                >
                    {Object.values(AdminAccountStatus).map(statusVal => (
                        <option key={statusVal} value={statusVal}>{statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="accountPlanIdModal" className="block text-sm font-medium text-neutral-700 mb-1">ID del Plan de Suscripción (Opcional)</label>
                <input 
                  type="text" 
                  name="planId" 
                  id="accountPlanIdModal" 
                  value={currentAccountData.planId || ''} 
                  onChange={handleFormInputChange} 
                  className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400" 
                  placeholder="Ej: pro-plan-001" 
                />
            </div>
        </form>
    </Modal>

    {accountToDelete && (
        <Modal
            isOpen={!!accountToDelete}
            onClose={() => setAccountToDelete(null)}
            title="Confirmar Eliminación de Cuenta"
            onConfirm={confirmDeleteAccount}
            confirmText="Eliminar Cuenta"
            cancelText="Cancelar"
            confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            isLoading={isSubmitting}
        >
            <p className="text-sm text-neutral-600">
                ¿Estás seguro de que quieres eliminar la cuenta de administrador de 
                <strong className="font-semibold text-neutral-800"> "{accountToDelete.name} ({accountToDelete.email})"</strong>?
            </p>
            <p className="mt-2 text-xs text-neutral-500">
                Esta acción no se puede deshacer y eliminará permanentemente la cuenta.
            </p>
        </Modal>
    )}
    </div>
  );
};

export default AdminAccountManagementPage;