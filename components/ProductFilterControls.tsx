import React from 'react';
import { ProductStatus } from '../types';
import { PREDEFINED_CATEGORIES, PRODUCT_STATUSES } from '../constants';
import { SearchIcon, XCircleIcon } from './icons';

export interface ActiveFilters {
  searchTerm: string;
  category: string;
  status: string;
  sortOrder: string; // Nuevo campo para el orden
}

interface ProductFilterControlsProps {
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
}

const sortOptions = [
  { value: 'date-desc', label: 'Más Recientes' },
  { value: 'date-asc', label: 'Más Antiguos' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'price-asc', label: 'Precio (Menor a Mayor)' },
  { value: 'price-desc', label: 'Precio (Mayor a Menor)' },
];

export const ProductFilterControls: React.FC<ProductFilterControlsProps> = ({
  activeFilters,
  onFilterChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...activeFilters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      category: '',
      status: '',
      sortOrder: 'date-desc', // Restablecer al valor por defecto
    });
  };

  const areFiltersApplied = activeFilters.searchTerm || activeFilters.category || activeFilters.status || activeFilters.sortOrder !== 'date-desc';

  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-neutral-200 w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-end">
        {/* Search Term */}
        <div className="lg:col-span-1">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-neutral-700 mb-1">
            Buscar Producto
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              name="searchTerm"
              id="searchTerm"
              value={activeFilters.searchTerm}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm placeholder-neutral-400"
              placeholder="Nombre o idea..."
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-1">
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
            Categoría
          </label>
          <select
            name="category"
            id="category"
            value={activeFilters.category}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2.5 border border-neutral-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">Todas las Categorías</option>
            {PREDEFINED_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-1">
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
            Estado
          </label>
          <select
            name="status"
            id="status"
            value={activeFilters.status}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2.5 border border-neutral-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">Todos los Estados</option>
            {PRODUCT_STATUSES.map(statusInfo => (
              <option key={statusInfo.value} value={statusInfo.value}>{statusInfo.label}</option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="lg:col-span-1">
          <label htmlFor="sortOrder" className="block text-sm font-medium text-neutral-700 mb-1">
            Ordenar por
          </label>
          <select
            name="sortOrder"
            id="sortOrder"
            value={activeFilters.sortOrder}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2.5 border border-neutral-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
       {areFiltersApplied && (
         <div className="mt-4 flex justify-end">
            <button
                onClick={clearFilters}
                className="flex items-center text-xs text-primary hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-primary/10 transition-colors"
                title="Limpiar todos los filtros y orden"
            >
                <XCircleIcon className="w-4 h-4 mr-1 text-primary/80" />
                Limpiar Filtros y Orden
            </button>
         </div>
        )}
    </div>
  );
};