
import React, { useState } from 'react';
import { LoginIcon, SparklesIcon, LoadingSpinnerIcon } from './icons';
import * as authService from '../services/authService'; // Importar el servicio de autenticación
import { AuthResponse } from '../types'; // Importar AuthResponse

interface LoginViewProps {
  onLoginSuccess: (authData: AuthResponse) => void; // Cambiado para pasar datos de autenticación
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Por favor, ingresa tu email y contraseña.");
      setIsLoading(false);
      return;
    }
    
    try {
      const authData = await authService.login(email, password);
      onLoginSuccess(authData); // Notificar a App.tsx sobre el éxito del login con los datos
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-12 w-full max-w-md border border-neutral-200">
        <div className="flex items-center justify-center mb-6">
          <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 text-center">
            Gestor de Productos AI
          </h1>
        </div>
        <p className="text-neutral-600 mb-8 text-sm sm:text-base text-center">
          Inicia sesión para continuar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="tu@email.com"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150 disabled:opacity-70"
            aria-label="Iniciar sesión en la aplicación"
          >
            {isLoading ? (
              <LoadingSpinnerIcon className="w-5 h-5 mr-2.5" />
            ) : (
              <LoginIcon className="w-5 h-5 mr-2.5 text-white/90" />
            )}
            {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="mt-8 text-xs text-neutral-500 text-center">
          <strong>Usuarios de demostración:</strong><br/>
          SME: <code className="bg-neutral-200 px-1 rounded">user@example.com</code> / Pass: <code className="bg-neutral-200 px-1 rounded">password123</code><br/>
          Superadmin: <code className="bg-neutral-200 px-1 rounded">superadmin@example.com</code> / Pass: <code className="bg-neutral-200 px-1 rounded">superpassword</code>
        </p>
      </div>
      <footer className="absolute bottom-6 text-center text-neutral-500 text-sm w-full">
        <p>&copy; {new Date().getFullYear()} Generador AI de Páginas de Producto. Potenciando PYMEs.</p>
      </footer>
    </div>
  );
};