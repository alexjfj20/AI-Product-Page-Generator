import { AdminMessage, AdminMessageCategory, SendMessageData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const MESSAGES_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.ADMIN_MESSAGES}`;

const getStoredAdminMessages = (): AdminMessage[] => {
  try {
    const storedData = localStorage.getItem(MESSAGES_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error reading admin messages from localStorage:", error);
    return [];
  }
};

const saveStoredAdminMessages = (messages: AdminMessage[]): void => {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving admin messages to localStorage:", error);
  }
};


export const getSentMessages = async (): Promise<AdminMessage[]> => {
  console.log(`adminMessagingService (localStorage): Obteniendo mensajes enviados`);
  return Promise.resolve(getStoredAdminMessages());
};

export const sendMessage = async (messageData: SendMessageData): Promise<AdminMessage> => {
  console.log(`adminMessagingService (localStorage): Enviando mensaje`, messageData);
  const messages = getStoredAdminMessages();
  const newMessage: AdminMessage = {
    ...messageData,
    id: uuidv4(),
    sentAt: Date.now(),
    readBy: [], // Initially no one has read it
  };
  messages.unshift(newMessage); // Add to the beginning for recent first
  saveStoredAdminMessages(messages);
  return Promise.resolve(newMessage);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  console.log(`adminMessagingService (localStorage): Eliminando mensaje ${messageId}`);
  let messages = getStoredAdminMessages();
  messages = messages.filter(msg => msg.id !== messageId);
  saveStoredAdminMessages(messages);
  return Promise.resolve();
};

// Mock function, in real app this would be more complex
export const markMessageAsRead = async (messageId: string, adminId: string): Promise<AdminMessage | null> => {
  console.log(`adminMessagingService (localStorage): Marcando mensaje ${messageId} como leído por ${adminId}`);
  let messages = getStoredAdminMessages();
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    if (!messages[messageIndex].readBy?.includes(adminId)) {
      messages[messageIndex].readBy = [...(messages[messageIndex].readBy || []), adminId];
      saveStoredAdminMessages(messages);
    }
    return Promise.resolve(messages[messageIndex]);
  }
  return Promise.resolve(null);
};

export const getMessagesForRecipient = async (recipientId: string): Promise<AdminMessage[]> => {
  console.log(`adminMessagingService (localStorage): Obteniendo mensajes para el destinatario ${recipientId}`);
  const allMessages = getStoredAdminMessages();
  const recipientMessages = allMessages.filter(msg => 
    msg.recipients.includes(recipientId) || msg.recipients.includes(recipientId.toLowerCase()) // Consider case if needed
  );
  // Sort by sentAt descending (newest first)
  recipientMessages.sort((a, b) => b.sentAt - a.sentAt);
  return Promise.resolve(recipientMessages);
};