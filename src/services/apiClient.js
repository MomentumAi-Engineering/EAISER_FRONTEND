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
    description = '',
    address = '',
    zip_code = undefined,
    latitude = 0.0,
    longitude = 0.0,
    user_email = undefined,
    issue_type = 'other',
  }) {
    if (!imageFile || !(imageFile instanceof File)) {
      // Enforce correct usage (image is required and must be a File)
      throw new Error('imageFile is required and must be a File');
    }
    const form = new FormData();
    form.append('image', imageFile);
    form.append('description', description);
    form.append('address', address);
    if (zip_code) form.append('zip_code', zip_code);
    form.append('latitude', String(latitude));
    form.append('longitude', String(longitude));
    if (user_email) form.append('user_email', user_email);
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

  
async analyzeImage(formData) {
  try {
    return await this.request(`/api/ai/analyze-image`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  } catch (err) {
    // Try alias endpoint before client-side fallback
    try {
      return await this.request(`/api/analyze-image`, {
        method: 'POST',
        headers: {},
        body: formData,
      });
    } catch (_) {}
    const key = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;
    const file = formData && typeof formData.get === 'function' ? formData.get('image') : null;
    if (!key || !file || !(file instanceof File)) throw err;
    return await this.clientAnalyzeWithGemini(file, key);
  }
}

async fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      const i = s.indexOf('base64,');
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

async clientAnalyzeWithGemini(file, key) {
  let model =
  (import.meta?.env?.VITE_GEMINI_MODEL) ||
  "gemini-2.0-flash"; // recommended model

  const b64 = await this.fileToBase64(file);
  const prompt = 'Analyze the uploaded image. Identify visible public infrastructure issues strictly from the supported list (pothole, road damage, broken streetlight, graffiti, garbage, vandalism, open drain, blocked drain, flood, fire, illegal construction, tree fallen, public toilet issue, stray animals and variants, noise/air pollution, water leakage, street vendor encroachment, signal malfunction, waterlogging, abandoned vehicle, vacant lot issue). If none found, respond clearly that no public issue was found.';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: file.type || 'image/jpeg', data: b64 } },
        ],
      },
    ],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data === 'string' ? data : data?.error?.message || 'Client-side analyze failed');
  const parts = (((data || {}).candidates || [])[0] || {}).content?.parts || [];
  const text = parts.map(p => p.text || '').join('\n').trim();
  const description = text || 'No description provided';
  const lines = description.split(/\r?\n/);
  const issues = [];
  const labels = [];
  for (const raw of lines) {
    const l = raw.trim().replace(/^[-*•]\s*/, '');
    if (!l) continue;
    if (/issue|risk|problem|damage|hazard/i.test(l)) issues.push(l);
    else if (labels.length < 8) labels.push(l);
  }
  const base = (description.toLowerCase() + ' ' + labels.join(' ').toLowerCase());
  const danger = ['hazard','danger','out of control','emergency','injury','uncontrolled','explosion','collapse','severe','major','wildfire','accident','collision','leak','burst'];
  const controlled = ['campfire','bonfire','bon fire','bbq','barbecue','barbeque','grill','fire pit','controlled burn','festival','celebration','diwali','diya','candle','incense','lamp','stove','kitchen','smoke machine','stage'];
  const minor = ['minor','small','tiny','cosmetic','scratch','smudge','dust','stain','low','no issue','normal','benign'];
  const hasDanger = danger.some(w => base.includes(w));
  const hasControlled = controlled.some(w => base.includes(w));
  const hasMinor = minor.some(w => base.includes(w));
  let confidence = 20;
  if (!issues.length && !hasDanger) confidence = 10;
  else if (hasDanger || (issues.length && !hasControlled)) confidence = 85;
  else if (hasControlled && !hasDanger) confidence = 45;
  else if (hasMinor && !hasDanger) confidence = 80;
  confidence = Math.max(0, Math.min(100, confidence));
  // Derive issue_type for UI fallback
  let issue_type = 'other';
  if (/(roadkill|dead animal|carcass)/i.test(base)) issue_type = 'dead_animal';
  else if (/(pothole|road damage|crack)/i.test(base)) issue_type = 'road_damage';
  else if (/(flood|waterlogging)/i.test(base)) issue_type = 'flood';
  else if (/(leak|burst|pipeline|water leak)/i.test(base)) issue_type = 'water_leakage';
  else if (/(garbage|trash|waste|dump|litter)/i.test(base)) issue_type = 'garbage';
  else if (/(streetlight|street light|lamp post|broken light)/i.test(base)) issue_type = 'broken_streetlight';
  else if (/(fire|smoke|flame|burning)/i.test(base) && !hasControlled) issue_type = 'fire';
  return { status: 'success', description, issues, labels, confidence, issue_type };
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


// testing commit -m