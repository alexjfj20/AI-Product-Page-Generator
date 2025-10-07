
import React from 'react';
import { Product, ProductStatus } from '../types'; // Importar ProductStatus
import { ProductCard } from './ProductCard';
import { ArchiveIcon, SearchIcon } from './icons'; // SearchIcon for filtered empty state
import { ActiveFilters } from './ProductFilterControls'; // Import ActiveFilters

interface ProductListProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (product: Product) => void;
  onUpdateProductStatus: (productId: string) => void; // Nueva prop
  activeFilters: ActiveFilters; 
}

export const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  onEditProduct, 
  onDeleteProduct, 
  onDuplicateProduct, 
  onUpdateProductStatus, // Recibir la nueva prop
  activeFilters 
}) => {
  const isFiltering = activeFilters.searchTerm || activeFilters.category || activeFilters.status;

  if (products.length === 0) {
    if (isFiltering) {
      return (
        <section aria-labelledby="products-heading" className="w-full max-w-3xl mt-10 text-center p-8 bg-white rounded-xl shadow-lg border border-neutral-200">
          <SearchIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" strokeWidth={1} />
          <h2 id="products-heading" className="text-2xl font-semibold text-neutral-700 mb-2">No se Encontraron Productos</h2>
          <p className="text-neutral-500">
            Intenta ajustar tus criterios de búsqueda o filtros, o usa el botón "Limpiar Filtros".
          </p>
        </section>
      );
    }
    return (
      <section aria-labelledby="products-heading" className="w-full max-w-3xl mt-10 text-center p-8 bg-white rounded-xl shadow-lg border border-neutral-200">
        <ArchiveIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h2 id="products-heading" className="text-2xl font-semibold text-neutral-700 mb-2">Tu Lista de Productos está Vacía</h2>
        <p className="text-neutral-500">
          Usa el formulario de arriba para generar descripciones y agregar tu primer producto. Aparecerán aquí.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="products-heading" className="w-full max-w-4xl mt-10">
      <h2 id="products-heading" className="text-2xl sm:text-3xl font-semibold text-neutral-800 mb-6 text-center sm:text-left">
        {isFiltering ? `Resultados de la Búsqueda (${products.length})` : `Productos Gestionados (${products.length})`}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
            onDuplicate={onDuplicateProduct}
            onUpdateStatus={onUpdateProductStatus} // Pasar la nueva prop
          />
        ))}
      </div>
    </section>
  );
};
