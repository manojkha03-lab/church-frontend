const normalizeApiUrl = (value = '') => value.trim().replace(/\/+$/, '');

// Prefer VITE_API_URL, but keep backward compatibility with the older key.
export const API_URL = normalizeApiUrl(
	import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
);
