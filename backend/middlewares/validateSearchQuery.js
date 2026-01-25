/**
 * Validate Search Query Middleware
 * Validates search query parameters
 */

function validateSearchQuery(req, res, next) {
  const { q } = req.query;

  // Check if query exists
  if (!q || typeof q !== "string") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
      query: "",
      totalResults: 0,
      results: [],
    });
  }

  // Trim and check length
  const trimmedQuery = q.trim();

  if (trimmedQuery.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Search query cannot be empty",
      query: "",
      totalResults: 0,
      results: [],
    });
  }

  if (trimmedQuery.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search query must be at least 2 characters",
      query: trimmedQuery,
      totalResults: 0,
      results: [],
    });
  }

  if (trimmedQuery.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Search query is too long",
      query: trimmedQuery.substring(0, 100),
      totalResults: 0,
      results: [],
    });
  }

  // Sanitize query (remove potentially dangerous characters)
  req.searchQuery = trimmedQuery.replace(/[<>]/g, "");
  
  next();
}

module.exports = validateSearchQuery;
