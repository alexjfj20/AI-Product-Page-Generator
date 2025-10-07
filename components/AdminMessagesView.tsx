
import React, { useState, useEffect, useCallback } from 'react';
import { AdminMessage, User, AdminMessageCategory } from '../types'; // AdminMessageCategory importada
import * as adminMessagingService from '../services/adminMessagingService';
import { ArrowLeftIcon, InboxIcon, LoadingSpinnerIcon, SparklesIcon, XCircleIcon, XIcon } from './icons'; // XIcon importado

interface AdminMessagesViewProps {
  currentUser: User;
  onNavigateBack: () => void;
}

const getCategoryStyles = (category: AdminMessageCategory): string => {
  switch (category) {
    case 'alert': return 'bg-red-100 text-red-700 border-red-200';
    case 'payment_reminder': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'feature_update': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'congratulations': return 'bg-green-100 text-green-700 border-green-200';
    case 'info':
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

export const AdminMessagesView: React.FC<AdminMessagesViewProps> = ({ currentUser, onNavigateBack }) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUser?.email) { // Usar email en lugar de ID
      setError("No se pudo identificar el correo del usuario actual para cargar mensajes.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Pasar el email en minúsculas para la búsqueda
      const userMessages = await adminMessagingService.getMessagesForRecipient(currentUser.email.toLowerCase());
      setMessages(userMessages);
    } catch (err) {
      console.error("Error fetching messages for recipient:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los mensajes.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const MessageCard: React.FC<{ message: AdminMessage, onSelect: () => void }> = ({ message, onSelect }) => (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border ${getCategoryStyles(message.category)}`}
      aria-label={`Ver mensaje: ${message.subject}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-md font-semibold truncate" title={message.subject}>
          {message.subject}
        </h3>
        <span className="text-xs opacity-80 whitespace-nowrap">
          {new Date(message.sentAt).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
        </span>
      </div>
      <p className="text-xs opacity-90 line-clamp-2" title={message.body}>
        {message.body}
      </p>
      <span className={`mt-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryStyles(message.category).replace('border-', 'bg-').replace('text-', 'text-white bg-opacity-70')}`}>
        {message.category.charAt(0).toUpperCase() + message.category.slice(1).replace('_', ' ')}
      </span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 p-4">
        <LoadingSpinnerIcon className="w-12 h-12 text-primary mb-4" />
        <p className="text-neutral-600">Cargando tus mensajes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 py-8 px-4">
      <header className="container mx-auto max-w-3xl mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <InboxIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mr-3" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Bandeja de Entrada</h1>
                <p className="text-sm sm:text-base text-neutral-600">
                    Mensajes del equipo de administración.
                </p>
            </div>
          </div>
          <button
            onClick={onNavigateBack}
            className="flex items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 shadow-sm transition-colors duration-150 text-sm font-medium"
            title="Volver al Panel Principal"
            aria-label="Volver al Panel Principal"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 text-neutral-600" />
            Volver al Panel
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl">
        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2 text-red-600" />
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoading && !error && (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-neutral-200">
            <InboxIcon className="w-20 h-20 text-neutral-300 mx-auto mb-6" strokeWidth={1} />
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">No tienes mensajes nuevos</h2>
            <p className="text-neutral-500">
              Cuando recibas comunicaciones importantes, aparecerán aquí.
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map(msg => (
              <MessageCard key={msg.id} message={msg} onSelect={() => setSelectedMessage(msg)} />
            ))}
          </div>
        )}
      </main>

      {selectedMessage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedMessage(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-detail-title"
        >
            <div 
                className={`bg-white rounded-xl shadow-2xl w-full max-w-lg m-auto flex flex-col border ${getCategoryStyles(selectedMessage.category)}`}
                onClick={e => e.stopPropagation()}
                style={{ animation: 'modalShowAnim 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) forwards' }}
            >
                <div className="flex items-center justify-between p-5 border-b border-current/20">
                    <h3 id="message-detail-title" className="text-lg font-semibold truncate" title={selectedMessage.subject}>
                        {selectedMessage.subject}
                    </h3>
                    <button
                        onClick={() => setSelectedMessage(null)}
                        className="opacity-70 hover:opacity-100 p-1 rounded-full hover:bg-black/10 transition-colors"
                        aria-label="Cerrar mensaje"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                    <div className="flex justify-between items-center text-xs opacity-80 mb-3">
                        <span>Categoría: <strong className="font-medium">{selectedMessage.category.charAt(0).toUpperCase() + selectedMessage.category.slice(1).replace('_', ' ')}</strong></span>
                        <span>Enviado: {new Date(selectedMessage.sentAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.body}
                    </p>
                </div>
                 <div className="flex justify-end p-4 bg-current/5 border-t border-current/10 rounded-b-xl">
                    <button
                        onClick={() => setSelectedMessage(null)}
                        className="px-4 py-2 text-sm font-medium bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}

      <footer className="mt-12 text-center text-neutral-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {currentUser.name || 'Tu Tienda'}.</p>
      </footer>
    </div>
  );
};