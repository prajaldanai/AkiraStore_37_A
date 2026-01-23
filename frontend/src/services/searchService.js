/**
 * Search Service
 * API calls for product search
 */

const API_BASE = "http://localhost:5000/api";

/**
 * Search products
 * @param {string} query - Search keyword
 * @param {string} type - "quick" (6 results) or "full" (all results)
 * @returns {Promise<Object>}
 */
export async function searchProducts(query, type = "quick") {
  try {
    const params = new URLSearchParams({
      q: query,
      type,
    });

    const response = await fetch(`${API_BASE}/search/products?${params}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        query,
        totalResults: 0,
        results: [],
        message: data.message || "Search failed",
      };
    }

    return data;
  } catch (error) {
    console.error("searchProducts error:", error);
    return {
      success: false,
      query,
      totalResults: 0,
      results: [],
      message: "Network error. Please try again.",
    };
  }
}

/**
 * Get search suggestions
 * @returns {Promise<Object>}
 */
export async function getSearchSuggestions() {
  try {
    const response = await fetch(`${API_BASE}/search/suggestions`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        suggestions: [],
      };
    }

    return data;
  } catch (error) {
    console.error("getSearchSuggestions error:", error);
    return {
      success: false,
      suggestions: [],
    };
  }
}

/**
 * Search products by image
 * @param {File} imageFile - The image file to search with
 * @param {string} categoryHint - Optional category hint
 * @returns {Promise<Object>}
 */
export async function searchByImage(imageFile, categoryHint = null) {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (categoryHint) {
      formData.append("categoryHint", categoryHint);
    }

    const response = await fetch(`${API_BASE}/search/image`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        totalResults: 0,
        results: [],
        message: data.message || "Image search failed",
      };
    }

    return data;
  } catch (error) {
    console.error("searchByImage error:", error);
    return {
      success: false,
      totalResults: 0,
      results: [],
      message: "Network error. Please try again.",
    };
  }
}

export default {
  searchProducts,
  getSearchSuggestions,
  searchByImage,
};
