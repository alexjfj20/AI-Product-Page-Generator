
import { ProductStatus } from './types';

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const PREDEFINED_CATEGORIES = [
  "Ropa y Accesorios",
  "Alimentos y Bebidas",
  "Tecnología y Electrónicos",
  "Hogar y Jardín",
  "Belleza y Cuidado Personal",
  "Deportes y Aire Libre",
  "Juguetes y Juegos",
  "Libros y Multimedia",
  "Servicios",
  "Otro",
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: ProductStatus.Activo, label: "Activo" },
  { value: ProductStatus.Inactivo, label: "Inactivo" },
  { value: ProductStatus.Agotado, label: "Agotado" },
];
