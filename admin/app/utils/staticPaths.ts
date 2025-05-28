/**
 * Utility functions for handling static file paths
 */

/**
 * Get the base URL for static assets based on the current environment
 */
export const getStaticBaseUrl = () => {
  if (import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  return '';
};

/**
 * Resolve a static file path to its full URL
 * @param path The relative path to the static file
 * @returns The full URL to the static file
 */
export const resolveStaticPath = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  // Clean the path by removing leading slashes and normalizing separators
  const cleanPath = path.replace(/^\/+/, '').replace(/\\/g, '/');
  
  // Get the base URL for the current environment
  const baseUrl = getStaticBaseUrl();
  
  // Combine the base URL with the clean path
  return `${baseUrl}/${cleanPath}`;
}; 