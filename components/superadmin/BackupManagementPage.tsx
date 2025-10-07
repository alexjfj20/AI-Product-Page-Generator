import React from 'react';
import { ArchiveIcon, SparklesIcon } from '../icons'; // Reusing icons

const BackupManagementPage: React.FC = () => {
  // Mock data for backups
  const backups = [
    { id: 'backup_001', type: 'Completa Sistema', date: '2023-10-25 02:00', status: 'Completado', size: '1.2 GB' },
    { id: 'backup_002', type: 'Cuenta: adm_001', date: '2023-10-24 10:00', status: 'Completado', size: '50 MB' },
    { id: 'backup_003', type: 'Completa Sistema', date: '2023-10-18 02:00', status: 'Fallido', size: 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-6 border-b border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-800">Gestión de Copias de Seguridad</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Genera, visualiza, descarga y restaura copias de seguridad del sistema y por cuenta.
        </p>
      </header>
      
      <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Copias Existentes</h2>
          <div className="space-x-2">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-blue-700 shadow-sm">Generar Copia Completa</button>
            <button className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300 shadow-sm">Generar Copia por Cuenta</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">ID / Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Tamaño</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {backups.map(backup => (
                <tr key={backup.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="font-medium text-neutral-900 block">{backup.id.substring(0,10)}...</span>
                    <span className="text-neutral-500 text-xs">{backup.type}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">{backup.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      backup.status === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">{backup.size}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                    <button className="text-primary hover:text-blue-700 font-medium text-xs">Descargar</button>
                    <button className="text-red-600 hover:text-red-800 font-medium text-xs">Restaurar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       <div className="bg-white p-6 shadow-lg rounded-xl border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Programación y Logs</h2>
         <div className="text-center py-10">
            <ArchiveIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">
                Opciones para programar copias automáticas y visualizar logs detallados se mostrarán aquí.
                <br/>(Funcionalidad pendiente de implementación)
            </p>
        </div>
      </div>
    </div>
  );
};

export default BackupManagementPage;