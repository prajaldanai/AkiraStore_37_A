/**
 * Search Controller
 * Handles search-related HTTP requests
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Jimp = require("jimp");
const { searchProducts, getSuggestedProducts, searchByImage } = require("../services/search/productSearchService");

const PHASH_DISTANCE_THRESHOLD = 6;

function calculateHammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return Number.MAX_SAFE_INTEGER;

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance += 1;
  }
  return distance;
}

async function getPerceptualHashFromBuffer(buffer) {
  const image = await Jimp.read(buffer);
  return image.hash();
}

async function safePerceptualHash(buffer) {
  try {
    return await getPerceptualHashFromBuffer(buffer);
  } catch (err) {
    console.warn("Could not compute perceptual hash:", err.message);
    return null;
  }
}

/**
 * Search products
 * GET /api/search/products?q=keyword&type=quick|full
 */
async function searchProductsHandler(req, res) {
  try {
    const query = req.searchQuery; // Set by validateSearchQuery middleware
    const type = req.query.type === "full" ? "full" : "quick";

    const result = await searchProducts(query, type);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("searchProductsHandler error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed. Please try again.",
      query: req.searchQuery || "",
      totalResults: 0,
      results: [],
    });
  }
}

/**
 * Get suggested/popular products
 * GET /api/search/suggestions
 */
async function getSuggestionsHandler(req, res) {
  try {
    const suggestions = await getSuggestedProducts();

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("getSuggestionsHandler error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
      suggestions: [],
    });
  }
}

/**
 * Search by uploaded image
 * POST /api/search/image
 * Compares uploaded image with product images using hash-based comparison
 */
async function searchByImageHandler(req, res) {
  let uploadedFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image to search",
        totalResults: 0,
        results: [],
      });
    }

    uploadedFilePath = req.file.path;

    // Calculate hash of uploaded image
    const uploadedImageBuffer = fs.readFileSync(uploadedFilePath);
    const uploadedHash = crypto.createHash("md5").update(uploadedImageBuffer).digest("hex");
    const uploadedPhash = await safePerceptualHash(uploadedImageBuffer);

    // Get optional category hint from request
    const categoryHint = req.body?.categoryHint || null;

    // Get all products with images
    const allProducts = await searchByImage(categoryHint);

    // Compare with product images
    const uploadsDir = path.join(__dirname, "..");  // Backend root
    const matchedProducts = [];
    const matchedProductIds = new Set(); // Track already matched products

    // Get uploaded file info
    const uploadedFileSize = uploadedImageBuffer.length;
    const uploadedFileName = req.file.originalname.toLowerCase();

    console.log("=== IMAGE SEARCH ===");
    console.log("Uploaded image hash:", uploadedHash);
    console.log("Uploaded file size:", uploadedFileSize);
    console.log("Uploaded file name:", uploadedFileName);
    console.log("Total products to check:", allProducts.results.length);

    for (const product of allProducts.results) {
      // Get ALL images for this product (not just the first one)
      const productImages = product.allImages || (product.image ? [product.image] : []);
      
      if (productImages.length === 0) {
        console.log(`\nProduct: "${product.name}" - No images, skipping`);
        continue;
      }

      console.log(`\nProduct: "${product.name}" (ID: ${product.id}) - ${productImages.length} image(s)`);

      // Check each image of the product
      for (let imgIndex = 0; imgIndex < productImages.length; imgIndex++) {
        // Skip if product already matched
        if (matchedProductIds.has(product.id)) {
          console.log(`  Image ${imgIndex + 1}: Skipped (product already matched)`);
          continue;
        }

        let imagePath = productImages[imgIndex];
        
        // Remove leading slash to join properly with backend root
        if (imagePath.startsWith("/")) {
          imagePath = imagePath.substring(1);
        }
        
        const productImagePath = path.join(uploadsDir, imagePath);
        
        if (fs.existsSync(productImagePath)) {
          try {
            const productImageBuffer = fs.readFileSync(productImagePath);
            const productHash = crypto.createHash("md5").update(productImageBuffer).digest("hex");
            const productFileSize = productImageBuffer.length;
            const productPhash = await safePerceptualHash(productImageBuffer);

            console.log(`  Image ${imgIndex + 1}: ${path.basename(imagePath)}`);
            console.log(`    Hash: ${productHash}`);
            console.log(`    Size: ${productFileSize}`);
            console.log(`    Hash match: ${uploadedHash === productHash}`);
            console.log(`    Perceptual hash: ${productPhash}`);
            console.log(
              `    Hamming distance: ${calculateHammingDistance(uploadedPhash, productPhash)}`
            );

            const isExactMatch = uploadedHash === productHash;
            const isPerceptualMatch =
              !isExactMatch &&
              calculateHammingDistance(uploadedPhash, productPhash) <= PHASH_DISTANCE_THRESHOLD;

            if (isExactMatch) {
              console.log(`    ✅ EXACT HASH MATCH!`);
              matchedProducts.push({ ...product, matchScore: 100 });
              matchedProductIds.add(product.id);
              break; // Found match for this product, move to next product
            } else if (isPerceptualMatch) {
              console.log(`    ✱ PERCEPTUAL MATCH`);
              matchedProducts.push({ ...product, matchScore: 90 });
              matchedProductIds.add(product.id);
              break; // Found match for this product, move to next product
            } else {
              console.log(`    ✗ No match`);
            }
          } catch (err) {
            console.warn(`    Could not read product image: ${productImagePath}`, err.message);
          }
        } else {
          console.log(`  Image ${imgIndex + 1}: File not found - ${productImagePath}`);
        }
      }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Exact matches: ${matchedProducts.length}`);

    // Clean up uploaded file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    // If we have exact matches, return ONLY those
    // Otherwise, return similar products as suggestions
    let results;
    let message = null;
    
    if (matchedProducts.length > 0) {
      results = matchedProducts;
      console.log(`Returning ${matchedProducts.length} matched product(s)`);
    } else {
      results = [];
      message = "No matching product image found.";
      console.log(`No matches at all. Returning empty result set`);
    }

    res.json({
      success: true,
      query: "Image Search",
      totalResults: results.length,
      results,
      searchType: "image",
      exactMatches: matchedProducts.length,
      message,
    });
  } catch (error) {
    console.error("searchByImageHandler error:", error);

    // Clean up uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: "Image search failed. Please try again.",
      totalResults: 0,
      results: [],
    });
  }
}

module.exports = {
  searchProductsHandler,
  getSuggestionsHandler,
  searchByImageHandler,
};
