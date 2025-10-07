import { BackupLog, CreateBackupLogData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEY_PREFIX, BASE_KEYS } from './dataServiceKeys';

const BACKUP_LOGS_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}_${BASE_KEYS.BACKUP_LOGS}`;

const getInitialBackupLogs = (): BackupLog[] => [
    {
        id: uuidv4(),
        type: 'full_system',
        timestamp: Date.now() - (1000 * 60 * 60 * 24 * 3), // 3 days ago
        status: 'completed',
        filePath: '/simulated/backups/full_system_202310250200.zip',
        sizeMb: 1200,
        triggeredBy: 'scheduled',
    }
];

const getStoredBackupLogs = (): BackupLog[] => {
  try {
    const storedData = localStorage.getItem(BACKUP_LOGS_STORAGE_KEY);
    if (storedData) {
        return JSON.parse(storedData);
    }
    const initialLogs = getInitialBackupLogs();
    saveStoredBackupLogs(initialLogs);
    return initialLogs;
  } catch (error) {
    console.error("Error reading backup logs from localStorage:", error);
    const initialLogs = getInitialBackupLogs();
    saveStoredBackupLogs(initialLogs);
    return initialLogs;
  }
};

const saveStoredBackupLogs = (logs: BackupLog[]): void => {
  try {
    localStorage.setItem(BACKUP_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving backup logs to localStorage:", error);
  }
};

export const getBackupLogs = async (): Promise<BackupLog[]> => {
  console.log(`backupService (localStorage): Obteniendo logs de backups`);
  return Promise.resolve(getStoredBackupLogs());
};


export const createBackupLog = async (backupData: CreateBackupLogData): Promise<BackupLog> => {
  console.log(`backupService (localStorage): Creando log de backup`, backupData);
  const logs = getStoredBackupLogs();
  const newLog: BackupLog = {
    id: uuidv4(),
    type: backupData.type,
    accountId: backupData.accountId,
    timestamp: Date.now(),
    status: 'in_progress', // Simulate it starts as in_progress
    triggeredBy: 'manual', // Assuming logs created via this function are manual
    filePath: undefined, // Path and size would be set upon completion
    sizeMb: undefined,
  };
  logs.unshift(newLog);
  saveStoredBackupLogs(logs);

  // Simulate completion after a short delay
  setTimeout(() => {
    const currentLogs = getStoredBackupLogs();
    const logIndex = currentLogs.findIndex(l => l.id === newLog.id);
    if (logIndex !== -1) {
      currentLogs[logIndex].status = 'completed';
      currentLogs[logIndex].filePath = `/simulated/backups/${newLog.type}_${newLog.id.substring(0,8)}.zip`;
      currentLogs[logIndex].sizeMb = backupData.type === 'full_system' ? Math.floor(Math.random() * 1000) + 500 : Math.floor(Math.random() * 50) + 10;
      saveStoredBackupLogs(currentLogs);
      console.log(`backupService (localStorage): Backup ${newLog.id} simulado como completado.`);
    }
  }, 3000);

  return Promise.resolve(newLog);
};

export const deleteBackupLog = async (logId: string): Promise<void> => {
  console.log(`backupService (localStorage): Eliminando log de backup ${logId}`);
  let logs = getStoredBackupLogs();
  logs = logs.filter(log => log.id !== logId);
  saveStoredBackupLogs(logs);
  return Promise.resolve();
};

export const downloadBackup = async (logId: string): Promise<void> => {
  const log = getStoredBackupLogs().find(l => l.id === logId);
  if (log && log.filePath && log.status === 'completed') {
    console.log(`backupService (localStorage): Solicitando descarga para backup ${logId} desde ${log.filePath} (simulado)`);
    alert(`Simulación: Descargando backup desde "${log.filePath}".\nEn una app real, esto iniciaría una descarga desde el backend o un enlace directo si el archivo es público.`);
  } else {
    alert(`Simulación: No se puede descargar el backup ${logId}. Puede no estar completado o no tener un archivo asociado.`);
    console.warn(`backupService (localStorage): No se puede descargar backup ${logId}`, log);
  }
  return Promise.resolve();
};

export const restoreFromBackup = async (logId: string): Promise<void> => {
  const log = getStoredBackupLogs().find(l => l.id === logId);
   if (log && log.status === 'completed') {
    console.log(`backupService (localStorage): Solicitando restauración desde backup ${logId} (simulado)`);
    alert(`Simulación: Iniciando restauración desde backup ${logId} (${log.type}).\nEsta es una operación crítica que afectaría los datos del sistema/cuenta.\nEn una app real, esto requeriría confirmación adicional.`);
   } else {
     alert(`Simulación: No se puede restaurar desde el backup ${logId}. Puede no estar completado.`);
     console.warn(`backupService (localStorage): No se puede restaurar desde backup ${logId}`, log);
   }
  return Promise.resolve();
};