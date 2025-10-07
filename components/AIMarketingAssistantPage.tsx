import React, { useState, useEffect } from 'react';
import { generateMarketingContent } from '../services/aiService'; // Usar el servicio centralizado de IA
import { ArrowLeftIcon, SparklesIcon, LightbulbIcon, ClipboardCopyIcon, LoadingSpinnerIcon, CheckCircleIcon, XCircleIcon } from './icons';
// Ya no se usa GEMINI_TEXT_MODEL ni GoogleGenAI directamente aquí.

interface AIMarketingAssistantPageProps {
  onNavigateBack: () => void;
}

type MarketingTaskValue = 'socialMediaPost' | 'emailSubject' | 'blogIdeas' | 'productAdCopy';

interface TaskInputDefinition {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea';
  required?: boolean;
}

interface MarketingTask {
  value: MarketingTaskValue;
  label: string;
  description: string;
  inputs: TaskInputDefinition[];
  // El promptTemplate ahora se construye y se envía al backend.
  // El backend decidirá cómo usarlo con el modelo de IA.
  buildPrompt: (inputs: Record<string, string>) => string;
}

const marketingTasks: MarketingTask[] = [
  {
    value: 'socialMediaPost',
    label: 'Crear Publicación para Redes Sociales',
    description: 'Genera borradores de publicaciones para plataformas como Instagram, Facebook, Twitter, etc.',
    inputs: [
      { name: 'productName', label: 'Nombre del Producto/Servicio', placeholder: 'Ej: Zapatillas EcoBoost X', required: true },
      { name: 'keyMessage', label: 'Mensaje Clave o Promoción', placeholder: 'Ej: ¡Lanzamiento! 20% de descuento esta semana.', type: 'textarea', required: true },
      { name: 'platform', label: 'Plataforma (opcional)', placeholder: 'Ej: Instagram, LinkedIn' },
      { name: 'tone', label: 'Tono (opcional)', placeholder: 'Ej: Divertido, Profesional, Inspirador' },
    ],
    buildPrompt: (inputs) =>
      `Tarea: Generar publicación para redes sociales.
Producto/Servicio: "${inputs.productName}".
Mensaje Clave: "${inputs.keyMessage}".
${inputs.platform ? `Plataforma: ${inputs.platform}.` : ''}
${inputs.tone ? `Tono: ${inputs.tone}.` : 'Tono: amigable y profesional.'}
Requisitos: Publicación atractiva y concisa, ideal para captar atención. Incluir 2-3 hashtags relevantes. Si es para Instagram o Facebook, considerar un emoji relevante.
Respuesta esperada: Solo el texto de la publicación con hashtags.`,
  },
  {
    value: 'emailSubject',
    label: 'Generar Asuntos de Correo Electrónico',
    description: 'Crea asuntos de correo llamativos y que incentiven la apertura.',
    inputs: [
      { name: 'emailTopic', label: 'Tema Principal del Correo', placeholder: 'Ej: Novedades de la temporada de verano', required: true },
      { name: 'targetAudience', label: 'Audiencia Objetivo (opcional)', placeholder: 'Ej: Jóvenes adultos, amantes de la tecnología' },
      { name: 'emailGoal', label: 'Objetivo del Correo (opcional)', placeholder: 'Ej: Informar, Vender, Recuperar carrito' },
    ],
    buildPrompt: (inputs) =>
      `Tarea: Sugerir 5 asuntos de correo electrónico.
Tema Principal: "${inputs.emailTopic}".
${inputs.targetAudience ? `Audiencia Objetivo: ${inputs.targetAudience}.` : ''}
${inputs.emailGoal ? `Objetivo del Correo: ${inputs.emailGoal}.` : ''}
Requisitos: Asuntos creativos, concisos, alta tasa de apertura.
Formato de respuesta: Una lista numerada de los 5 asuntos. Sin introducciones ni conclusiones.`,
  },
  {
    value: 'blogIdeas',
    label: 'Sugerir Ideas para Artículos de Blog',
    description: 'Obtén ideas frescas y relevantes para tu blog o sección de noticias.',
    inputs: [
      { name: 'blogTopic', label: 'Tema o Categoría Principal del Blog', placeholder: 'Ej: Marketing digital para PYMEs', required: true },
      { name: 'keywords', label: 'Palabras Clave (opcional, separadas por coma)', placeholder: 'Ej: SEO, contenido, redes sociales' },
    ],
    buildPrompt: (inputs) =>
      `Tarea: Generar 3 ideas para artículos de blog.
Tema Principal: "${inputs.blogTopic}".
${inputs.keywords ? `Palabras Clave a considerar: ${inputs.keywords}.` : ''}
Requisitos: Para cada idea, sugerir:
1. Título atractivo y optimizado para SEO.
2. Breve descripción (2-3 frases) del contenido.
3. 2-3 palabras clave secundarias relevantes.
Formato de respuesta: Para cada idea, presentar título, descripción y palabras clave secundarias.`,
  },
  {
    value: 'productAdCopy',
    label: 'Redactar Anuncio Corto para Producto',
    description: 'Crea textos persuasivos y breves para anuncios de productos.',
    inputs: [
      { name: 'adProductName', label: 'Nombre del Producto', placeholder: 'Ej: Café Gourmet "Despertar Andino"', required: true },
      { name: 'adFeatureBenefit', label: 'Característica/Beneficio Principal', placeholder: 'Ej: Granos 100% arábica, tostado artesanal, energía natural.', type: 'textarea', required: true },
      { name: 'adCallToAction', label: 'Llamada a la Acción', placeholder: 'Ej: ¡Compra ahora y disfruta!', required: true },
      { name: 'adPlatform', label: 'Plataforma del Anuncio (opcional)', placeholder: 'Ej: Google Ads, Facebook Ads' }
    ],
    buildPrompt: (inputs) =>
      `Tarea: Redactar texto de anuncio corto.
Producto: "${inputs.adProductName}".
Característica/Beneficio Principal: "${inputs.adFeatureBenefit}".
Llamada a la Acción: "${inputs.adCallToAction}".
${inputs.adPlatform ? `Plataforma del Anuncio: ${inputs.adPlatform}.` : ''}
Requisitos: Texto impactante, persuasivo, máximo 40-50 palabras. Enfocado en generar interés y acción.
Respuesta esperada: Solo el texto del anuncio.`,
  },
];

export const AIMarketingAssistantPage: React.FC<AIMarketingAssistantPageProps> = ({ onNavigateBack }) => {
  const [selectedTaskValue, setSelectedTaskValue] = useState<MarketingTaskValue>(marketingTasks[0].value);
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentTask = marketingTasks.find(task => task.value === selectedTaskValue) || marketingTasks[0];

  useEffect(() => {
    const initialInputs: Record<string, string> = {};
    currentTask.inputs.forEach(input => initialInputs[input.name] = '');
    setTaskInputs(initialInputs);
    setGeneratedContent('');
    setError(null);
    setSuccessMessage(null);
  }, [selectedTaskValue, currentTask]);

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTaskValue(e.target.value as MarketingTaskValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskInputs(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleGenerateContent = async () => {
    setError(null);
    setSuccessMessage(null);
    setGeneratedContent('');

    for (const inputDef of currentTask.inputs) {
      if (inputDef.required && !taskInputs[inputDef.name]?.trim()) {
        setError(`El campo "${inputDef.label}" es obligatorio.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const prompt = currentTask.buildPrompt(taskInputs);
      const content = await generateMarketingContent(prompt); // Llamada al aiService
      
      let textResponse = content;
      if (selectedTaskValue === 'emailSubject' || selectedTaskValue === 'blogIdeas') {
         textResponse = textResponse.replace(/(\d\.)\s*/g, '\n$1 ');
      }
      setGeneratedContent(textResponse.trim());

    } catch (err) {
      console.error("Error generating marketing content via aiService:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al contactar el servicio de IA.";
      setError(`Error al generar contenido: ${errorMessage}`);
      setGeneratedContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        setSuccessMessage("¡Contenido copiado al portapapeles!");
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch(err => {
        console.error("Error copying to clipboard:", err);
        setError("Error al copiar el contenido.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 w-full max-w-3xl flex items-center justify-between">
        <div className="flex items-center">
          <LightbulbIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mr-2 sm:mr-3" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
              Asistente IA de Marketing
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Genera ideas y contenido para tus campañas.
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
      </header>

      <main className="w-full max-w-3xl bg-white p-6 sm:p-8 shadow-xl rounded-xl border border-neutral-200 space-y-6">
        <div>
          <label htmlFor="marketingTask" className="block text-sm font-medium text-neutral-700 mb-1">
            Selecciona una Tarea de Marketing
          </label>
          <select
            id="marketingTask"
            name="marketingTask"
            value={selectedTaskValue}
            onChange={handleTaskChange}
            className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
            aria-label="Seleccionar tarea de marketing"
          >
            {marketingTasks.map(task => (
              <option key={task.value} value={task.value}>{task.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-neutral-500">{currentTask.description}</p>
        </div>

        {currentTask.inputs.map(inputDef => (
          <div key={inputDef.name}>
            <label htmlFor={inputDef.name} className="block text-sm font-medium text-neutral-700 mb-1">
              {inputDef.label} {inputDef.required && <span className="text-red-500">*</span>}
            </label>
            {inputDef.type === 'textarea' ? (
              <textarea
                id={inputDef.name}
                name={inputDef.name}
                value={taskInputs[inputDef.name] || ''}
                onChange={handleInputChange}
                placeholder={inputDef.placeholder}
                rows={3}
                className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                aria-required={inputDef.required}
              />
            ) : (
              <input
                type={inputDef.type || 'text'}
                id={inputDef.name}
                name={inputDef.name}
                value={taskInputs[inputDef.name] || ''}
                onChange={handleInputChange}
                placeholder={inputDef.placeholder}
                className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                aria-required={inputDef.required}
              />
            )}
          </div>
        ))}
        
        {error && (
          <div role="alert" className="my-3 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2 text-red-500"/> {error}
          </div>
        )}
        {successMessage && (
            <div role="status" aria-live="polite" className="my-3 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" /> {successMessage}
            </div>
        )}

        <button
          onClick={handleGenerateContent}
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          aria-label="Generar contenido de marketing"
        >
          {isLoading ? (
            <LoadingSpinnerIcon className="w-5 h-5 mr-2" />
          ) : (
            <SparklesIcon className="w-5 h-5 mr-2" strokeWidth={2.5}/>
          )}
          {isLoading ? 'Generando Contenido...' : 'Generar Contenido con IA'}
        </button>

        {generatedContent && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Contenido Generado:</h3>
            <textarea
              readOnly
              value={generatedContent}
              rows={currentTask.value === 'socialMediaPost' || currentTask.value === 'productAdCopy' ? 5 : 10}
              className="w-full p-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-700 whitespace-pre-wrap leading-relaxed shadow-sm focus:ring-primary focus:border-primary"
              aria-label="Contenido generado por IA"
            />
            <button
              onClick={handleCopyToClipboard}
              className="mt-3 px-4 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors duration-150 flex items-center"
              aria-label="Copiar contenido generado al portapapeles"
            >
              <ClipboardCopyIcon className="w-4 h-4 mr-2" />
              Copiar Contenido
            </button>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-neutral-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Asistente IA de Marketing.</p>
      </footer>
    </div>
  );
};
