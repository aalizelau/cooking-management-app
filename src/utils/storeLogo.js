import costcoLogo from '../assets/costco-logos.jpg';
import igaLogo from '../assets/IGA_logo.svg.png';
import metroLogo from '../assets/metro-inc-logo-png_seeklogo-467832.png';
import saveOnFoodsLogo from '../assets/save-on-food-logo.jpg';
import tntLogo from '../assets/T_T_Supermarkets_T_T_SUPERMARKETS_OPENS_THE_DOORS_TO_LATEST_LOCA.jpg';
import walmartLogo from '../assets/walmart_2025_logo_before_after-1.png';
import wholeFoodsLogo from '../assets/Whole_Foods_Market_201x_logo.svg.png';

const STORE_LOGOS = {
    'costco': costcoLogo,
    'iga': igaLogo,
    'metro': metroLogo,
    'save-on-foods': saveOnFoodsLogo,
    'saveonfood': saveOnFoodsLogo, // Handle existing data
    't&t': tntLogo,
    'walmart': walmartLogo,
    'whole foods': wholeFoodsLogo,
    'wholefood': wholeFoodsLogo, // Handle existing data
};

/**
 * Get the logo URL for a store name
 * @param {string} storeName - The name of the store
 * @returns {string|null} - The logo URL or null if not found
 */
export const getStoreLogo = (storeName) => {
    if (!storeName || typeof storeName !== 'string') {
        return null;
    }

    // Normalize the store name (lowercase, trim)
    const normalized = storeName.toLowerCase().trim();

    // Direct match
    if (STORE_LOGOS[normalized]) {
        return STORE_LOGOS[normalized];
    }

    // Partial match - check if any key is contained in the store name
    // This helps if the store name is "Costco Wholesale" but we have "costco"
    for (const [key, logo] of Object.entries(STORE_LOGOS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return logo;
        }
    }

    return null;
};

/**
 * Get initials from store name for fallback display
 * @param {string} storeName - The name of the store
 * @returns {string} - Initials (max 2 characters)
 */
export const getStoreInitials = (storeName) => {
    if (!storeName) return 'ST';

    const words = storeName.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return words
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};
