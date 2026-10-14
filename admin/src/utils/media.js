const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "/pragati-api/v1";
const MEDIA_BASE = API_BASE.replace(/\/(api\/)?v1\/?$/, "");

export const resolveMediaUrl = (url) => {
  if (!url) return "";

  let normalized = String(url);
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
      .replace("/pragati-api/pragati-api/", "/pragati-api/")
      .replace("/pragati-api/v1/uploads/", "/pragati-api/uploads/")
      .replace("/api/v1/uploads/", "/uploads/")
      .replace("/v1/uploads/", "/uploads/");
  }

  normalized = normalized
    .replace("/pragati-api/pragati-api/", "/pragati-api/")
    .replace("/pragati-api/v1/uploads/", "/pragati-api/uploads/")
    .replace("/api/v1/uploads/", "/uploads/")
    .replace("/v1/uploads/", "/uploads/");

  if (normalized.startsWith("/pragati-api/")) {
    normalized = normalized.replace(/^\/pragati-api/, "");
  }

  if (normalized.includes("/api/uploads/")) {
    normalized = normalized.replace("/api/uploads/", "/uploads/");
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return `${MEDIA_BASE}${normalized}`;
};
