import { ProductInput } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

const GENERIC_AI_ERROR_MESSAGE = "Error: El servicio de IA no está disponible en este momento. Inténtalo de nuevo más tarde.";
const API_KEY_MISSING_ERROR = "CRITICAL_ERROR: La API KEY de Gemini no está configurada o no es accesible en este entorno (process.env.API_KEY). Las funciones de IA están deshabilitadas.";
const INVALID_RESPONSE_ERROR_MESSAGE = "Error: Respuesta inesperada del servicio de IA.";

console.log(`aiService: Initializing. API_KEY found: ${!!API_KEY}, Value (first 5 chars): ${API_KEY ? API_KEY.substring(0,5) + '...' : 'N/A'}`);

if (API_KEY && typeof API_KEY === 'string' && API_KEY.trim() !== '') {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log("aiService: GoogleGenAI client initialized successfully.");
  } catch (initError) {
    console.error("aiService: Failed to initialize GoogleGenAI client:", initError);
    ai = null; 
  }
} else {
  console.error(`aiService: API_KEY is missing, invalid, or empty. Value: '${API_KEY}'`);
}

function logGeminiError(functionName: string, error: any, promptDetails?: any) {
  console.error(`aiService.${functionName}: Error calling Gemini API.`, {
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    // rawError: error, // Uncomment for very detailed debugging if needed
    promptDetails: promptDetails || "No additional prompt details."
  });
}

export const generateProductDescription = async (details: ProductInput): Promise<string> => {
  if (!ai) {
    console.error("aiService.generateProductDescription: Aborting, AI client not initialized (API_KEY likely missing/invalid).");
    return API_KEY_MISSING_ERROR;
  }
  console.log("aiService.generateProductDescription: Requesting description from Gemini API for product:", details.name);

  const prompt = `Genera una descripción de producto concisa y atractiva (aproximadamente 3-4 frases) en español para el siguiente producto. Enfócate en los beneficios clave y en un tono que invite a la compra.
  - Nombre del Producto: "${details.name}"
  - Categoría: "${details.category}"
  - Precio: "${details.price || 'No especificado'}"
  - Idea Clave/Características: "${details.idea}"
  
  Descripción Generada:`;

  try {
    console.log("aiService.generateProductDescription: Sending request to Gemini models.generateContent.");
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    console.log("aiService.generateProductDescription: Received response from Gemini API.");
    const description = response.text;
    if (description) {
      return description.trim();
    }
    console.warn("aiService.generateProductDescription: Gemini API response had no text.", response);
    return INVALID_RESPONSE_ERROR_MESSAGE;
  } catch (error) {
    logGeminiError('generateProductDescription', error, { productName: details.name });
    // Construct a more informative error message if possible
    const message = error instanceof Error ? error.message : String(error);
    return `${GENERIC_AI_ERROR_MESSAGE} (Detalle: ${message})`;
  }
};

export const suggestProductCategories = async (productName: string, productIdea: string): Promise<string[]> => {
  if (!ai) {
    console.error("aiService.suggestProductCategories: Aborting, AI client not initialized (API_KEY likely missing/invalid).");
    return [API_KEY_MISSING_ERROR]; 
  }
  console.log("aiService.suggestProductCategories: Requesting categories from Gemini API for:", { productName, productIdea });

  const prompt = `Basado en el siguiente producto, sugiere 3 categorías relevantes en español.
  - Nombre del Producto: "${productName}"
  - Idea Clave/Características: "${productIdea}"
  
  Devuelve las categorías como un array JSON de strings. Por ejemplo: ["Categoría Ejemplo 1", "Categoría Ejemplo 2", "Categoría Ejemplo 3"].
  No incluyas ninguna otra explicación, solo el array JSON.`;

  try {
    console.log("aiService.suggestProductCategories: Sending request to Gemini models.generateContent with JSON output config.");
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log("aiService.suggestProductCategories: Received response from Gemini API.");
    
    let jsonStr = response.text?.trim();
    if (!jsonStr) {
        console.warn("aiService.suggestProductCategories: Gemini API response had no text.", response);
        return [INVALID_RESPONSE_ERROR_MESSAGE.replace("Error: ", "")];
    }
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
        return parsedData;
      }
      console.warn("aiService.suggestProductCategories: Gemini API returned non-array or non-string array for categories:", parsedData);
      return ["Error: Formato de categorías inválido."];
    } catch (parseError) {
      logGeminiError('suggestProductCategories (JSON parsing)', parseError, { rawResponseText: response.text });
      return ["Error: No se pudieron procesar las categorías sugeridas."];
    }

  } catch (error) {
    logGeminiError('suggestProductCategories', error, { productName, productIdea });
    const message = error instanceof Error ? error.message : String(error);
    return [`${GENERIC_AI_ERROR_MESSAGE.replace("Error: ", "")} (Detalle: ${message})`];
  }
};

export const generateMarketingContent = async (promptFromUser: string): Promise<string> => {
  if (!ai) {
    console.error("aiService.generateMarketingContent: Aborting, AI client not initialized (API_KEY likely missing/invalid).");
    return API_KEY_MISSING_ERROR;
  }
  console.log("aiService.generateMarketingContent: Requesting marketing content from Gemini API.");

  const fullPrompt = `${promptFromUser}
  
  Por favor, proporciona solo el contenido solicitado, sin introducciones o comentarios adicionales a menos que se especifique en la tarea.`;

  try {
    console.log("aiService.generateMarketingContent: Sending request to Gemini models.generateContent.");
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: fullPrompt,
    });
    console.log("aiService.generateMarketingContent: Received response from Gemini API.");
    const content = response.text;
    if (content) {
      return content.trim();
    }
    console.warn("aiService.generateMarketingContent: Gemini API response had no text.", response);
    return INVALID_RESPONSE_ERROR_MESSAGE;
  } catch (error) {
    logGeminiError('generateMarketingContent', error);
    const message = error instanceof Error ? error.message : String(error);
    return `${GENERIC_AI_ERROR_MESSAGE} (Detalle: ${message})`;
  }
};
