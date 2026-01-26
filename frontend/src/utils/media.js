const MEDIA_BASE = process.env.REACT_APP_MEDIA_URL || "http://localhost:5000";

export function buildImageUrl(imagePath) {
  if (!imagePath) return null;
  const normalized = String(imagePath).replace(/\\/g, "/");
  if (normalized.startsWith("http")) {
    return normalized;
  }
  return `${MEDIA_BASE}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}
