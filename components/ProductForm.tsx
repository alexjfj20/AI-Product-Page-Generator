
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Product, ProductInput, ProductStatus } from '../types';
import { PREDEFINED_CATEGORIES, PRODUCT_STATUSES } from '../constants';
import { generateProductDescription, suggestProductCategories } from '../services/aiService';
import { LoadingSpinnerIcon, LightbulbIcon, CheckCircleIcon, ClipboardCopyIcon, PhotoIcon, XCircleIcon, CubeIcon, VideoCameraIcon, CurrencyDollarIcon } from './icons';
import { formatPrice } from '../utils'; // Importar formatPrice

export interface ProductFormData {
  input: ProductInput;
  generatedDescription: string;
  imagePreviewUrls?: string[];
  videoUrl?: string;
}

interface ProductFormProps {
  onAddProduct: (productFormData: ProductFormData) => void;
  productToEdit: Product | null;
  onUpdateProduct: (product: Product) => void;
  onCancelEdit: () => void;
  isFirstProductAfterOnboarding?: boolean;
}

const initialFormState: ProductInput = {
  name: '',
  category: PREDEFINED_CATEGORIES[0],
  price: '', // Will be set for AI
  basePrice: '', // User input
  currency: 'USD', // Default currency
  taxRate: '', // Percentage
  discountRate: '', // Percentage
  idea: '',
  videoUrl: '',
  status: ProductStatus.Activo,
  stock: '',
};

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
];

const isAIServiceError = (text: string | string[]): boolean => {
  const checkString = (s: string) =>
    s.startsWith("Error:") ||
    s.startsWith("Falló") ||
    s.startsWith("CRITICAL_ERROR:") || 
    s.toLowerCase().includes("servicio de ia no disponible") ||
    s.toLowerCase().includes("error al obtener") ||
    s.toLowerCase().includes("no se pudo generar");

  if (Array.isArray(text)) {
    return text.length > 0 && checkString(text[0]);
  }
  return checkString(text);
};


export const ProductForm: React.FC<ProductFormProps> = ({
  onAddProduct,
  productToEdit,
  onUpdateProduct,
  onCancelEdit,
  isFirstProductAfterOnboarding
}) => {
  const [productInput, setProductInput] = useState<ProductInput>(initialFormState);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isLoadingDescription, setIsLoadingDescription] = useState<boolean>(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!productToEdit;

  useEffect(() => {
    if (productToEdit) {
      const { id, generatedDescription: desc, imagePreviewUrls, videoUrl, createdAt, stock, basePrice, currency, taxRate, discountRate, ...editableInput } = productToEdit;
      setProductInput({
        name: editableInput.name,
        category: editableInput.category,
        price: '', // Will be set dynamically for AI if needed during edit
        basePrice: basePrice || '', // Populate basePrice
        currency: currency || 'USD', // Populate currency
        taxRate: taxRate || '', // Populate taxRate
        discountRate: discountRate || '', // Populate discountRate
        idea: editableInput.idea,
        videoUrl: videoUrl || '',
        status: editableInput.status || ProductStatus.Activo,
        stock: stock !== undefined ? String(stock) : '',
      });
      setGeneratedDescription(desc);
setImagePreviews(imagePreviewUrls || []);
      setError(null);
      setSuccessMessage(null);
      setSuggestedCategories([]);
    } else {
      resetFormFieldsAndState();
    }
  }, [productToEdit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'stock' || name === 'taxRate' || name === 'discountRate') {
        const numValue = value.replace(/[^0-9.]/g, ''); // Allow decimals for rates
        setProductInput(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'basePrice') {
        const numValue = value.replace(/[^0-9.]/g, '');
        setProductInput(prev => ({ ...prev, [name]: numValue }));
    }
    else {
        setProductInput(prev => ({ ...prev, [name]: value as ProductStatus | string }));
    }
    setError(null);
    setSuccessMessage(null);
  }, []);

  const resetFormFieldsAndState = () => {
    setProductInput(initialFormState);
    setGeneratedDescription('');
    setSuggestedCategories([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
    setSuccessMessage(null);
  };

  const calculatedPrices = useMemo(() => {
    const base = parseFloat(productInput.basePrice || '0');
    const tax = parseFloat(productInput.taxRate || '0');
    const discount = parseFloat(productInput.discountRate || '0');

    if (isNaN(base)) return { subtotal: 0, total: 0, currency: productInput.currency || 'USD' };

    const priceWithTax = base * (1 + tax / 100);
    const discountAmount = priceWithTax * (discount / 100);
    const finalPrice = priceWithTax - discountAmount;

    return {
      subtotal: finalPrice, // As per user: "Subtotal (precio + IVA - descuento)"
      total: finalPrice,    // As per user: "Total (valor final a pagar)"
      currency: productInput.currency || 'USD'
    };
  }, [productInput.basePrice, productInput.taxRate, productInput.discountRate, productInput.currency]);


  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setSuccessMessage(null);
    const currentPreviewsCount = imagePreviews.length;
    const remainingSlots = MAX_IMAGES - currentPreviewsCount;
    if (remainingSlots <= 0) {
      setError(`Ya has alcanzado el límite de ${MAX_IMAGES} imágenes.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const filesToProcessArray = Array.from(files);
    const filesToProcessLimited = filesToProcessArray.slice(0, remainingSlots);
    const fileProcessingPromises: Promise<{ name: string; dataUrl?: string; error?: string }>[] = [];
    const synchronousErrors: string[] = [];
    filesToProcessLimited.forEach(file => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        synchronousErrors.push(`El archivo "${file.name}" es demasiado grande (Máx. ${MAX_FILE_SIZE_MB}MB).`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        synchronousErrors.push(`El archivo "${file.name}" no es una imagen válida.`);
        return;
      }
      fileProcessingPromises.push(
        new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ name: file.name, dataUrl: reader.result as string });
          reader.onerror = () => resolve({ name: file.name, error: `Error al leer el archivo "${file.name}".` });
          reader.readAsDataURL(file);
        })
      );
    });
    if (filesToProcessArray.length > filesToProcessLimited.length) {
      synchronousErrors.push(`Solo se procesarán las primeras ${remainingSlots} imágenes debido al límite total de ${MAX_IMAGES}.`);
    }
    const results = await Promise.allSettled(fileProcessingPromises);
    const newSuccessfulPreviews: string[] = [];
    const processingErrors: string[] = [...synchronousErrors];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { dataUrl, error: fileReadError } = result.value;
        if (fileReadError) {
          processingErrors.push(fileReadError);
        } else if (dataUrl) {
          newSuccessfulPreviews.push(dataUrl);
        }
      } else {
        processingErrors.push(`Error inesperado al procesar un archivo.`);
      }
    });
    if (newSuccessfulPreviews.length > 0) {
      setImagePreviews(prev => [...prev, ...newSuccessfulPreviews].slice(0, MAX_IMAGES));
      setSuccessMessage(`${newSuccessfulPreviews.length} imagen(es) añadida(s) correctamente.`);
    }
    if (processingErrors.length > 0) {
      setError(processingErrors.join(' '));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productInput.name || !productInput.idea || !productInput.basePrice) {
      setError(`El Nombre del Producto, Precio Base y la Idea son obligatorios.`);
      return;
    }
    setError(null);
    setSuccessMessage(null);

    const currentStatus = productInput.status || ProductStatus.Activo;
    const stockValue = productInput.stock === '' ? undefined : parseInt(productInput.stock || '0', 10);

    const inputForStorage: ProductInput = {
        ...productInput,
        status: currentStatus,
        stock: productInput.stock,
        price: `${calculatedPrices.total.toFixed(2)} ${productInput.currency || 'USD'}`, // Price for AI (final price)
        // basePrice, currency, taxRate, discountRate are already in productInput for storage
    };
    
    if (isEditing && productToEdit) {
      const updatedProduct: Product = {
        id: productToEdit.id,
        createdAt: productToEdit.createdAt,
        name: productInput.name!,
        category: productInput.category!,
        basePrice: productInput.basePrice!,
        currency: productInput.currency!,
        taxRate: productInput.taxRate || undefined,
        discountRate: productInput.discountRate || undefined,
        idea: productInput.idea!,
        videoUrl: productInput.videoUrl || undefined,
        generatedDescription: generatedDescription,
        imagePreviewUrls: imagePreviews,
        status: currentStatus,
        stock: stockValue,
      };
      onUpdateProduct(updatedProduct);
      setSuccessMessage("¡Producto actualizado exitosamente!");
    } else {
      setIsLoadingDescription(true);
      setGeneratedDescription('');
      try {
        const description = await generateProductDescription(inputForStorage); // Pass inputForStorage which has AI-formatted price

        if (isAIServiceError(description)) {
          setError(description);
          setGeneratedDescription(description);
        } else {
          setGeneratedDescription(description);
          onAddProduct({
            input: inputForStorage, // Pass inputForStorage for correct data mapping in App.tsx
            generatedDescription: description,
            imagePreviewUrls: imagePreviews,
            videoUrl: productInput.videoUrl || undefined,
          });
          setSuccessMessage(`¡Descripción generada y producto ${isFirstProductAfterOnboarding ? 'inicial ' : ''}agregado exitosamente!`);
          resetFormFieldsAndState();
        }
      } catch (err) {
        console.error("Error in ProductForm handleMainSubmit during AI call:", err);
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado al contactar el servicio de IA.";
        setError(errorMessage);
        setGeneratedDescription(`Error: ${errorMessage}`);
      } finally {
        setIsLoadingDescription(false);
      }
    }
  };

  const handleGenerateDescriptionForForm = async () => {
    if (!productInput.name || !productInput.idea) {
      setError("El Nombre del Producto y la Idea son obligatorios para generar una descripción.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoadingDescription(true);
    try {
      const productInputForAI = {
        ...productInput,
        price: `${calculatedPrices.total.toFixed(2)} ${productInput.currency || 'USD'}`
      };
      const description = await generateProductDescription(productInputForAI);
      setGeneratedDescription(description);
      if (isAIServiceError(description)) {
        setError(description);
      } else {
        setSuccessMessage("Descripción generada exitosamente para los datos actuales.");
      }
    } catch (err) {
       console.error("Error in ProductForm handleGenerateDescriptionForForm during AI call:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado al contactar el servicio de IA.";
      setError(errorMessage);
      setGeneratedDescription(`Error: ${errorMessage}`);
    } finally {
      setIsLoadingDescription(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (!productInput.name || !productInput.idea) {
      setError("El Nombre del Producto y la Idea son obligatorios para sugerir categorías.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoadingCategories(true);
    setSuggestedCategories([]);
    try {
      const categories = await suggestProductCategories(productInput.name, productInput.idea);
      if (isAIServiceError(categories)) {
        setError(categories[0]);
        setSuggestedCategories([]);
      } else {
        setSuggestedCategories(categories);
        if (categories.length > 0) {
            setSuccessMessage("¡Categorías sugeridas exitosamente!");
        } else {
            setSuccessMessage("No se encontraron sugerencias de categorías específicas.");
        }
      }
    } catch (err) {
      console.error("Error in ProductForm handleSuggestCategories during AI call:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado al contactar el servicio de IA.");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCategorySelection = (category: string) => {
    setProductInput(prev => ({ ...prev, category }));
    setSuggestedCategories([]);
  };

  const handleCopyToClipboard = () => {
    if (generatedDescription && !isAIServiceError(generatedDescription)) {
      navigator.clipboard.writeText(generatedDescription);
      setSuccessMessage("¡Descripción copiada al portapapeles!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (generatedDescription) {
      setError("No se puede copiar un mensaje de error.");
    }
  };

  const handleCancel = () => {
    resetFormFieldsAndState();
    onCancelEdit();
  };
  

  return (
    <div className={`bg-white p-6 sm:p-8 shadow-xl rounded-xl w-full max-w-3xl mx-auto border ${isFirstProductAfterOnboarding ? 'border-primary ring-2 ring-primary/50' : 'border-neutral-200'}`}>
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">
        {isEditing ? `Editando: ${productToEdit.name}` : (isFirstProductAfterOnboarding ? 'Añade tu Primer Producto' : 'Agregar Nuevo Producto')}
      </h2>
      <form onSubmit={handleMainSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            Nombre del Producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={productInput.name}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
            placeholder="Ej: Granos de Café Artesanal"
            required
            aria-required="true"
          />
        </div>

        {/* Image Upload Section */}
        <div>
          <label htmlFor="productImages" className="block text-sm font-medium text-neutral-700 mb-1">
            Imágenes del Producto (Máx. {MAX_IMAGES}, Límite {MAX_FILE_SIZE_MB}MB por imagen)
          </label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
            {imagePreviews.map((previewUrl, index) => (
              <div key={index} className="relative aspect-square border border-neutral-200 rounded-lg overflow-hidden group">
                <img src={previewUrl} alt={`Vista previa ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Quitar imagen ${index + 1}`}
                >
                  <XCircleIcon className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {imagePreviews.length < MAX_IMAGES && (
              <div
                className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center text-neutral-400 hover:border-primary hover:text-primary cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Añadir imagen(es)"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              >
                <PhotoIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          {imagePreviews.length < MAX_IMAGES && (
            <div>
              <input
                type="file"
                id="productImages"
                name="productImages"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleImageChange}
                className="sr-only"
                aria-describedby="image-upload-hint"
                multiple
              />
               <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="block w-full text-sm text-neutral-600 bg-neutral-50 border border-neutral-300 rounded-md py-2 px-3 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                aria-label="Seleccionar archivos de imagen"
              >
                Añadir Imágenes (Restantes: {MAX_IMAGES - imagePreviews.length})
              </button>
            </div>
          )}
          <p id="image-upload-hint" className="mt-1 text-xs text-neutral-500">
            PNG, JPG, GIF, WEBP hasta {MAX_FILE_SIZE_MB}MB. Primera imagen será la principal. Puedes seleccionar varios archivos.
          </p>
        </div>

        {/* Video URL Input Section */}
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-neutral-700 mb-1">
            URL del Video del Producto (Opcional)
          </label>
           <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <VideoCameraIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="url"
              name="videoUrl"
              id="videoUrl"
              value={productInput.videoUrl || ''}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              aria-label="URL del video del producto"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Pega la URL completa de tu video (ej. YouTube, Vimeo). No se permite subir archivos de video directamente.
          </p>
        </div>

        {/* Pricing Section */}
        <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 space-y-4">
            <h3 className="text-md font-semibold text-neutral-700 mb-2 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 text-primary/80" />
                Detalles de Precio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="basePrice" className="block text-xs font-medium text-neutral-600 mb-0.5">
                        Precio Base <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="basePrice"
                        id="basePrice"
                        value={productInput.basePrice || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                        placeholder="Ej: 100.00"
                        required
                        aria-required="true"
                    />
                </div>
                <div>
                    <label htmlFor="currency" className="block text-xs font-medium text-neutral-600 mb-0.5">
                        Moneda <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="currency"
                        id="currency"
                        value={productInput.currency || 'USD'}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
                    >
                        {CURRENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="taxRate" className="block text-xs font-medium text-neutral-600 mb-0.5">
                        IVA (%) (Opcional)
                    </label>
                    <input
                        type="text"
                        name="taxRate"
                        id="taxRate"
                        value={productInput.taxRate || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                        placeholder="Ej: 19"
                    />
                </div>
                <div>
                    <label htmlFor="discountRate" className="block text-xs font-medium text-neutral-600 mb-0.5">
                        Descuento (%) (Opcional)
                    </label>
                    <input
                        type="text"
                        name="discountRate"
                        id="discountRate"
                        value={productInput.discountRate || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                        placeholder="Ej: 10"
                    />
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-200 space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal (Precio+IVA-Descuento):</span>
                    <span className="font-semibold text-neutral-700">{formatPrice(calculatedPrices.subtotal, calculatedPrices.currency)}</span>
                </div>
                <div className="flex justify-between font-bold">
                    <span className="text-neutral-800">Total a Pagar:</span>
                    <span className="text-primary">{formatPrice(calculatedPrices.total, calculatedPrices.currency)}</span>
                </div>
            </div>
        </div>


        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
            Categoría del Producto <span className="text-red-500">*</span>
          </label>
          <div className="flex items-stretch gap-2">
            <select
              name="category"
              id="category"
              value={productInput.category}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm flex-grow"
              aria-label="Seleccionar categoría del producto"
            >
              {PREDEFINED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSuggestCategories}
              disabled={isLoadingCategories || !productInput.name || !productInput.idea}
              className="mt-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg shadow-sm hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150 whitespace-nowrap"
              title="Sugerir categorías basado en nombre e idea"
              aria-label="Sugerir categorías de producto"
            >
              {isLoadingCategories ? <LoadingSpinnerIcon className="w-5 h-5 text-primary" /> : <LightbulbIcon className="w-5 h-5 mr-1 text-yellow-500" />}
              Sugerir
            </button>
          </div>
          {suggestedCategories.length > 0 && !isAIServiceError(suggestedCategories) && (
            <div className="mt-2 space-x-2" role="toolbar" aria-label="Categorías sugeridas">
              <span className="text-xs text-neutral-600">Sugerencias:</span>
              {suggestedCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelection(cat)}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20"
                  aria-label={`Seleccionar categoría: ${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Stock and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-neutral-700 mb-1">
                Cantidad en Stock
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CubeIcon className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                    type="text"
                    name="stock"
                    id="stock"
                    value={productInput.stock || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
                    placeholder="Ej: 100"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    aria-label="Cantidad en stock del producto"
                />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Estado del Producto <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                id="status"
                value={productInput.status || ProductStatus.Activo}
                onChange={handleInputChange}
                className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-white"
                aria-label="Seleccionar estado del producto"
              >
                {PRODUCT_STATUSES.map(statusInfo => (
                  <option key={statusInfo.value} value={statusInfo.value}>{statusInfo.label}</option>
                ))}
              </select>
            </div>
        </div>


        <div>
          <label htmlFor="idea" className="block text-sm font-medium text-neutral-700 mb-1">
            Idea Breve del Producto / Características Clave <span className="text-red-500">*</span>
          </label>
          <textarea
            name="idea"
            id="idea"
            rows={3}
            value={productInput.idea}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
            placeholder="Ej: Origen único, comercio justo, notas intensas a chocolate."
            required
            aria-required="true"
          />
        </div>

        {error && <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
        {successMessage && <div role="status" aria-live="polite" className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-success" /> {successMessage}</div>}

        {isEditing && (
           <div>
            <label htmlFor="generatedDescriptionInput" className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción del Producto (Generada por IA)
            </label>
            <textarea
              name="generatedDescriptionInput"
              id="generatedDescriptionInput"
              rows={4}
              value={generatedDescription}
              onChange={(e) => setGeneratedDescription(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="La descripción generada por IA aparecerá aquí. Puedes editarla."
            />
             <div className="mt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateDescriptionForForm}
                  disabled={isLoadingDescription || !productInput.name || !productInput.idea}
                  className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/50 rounded-md hover:bg-primary/10 disabled:opacity-60 flex items-center"
                >
                  {isLoadingDescription && <LoadingSpinnerIcon className="w-4 h-4 mr-1.5 text-primary" />}
                  Regenerar Descripción
                </button>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={!generatedDescription || isAIServiceError(generatedDescription)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-60 flex items-center"
                >
                  <ClipboardCopyIcon className="w-3.5 h-3.5 mr-1.5" />
                  Copiar
                </button>
             </div>
          </div>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isLoadingDescription || !productInput.name || !productInput.idea || !productInput.basePrice}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoadingDescription && !isEditing && <LoadingSpinnerIcon className="w-5 h-5 mr-2" />}
            {isEditing ? 'Actualizar Detalles del Producto' : (isFirstProductAfterOnboarding ? 'Guardar Primer Producto y Activar Tienda' : 'Generar Descripción y Agregar Producto')}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full flex justify-center items-center py-3 px-4 border border-neutral-300 rounded-lg shadow-sm text-base font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-150"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {!isEditing && generatedDescription && (
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Última Descripción Generada:</h3>
          <div className={`p-4 rounded-lg border text-neutral-700 whitespace-pre-wrap leading-relaxed shadow-sm ${isAIServiceError(generatedDescription) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-neutral-50 border-neutral-200'}`}>
            {generatedDescription}
          </div>
           <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={!generatedDescription || isAIServiceError(generatedDescription)}
            className="mt-4 px-3 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors duration-150 flex items-center disabled:opacity-60"
            aria-label="Copiar descripción generada al portapapeles"
          >
            <ClipboardCopyIcon className="w-4 h-4 mr-2" />
            Copiar Descripción
          </button>
        </div>
      )}
    </div>
  );
};
