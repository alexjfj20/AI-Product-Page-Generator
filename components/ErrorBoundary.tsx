import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationCircleIcon } from './icons'; // Reutilizar un ícono existente

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de fallback personalizada
      return (
        <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center p-4 text-center">
          <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" strokeWidth={1.5} />
            <h1 className="text-2xl font-semibold text-neutral-800 mb-3">¡Ups! Algo salió mal.</h1>
            <p className="text-neutral-600 mb-6">
              Lo sentimos, parece que ha ocurrido un error inesperado en la aplicación.
              Puedes intentar recargar la página.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-2 bg-red-50 text-red-700 text-xs text-left rounded border border-red-200">
                <summary>Detalles del error (solo desarrollo)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n${this.state.error.stack.substring(0, 500)}...`}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Recargar Página
            </button>
          </div>
          <footer className="mt-8 text-neutral-500 text-sm">
             <p>&copy; {new Date().getFullYear()} Generador AI de Páginas de Producto.</p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;