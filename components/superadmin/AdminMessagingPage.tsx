
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminMessage, SendMessageData, AdminMessageCategory } from '../../types';
import * as adminMessagingService from '../../services/adminMessagingService';
import { ChatBubbleLeftEllipsisIcon, LoadingSpinnerIcon, CheckCircleIcon, TrashIcon, XCircleIcon, SparklesIcon } from '../icons';
import { Modal } from '../Modal'; // Import Modal

interface ComponentFormData {
  recipients: string; // Comma-separated string from input
  subject: string;
  body: string;
  category: AdminMessageCategory;
}

const AdminMessagingPage: React.FC = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [formData, setFormData] = useState<ComponentFormData>({
    recipients: '',
    subject: '',
    body: '',
    category: 'info' as AdminMessageCategory,
  });
  const [isLoading, setIsLoading] = useState(false); // For sending message
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false); // For deleting message
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [messageToDelete, setMessageToDelete] = useState<AdminMessage | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    console.log("AdminMessagingPage: fetchMessages initiated.");
    if (!mountedRef.current) {
        console.log("AdminMessagingPage: fetchMessages aborted, component unmounted.");
        return;
    }
    setIsFetchingMessages(true);
    try {
      const sentMessages = await adminMessagingService.getSentMessages();
      if (mountedRef.current) {
        setMessages(sentMessages);
        console.log("AdminMessagingPage: fetchMessages successful, messages set.");
      } else {
        console.log("AdminMessagingPage: fetchMessages - component unmounted before setting messages.");
      }
    } catch (err) {
      console.error("AdminMessagingPage: fetchMessages - error:", err);
      if (mountedRef.current) {
        setError("Error al cargar mensajes enviados.");
      }
    } finally {
      if (mountedRef.current) {
        setIsFetchingMessages(false);
        console.log("AdminMessagingPage: fetchMessages finished.");
      }
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as string | AdminMessageCategory }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("AdminMessagingPage: handleSubmit initiated.", formData);

    if (!formData.subject.trim() || !formData.body.trim() || !formData.recipients.trim()) {
      setError("Destinatarios, asunto y cuerpo del mensaje son obligatorios.");
      console.log("AdminMessagingPage: handleSubmit validation failed.");
      return;
    }
    
    if (!mountedRef.current) {
        console.log("AdminMessagingPage: handleSubmit aborted, component unmounted before starting send operation.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    console.log("AdminMessagingPage: handleSubmit - state reset, calling sendMessage.");

    try {
      const recipientsArray = formData.recipients.split(',').map(r => r.trim().toLowerCase()).filter(r => r);
      if (recipientsArray.length === 0) {
        setError("Debe especificar al menos un destinatario válido.");
        setIsLoading(false);
        console.log("AdminMessagingPage: handleSubmit validation failed - no valid recipients.");
        return;
      }

      const newMessageData: SendMessageData = {
        recipients: recipientsArray,
        subject: formData.subject,
        body: formData.body,
        category: formData.category,
      };
      await adminMessagingService.sendMessage(newMessageData);
      console.log("AdminMessagingPage: handleSubmit - sendMessage successful.");

      if (mountedRef.current) {
        setSuccess("Mensaje enviado con éxito.");
        fetchMessages(); 
        setFormData({ recipients: '', subject: '', body: '', category: 'info' as AdminMessageCategory });
        console.log("AdminMessagingPage: handleSubmit - success state updated, form reset.");
      } else {
        console.log("AdminMessagingPage: handleSubmit - component unmounted before success state update.");
      }
    } catch (err) {
      console.error("AdminMessagingPage: handleSubmit - error during sendMessage:", err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Error al enviar mensaje.");
        console.log("AdminMessagingPage: handleSubmit - error state updated.");
      } else {
        console.log("AdminMessagingPage: handleSubmit - component unmounted before error state update.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        console.log("AdminMessagingPage: handleSubmit - loading state set to false.");
      } else {
        console.log("AdminMessagingPage: handleSubmit - component unmounted before finally block finished setting loading state.");
      }
    }
  };

  const handleDeleteRequest = (message: AdminMessage) => {
    setMessageToDelete(message);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    console.log(`AdminMessagingPage: confirmDeleteMessage for ID: ${messageToDelete.id}.`);
    if (!mountedRef.current) {
        console.log("AdminMessagingPage: confirmDeleteMessage aborted, component unmounted.");
        return;
    }
    setIsSubmittingDelete(true);
    setError(null); 
    setSuccess(null);
    try {
      await adminMessagingService.deleteMessage(messageToDelete.id);
      if (mountedRef.current) {
        setSuccess("Mensaje eliminado con éxito.");
        fetchMessages();
        console.log("AdminMessagingPage: confirmDeleteMessage successful.");
      } else {
        console.log("AdminMessagingPage: confirmDeleteMessage - component unmounted after delete, before state update.");
      }
    } catch (err) {
      console.error("AdminMessagingPage: confirmDeleteMessage error:", err);
      if (mountedRef.current) {
        setError("Error al eliminar el mensaje.");
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmittingDelete(false);
        setMessageToDelete(null); // Close modal
      }
    }
  };

  const messageCategories: { value: AdminMessageCategory; label: string }[] = [
    { value: 'info', label: 'Informativo' },
    { value: 'alert', label: 'Alerta' },
    { value: 'payment_reminder', label: 'Recordatorio de Pago' },
    { value: 'feature_update', label: 'Actualización de Función' },
    { value: 'congratulations', label: 'Felicitación' },
  ];

  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Mensajería para Administradores</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Envía mensajes personalizados a administradores. (Simulación con localStorage)
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Message Section */}
        <div className="lg:col-span-2 bg-white p-6 shadow-xl rounded-xl border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-5">Redactar Nuevo Mensaje</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="recipients" className="block text-sm font-medium text-neutral-700 mb-1">Destinatarios <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="recipients" 
                id="recipients" 
                value={formData.recipients}
                onChange={handleChange}
                placeholder="Ej: admin1@example.com, admin2@example.com (separados por coma)" 
                className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" 
                required
              />
              <p className="text-xs text-neutral-500 mt-1">Ingresa emails de administradores separados por coma.</p>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1">Asunto <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="subject" 
                id="subject" 
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" 
                required
              />
            </div>
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-neutral-700 mb-1">Cuerpo del Mensaje <span className="text-red-500">*</span></label>
              <textarea 
                name="body" 
                id="body" 
                rows={5} 
                value={formData.body}
                onChange={handleChange}
                className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" 
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
              <select 
                name="category" 
                id="category" 
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
              >
                {messageCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {error && 
              <div role="alert" className="text-red-700 bg-red-100 border border-red-300 p-3 rounded-md text-sm flex items-center">
                <XCircleIcon className="w-5 h-5 mr-2"/> {error}
              </div>
            }
            {success && 
              <div role="status" aria-live="polite" className="text-green-700 bg-green-100 border border-green-300 p-3 rounded-md text-sm flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2"/> {success}
              </div>
            }

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center px-5 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
            >
              {isLoading ? <LoadingSpinnerIcon className="w-5 h-5 mr-2.5" /> : <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2.5" />}
              {isLoading ? 'Enviando Mensaje...' : 'Enviar Mensaje'}
            </button>
          </form>
        </div>

        {/* Message History Section */}
        <div className="lg:col-span-1 bg-white p-6 shadow-xl rounded-xl border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-5">Historial de Mensajes Enviados</h2>
          {isFetchingMessages && !messages.length ? (
             <div className="flex justify-center items-center py-10">
                <LoadingSpinnerIcon className="w-8 h-8 text-primary" />
                <p className="ml-2 text-neutral-500">Cargando historial...</p>
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No hay mensajes enviados aún.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar-thin pr-2">
              {messages.map(msg => (
                <div key={msg.id} className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50/70 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-sm font-semibold text-neutral-700 truncate max-w-[70%]" title={msg.subject}>{msg.subject}</h4>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(msg.sentAt).toLocaleDateString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mb-1">Para: <span className="italic">{msg.recipients.join(', ').substring(0, 50)}{msg.recipients.join(', ').length > 50 ? '...' : ''}</span></p>
                  <p className="text-xs text-neutral-500 mb-2 line-clamp-2" title={msg.body}>{msg.body}</p>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">{msg.category}</span>
                    <button 
                        onClick={() => handleDeleteRequest(msg)}
                        disabled={isSubmittingDelete}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                        title="Eliminar mensaje"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Deleting Message */}
      {messageToDelete && (
        <Modal
          isOpen={!!messageToDelete}
          onClose={() => setMessageToDelete(null)}
          title="Confirmar Eliminación de Mensaje"
          onConfirm={confirmDeleteMessage}
          confirmText="Eliminar Mensaje"
          cancelText="Cancelar"
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          isLoading={isSubmittingDelete}
        >
          <p className="text-sm text-neutral-600">
            ¿Estás seguro de que quieres eliminar el mensaje con asunto: 
            <strong className="font-semibold text-neutral-800"> "{messageToDelete.subject}"</strong>?
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AdminMessagingPage;