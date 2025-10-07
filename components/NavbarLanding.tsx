import React from 'react';
import { SparklesIcon } from './icons';

interface NavbarLandingProps {
  onNavigateToLogin: () => void;
}

export const NavbarLanding: React.FC<NavbarLandingProps> = ({ onNavigateToLogin }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
        <div className="flex items-center">
          <SparklesIcon className="w-8 h-8 text-primary mr-2" />
          <span className="font-bold text-xl text-neutral-800">Gestor de Productos AI</span>
        </div>
        <button
          onClick={onNavigateToLogin}
          className="px-5 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150 text-sm"
          aria-label="Iniciar sesión"
        >
          Iniciar Sesión
        </button>
      </div>
    </nav>
  );
};
