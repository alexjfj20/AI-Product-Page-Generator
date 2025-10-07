
import { Product, CartItem } from './types';

/**
 * Formats a numeric price value into a currency string.
 *
 * @param price - The numeric price to format.
 * @param currencyCode - The ISO 4217 currency code (e.g., "USD", "EUR", "COP").
 * @returns A formatted currency string (e.g., "$1,234.56", "1.234,56 €", "COP 1.234.567").
 */
export const formatPrice = (price: number | string, currencyCode: string): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) {
    return 'Precio Inválido';
  }

  let locale: string;
  // Determine locale based on currency code for specific formatting
  switch (currencyCode.toUpperCase()) {
    case 'USD':
      locale = 'en-US';
      break;
    case 'EUR':
      locale = 'de-DE'; // Using German locale for Euro, common representation
      break;
    case 'COP':
      locale = 'es-CO';
      break;
    default:
      // Fallback for unmapped currencies - format number and append code
      // Uses browser's default locale for number formatting part
      return `${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      // For COP, Intl.NumberFormat with es-CO typically handles 0 decimal places correctly by default if that's standard.
      // Explicitly setting min/max fraction digits can force decimals if needed, but for COP it might be better to let locale default handle.
      // However, to ensure consistency for other currencies that DO use decimals:
      minimumFractionDigits: (currencyCode.toUpperCase() === 'COP') ? 0 : 2,
      maximumFractionDigits: (currencyCode.toUpperCase() === 'COP') ? 0 : 2,
    }).format(numericPrice);
  } catch (e) {
    // If Intl.NumberFormat fails for some reason (e.g. unsupported currency on a very old browser)
    console.warn(`formatPrice: Intl.NumberFormat failed for ${currencyCode}. Falling back. Error:`, e);
    const fallbackDigits = (currencyCode.toUpperCase() === 'COP') ? 0 : 2;
    return `${numericPrice.toLocaleString(undefined, { minimumFractionDigits: fallbackDigits, maximumFractionDigits: fallbackDigits })} ${currencyCode}`;
  }
};


/**
 * Calculates display prices for a product, including final price, original price (if discounted),
 * and discount percentage.
 *
 * @param product - The product object.
 * @returns An object with pricing details.
 */
export const calculateDisplayPrices = (product: Product): {
  finalPrice: number;
  originalPriceForDisplay: number; // Price after tax, before discount
  discountPercentage?: string;
  currency: string;
  hasDiscount: boolean;
} => {
  const base = parseFloat(product.basePrice);
  const taxRatePercent = parseFloat(product.taxRate || '0');
  const discountRatePercent = parseFloat(product.discountRate || '0');

  if (isNaN(base)) {
    // Handle case where basePrice is invalid
    return {
      finalPrice: 0,
      originalPriceForDisplay: 0,
      currency: product.currency || 'USD', // Default currency if product currency is somehow missing
      hasDiscount: false,
    };
  }

  const priceWithTax = base * (1 + taxRatePercent / 100);
  const discountAmount = priceWithTax * (discountRatePercent / 100);
  const finalPrice = priceWithTax - discountAmount;

  const hasDiscount = discountRatePercent > 0 && discountAmount > 0.001; // Consider discount significant

  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)), // Ensure 2 decimal places for consistency in calculations
    originalPriceForDisplay: parseFloat(priceWithTax.toFixed(2)),
    discountPercentage: hasDiscount ? discountRatePercent.toFixed(0) : undefined, // Assuming discount is whole number %
    currency: product.currency,
    hasDiscount,
  };
};


/**
 * Encodes an array of CartItem objects into a base64 string.
 * This is useful for creating shareable cart links.
 *
 * @param cartItems - The array of CartItem objects to encode.
 * @returns A base64 encoded string representing the cart, or an empty string on error.
 */
export const encodeCartToString = (cartItems: CartItem[]): string => {
  try {
    const jsonString = JSON.stringify(cartItems);
    // Use btoa for base64 encoding in browser environments
    return btoa(unescape(encodeURIComponent(jsonString)));
  } catch (error) {
    console.error("Error encoding cart to string:", error);
    return '';
  }
};

/**
 * Decodes a base64 string back into an array of CartItem objects.
 * This is used to parse a shared cart from a URL parameter.
 *
 * @param encodedString - The base64 encoded string representing the cart.
 * @returns An array of CartItem objects if decoding and parsing are successful, otherwise null.
 */
export const decodeCartFromString = (encodedString: string): CartItem[] | null => {
  try {
    // Use atob for base64 decoding in browser environments
    const jsonString = decodeURIComponent(escape(atob(encodedString)));
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      // Basic validation for each item to ensure it resembles a CartItem
      const isValidCart = parsed.every(item =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.productId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'string' && // Price is kept as string in Product/CartItem
        typeof item.quantity === 'number' && item.quantity > 0
        // imagePreviewUrl is optional, so not strictly checked here for existence
      );

      if (isValidCart) {
        return parsed as CartItem[];
      } else {
        console.warn("Decoded cart string contains invalid item structures:", parsed);
        return null;
      }
    }
    console.warn("Decoded cart string is not an array:", parsed);
    return null;
  } catch (error) {
    console.error("Error decoding cart from string:", error, "Input string:", encodedString);
    return null;
  }
};

/**
 * Replaces placeholders in a template string with values from a data object.
 * Placeholders are in the format {key}.
 *
 * @param template - The template string with placeholders.
 * @param data - An object where keys correspond to placeholders and values are their replacements.
 * @returns The string with placeholders replaced.
 */
export const replacePlaceholders = (template: string, data: Record<string, string | number | undefined>): string => {
  let result = template;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const placeholder = `{${key}}`;
      // Ensure data[key] is a string for replacement, or an empty string if undefined
      const replacementValue = data[key] !== undefined ? String(data[key]) : '';
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacementValue);
    }
  }
  return result;
};
