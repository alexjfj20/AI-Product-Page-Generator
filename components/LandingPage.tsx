import React from 'react';
import { SparklesIcon, CheckCircleIcon } from './icons';
import { NavbarLanding } from './NavbarLanding'; // Importar NavbarLanding

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

const plans = [
  {
    name: "Gratis",
    price: "$0",
    priceSuffix: "/mes",
    features: ["5 productos máximo", "Generación de descripción básica", "Sugerencias de categorías"],
    cta: "Comenzar Gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    priceSuffix: "/mes",
    features: ["100 productos", "Generación de descripción avanzada", "Soporte prioritario", "Analíticas básicas"],
    cta: "Elegir Plan Pro",
    popular: true,
  },
  {
    name: "Premium",
    price: "$79",
    priceSuffix: "/mes",
    features: ["Productos ilimitados", "Todas las funciones Pro", "Analíticas avanzadas", "Acceso API (próximamente)"],
    cta: "Elegir Plan Premium",
    popular: false,
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const features = [
    "Genera descripciones de producto atractivas al instante.",
    "Obtén sugerencias de categorías impulsadas por IA.",
    "Administra fácilmente una lista de tus ideas de productos.",
    "Interfaz simple e intuitiva.",
    "Ahorra tiempo y impulsa el contenido de tu e-commerce."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-200 flex flex-col items-center">
      <NavbarLanding onNavigateToLogin={onNavigateToLogin} />
      
      <main className="pt-24 sm:pt-28 pb-12 px-6 flex-grow w-full flex flex-col items-center"> {/* Added padding top for fixed navbar */}
        <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-12 w-full max-w-3xl text-center border border-neutral-200 mb-16">
          <header className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="w-16 h-16 sm:w-20 sm:h-20 text-primary mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-800 tracking-tight">
                Gestor de Productos AI
              </h1>
            </div>
            <p className="text-neutral-600 text-lg sm:text-xl">
              Potencia tu flujo de e-commerce. Crea listados de productos más rápido que nunca.
            </p>
          </header>

          <section className="mb-10 text-left">
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">Características Clave:</h2>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-success mr-2.5 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 text-lg"
            aria-label="Comenzar e iniciar sesión"
          >
            Comenzar Ahora
          </button>
        </div>

        {/* Pricing Section */}
        <section id="pricing" className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-800">Elige el Plan Perfecto para Ti</h2>
            <p className="mt-3 text-neutral-600 text-lg">
              Comienza gratis o elige un plan que se ajuste a tus necesidades de crecimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl shadow-xl p-6 sm:p-8 flex flex-col border ${
                  plan.popular ? 'border-primary ring-2 ring-primary/80' : 'border-neutral-200'
                } hover:shadow-2xl transition-shadow duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-md">
                      Más Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-semibold text-neutral-800 mb-3">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900">{plan.price}</span>
                  <span className="text-neutral-500 ml-1">{plan.priceSuffix}</span>
                </div>
                <ul className="space-y-3 text-neutral-600 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-success mr-2.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onNavigateToLogin}
                  className={`w-full py-3 px-6 font-semibold rounded-lg shadow-md transition-colors duration-150 text-base ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-blue-700 focus:ring-primary'
                      : 'bg-neutral-100 text-primary hover:bg-neutral-200 focus:ring-primary border border-primary/30'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  aria-label={`Seleccionar plan ${plan.name}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <footer className="w-full py-8 text-center text-neutral-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Gestor de Productos AI. Potenciando PYMEs.</p>
      </footer>
    </div>
  );
};
