/**
 * Converts a backend image URL to a proxied frontend URL
 * Backend format: /api/v1/products/images/PROD02/e13700a6-31fc-47b2-83cc-f6a7c51bd5d3.png
 * Proxy format: /api/images/PROD02/e13700a6-31fc-47b2-83cc-f6a7c51bd5d3.png
 * 
 * This hides the backend IP address from the client and allows for image caching
 * and optimization at the frontend level.
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "";
  }

  // If it's already a proxied URL, return as-is
  if (imageUrl.startsWith("/api/images/")) {
    return imageUrl;
  }

  // Extract the image path from backend URLs
  // Match both absolute URLs and paths
  const pathMatch = imageUrl.match(/\/api\/v1\/products\/images\/(.+)$/);
  
  if (pathMatch && pathMatch[1]) {
    return `/api/images/${pathMatch[1]}`;
  }

  // If it's a relative path starting with /, return as-is (might already be proxied or relative)
  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  // Default: return the original URL (shouldn't normally reach here)
  return imageUrl;
}

/**
 * Converts an array of backend image URLs to proxied frontend URLs
 */
export function getProxiedImageUrls(imageUrls: string[] | null | undefined): string[] {
  if (!imageUrls || !Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls.map(getProxiedImageUrl);
}
