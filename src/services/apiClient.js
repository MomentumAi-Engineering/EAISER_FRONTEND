// ApiClient: A modular, OOP-style frontend client to talk to backend
// - Reads base URL from Vite env (`VITE_API_BASE_URL`) with safe fallback
// - Provides reusable methods for issues and reports APIs
// - Uses fetch with sensible defaults and error handling

class ApiClient {
  // Constructor sets base URL and common headers
  constructor(baseURL) {
    // Prefer env-configured base URL, fallback to localhost:8000 for dev
    const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL;
    this.baseURL = (baseURL || envBase || 'http://localhost:8000').replace(/\/$/, ''); // trim trailing slash

    // Common headers for JSON requests (multipart handled per-request)
    this.defaultHeaders = {
      Accept: 'application/json',
    };
  }

  // Helper: build absolute URL for a given path
  url(path) {
    return `${this.baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Helper: generic request wrapper with error handling
  async request(path, { method = 'GET', headers = {}, body = undefined } = {}) {
    const res = await fetch(this.url(path), {
      method,
      headers: { ...this.defaultHeaders, ...headers },
      body,
      credentials: 'include', // allow cookies/session if backend uses them
    });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      // Throw structured error for callers to handle
      throw new Error(typeof data === 'string' ? data : data?.detail || 'Request failed');
    }
    return data;
  }

  // Issues: create a new issue with image upload and metadata
  async createIssue({
    imageFile, // File (required)
    address = '',
    zip_code = undefined,
    latitude = 0.0,
    longitude = 0.0,
    user_email = undefined,
    category = 'public',
    severity = 'medium',
    issue_type = 'other',
  }) {
    if (!imageFile || !(imageFile instanceof File)) {
      // Enforce correct usage (image is required and must be a File)
      throw new Error('imageFile is required and must be a File');
    }
    const form = new FormData();
    form.append('image', imageFile);
    form.append('address', address);
    if (zip_code) form.append('zip_code', zip_code);
    form.append('latitude', String(latitude));
    form.append('longitude', String(longitude));
    if (user_email) form.append('user_email', user_email);
    form.append('category', category);
    form.append('severity', severity);
    form.append('issue_type', issue_type);

    // POST /api/issues (FastAPI router)
    return this.request('/api/issues', {
      method: 'POST',
      headers: { /* FormData sets its own Content-Type */ },
      body: form,
    });
  }

  // Reports: public optimized report endpoint without auth (from main.py)
  async getPublicReport({ report_type = 'performance', format = 'json', cache_ttl = 300, use_cache = true }) {
    const params = new URLSearchParams({
      report_type,
      format,
      cache_ttl: String(cache_ttl),
      use_cache: String(use_cache),
    });
    return this.request(`/api/report?${params.toString()}`);
  }

  // Reports: secured generate endpoint (requires auth via token header)
  async generateReport({ report_type, format = 'json', priority = 2, cache_ttl = 300, filters = {}, template = undefined }, token) {
    const payload = {
      report_type,
      format,
      priority,
      cache_ttl,
      filters,
      template,
    };
    return this.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify(payload),
    });
  }

  
async analyzeImage(formData, opts = {}) {
  const fast = opts.fast ? '?fast=true' : '';
  return this.request(`/api/ai/analyze-image${fast}`, {
    method: 'POST',
    headers: {},
    body: formData,
  });
}


  async getAuthoritiesByZip(zip_code) {
    return this.request(`/api/authorities/${encodeURIComponent(zip_code)}`);
  }

  async submitIssue(issue_id, selected_authorities, edited_report = undefined) {
    const payload = {
      selected_authorities,
      edited_report,
    };
    return this.request(`/api/issues/${encodeURIComponent(issue_id)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async health() {
    return this.request('/health');
  }

  async dbHealth() {
    return this.request('/db-health');
  }

  async declineIssue(issue_id, reason = 'user_declined') {
    const payload = { reason };
    return this.request(`/api/issues/${encodeURIComponent(issue_id)}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

// Export a default singleton for convenience, and the class for advanced use
const apiClient = new ApiClient();
export default apiClient;
export { ApiClient };