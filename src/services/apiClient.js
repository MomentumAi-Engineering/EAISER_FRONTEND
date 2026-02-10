// ApiClient: A modular, OOP-style frontend client to talk to backend
// - Reads base URL from Vite env (`VITE_API_BASE_URL`) with safe fallback
// - Provides reusable methods for issues and reports APIs
// - Uses fetch with sensible defaults and error handling

class ApiClient {
  // Constructor sets base URL and common headers
  constructor(baseURL) {
    // Prefer env-configured base URL, fallback to 127.0.0.1:8000 for dev (fixes Node 18+ IPv6 issues)
    const envApi =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE_URL;

    const isDev =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.DEV;

    this.baseURL = (
      baseURL ||
      envApi ||
      (isDev
        ? 'http://localhost:8000'
        : 'https://eaiser-backend-rf95.onrender.com')
    ).replace(/\/$/, '');


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
      const message = typeof data === 'string' ? data : data?.detail || 'Request failed';
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  // Helper: generic GET
  async get(path, headers = {}) {
    return this.request(path, { method: 'GET', headers: { ...this.defaultHeaders, ...headers } });
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
    if (!imageFile && issue_type !== 'Manual Report') {
      // Only enforce image if NOT a manual report (though backend handles this too)
      // For now, we allow null imageFile to be passed through
    }
    const form = new FormData();
    if (imageFile) {
      form.append('image', imageFile);
    }
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
      } catch (_) { }
      const key = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.GEMINI_API_KEY;
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
    const danger = ['hazard', 'danger', 'out of control', 'emergency', 'injury', 'uncontrolled', 'explosion', 'collapse', 'severe', 'major', 'wildfire', 'accident', 'collision', 'leak', 'burst'];
    const controlled = ['campfire', 'bonfire', 'bon fire', 'bbq', 'barbecue', 'barbeque', 'grill', 'fire pit', 'controlled burn', 'controlled fire', 'festival', 'celebration', 'diwali', 'diya', 'candle', 'incense', 'lamp', 'stove', 'kitchen', 'smoke machine', 'stage'];
    const minor = ['minor', 'small', 'tiny', 'cosmetic', 'scratch', 'smudge', 'dust', 'stain', 'low', 'no issue', 'normal', 'benign'];

    const isFake = /(fake|cartoon|video game|ai generated|screenshot|drawing|art)/i.test(base);

    const hasDanger = danger.some(w => base.includes(w));
    const hasControlled = controlled.some(w => base.includes(w));
    const hasMinor = minor.some(w => base.includes(w));

    let confidence = 20;
    if (isFake) {
      confidence = 0;
    } else if (!issues.length && !hasDanger) {
      confidence = 10;
    } else if (hasDanger || (issues.length && !hasControlled)) {
      confidence = 85;
    } else if (hasControlled && !hasDanger) {
      confidence = 40;
    } else if (hasMinor && !hasDanger) {
      confidence = 80;
    }

    if (isFake) {
      // Force issue type to unknown or none
    }

    confidence = Math.max(0, Math.min(100, confidence));
    // Derive issue_type for UI fallback
    let issue_type = 'other';
    if (isFake) issue_type = 'unknown';
    else if (/(roadkill|dead animal|carcass)/i.test(base)) issue_type = 'dead_animal';
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

  // User Dashboard
  async getMyIssues() {
    return this.request('/api/issues/my-issues', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }

  // --- Admin Review API ---

  async getPendingReviews() {
    return this.request('/api/admin/review/pending', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async getResolvedReviews() {
    return this.request('/api/admin/review/resolved-strict', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async adminLogin(email, password, code = undefined) {
    const payload = { email, password };
    if (code) payload.code = code;

    return this.request('/api/admin/review/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async changePassword(current_password, new_password) {
    return this.request('/api/admin/review/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ current_password, new_password }),
    });
  }

  async setup2FA(email, method = 'totp') {
    return this.request('/api/admin/review/2fa/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ email, method }),
    });
  }

  async verify2FA(code, session_token, email) {
    return this.request('/api/admin/review/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ code, session_token, email }),
    });
  }

  async disable2FA() {
    return this.request('/api/admin/review/2fa/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async getAdmins() {
    return this.request('/api/admin/review/list', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async createAdmin(adminData) {
    return this.request('/api/admin/review/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(adminData),
    });
  }

  async deleteAdmin(adminId) {
    return this.request(`/api/admin/review/delete/${adminId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async deactivateAdmin(adminId) {
    return this.request(`/api/admin/review/deactivate-admin/${adminId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async reactivateAdmin(adminId) {
    return this.request(`/api/admin/review/reactivate-admin/${adminId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }


  async approveIssueAdmin(issue_id, admin_id = 'admin', notes = '', new_authority_email = null, new_authority_name = null) {
    const payload = {
      issue_id,
      admin_id,
      notes,
      new_authority_email,
      new_authority_name
    };
    return this.request('/api/admin/review/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken') || 'demo_token'}`
      },
      body: JSON.stringify(payload),
    });
  }

  async declineIssueAdmin(issue_id, admin_id = 'admin', notes = '') {
    const payload = { issue_id, admin_id, notes };
    return this.request('/api/admin/review/decline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload),
    });
  }

  // Ticket 4: New Status
  async setIssueStatus(issue_id, status, admin_id = 'admin', notes = '') {
    return this.request('/api/admin/review/set-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ issue_id, status, admin_id, notes })
    });
  }

  // Ticket 5: Enhanced Deactivate User
  async deactivateUser(user_email, reason, admin_id = 'admin', issue_id = null, force_confirm = false) {
    const payload = { user_email, reason, admin_id, issue_id, force_confirm };
    return this.request('/api/admin/review/deactivate-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload),
    });
  }

  async updateReport(issue_id, summary, issue_type, confidence) {
    const payload = { issue_id };
    if (summary) payload.summary = summary;
    if (issue_type) payload.issue_type = issue_type;
    if (confidence !== undefined) payload.confidence = confidence;

    return this.request('/api/admin/review/update-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload),
    });
  }

  // ============================================
  // TEAM MANAGEMENT METHODS
  // ============================================

  async getAdmins() {
    return this.request('/api/admin/review/list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async createAdmin(adminData) {
    return this.request('/api/admin/review/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(adminData)
    });
  }

  async assignIssue(issueId, adminEmail) {
    return this.request('/api/admin/review/assign-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ issue_id: issueId, admin_email: adminEmail })
    });
  }

  async bulkAssignIssues(issueIds, adminEmail) {
    return this.request('/api/admin/review/bulk-assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ issue_ids: issueIds, admin_email: adminEmail })
    });
  }

  async getMyAssignedIssues() {
    return this.request('/api/admin/review/my-assigned-issues', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  async getAdminStats() {
    return this.request('/api/admin/review/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }
  async updateIssueReport(issue_id, summary, issue_type, confidence) {
    const payload = { issue_id };
    if (summary) payload.summary = summary;
    if (issue_type) payload.issue_type = issue_type;
    if (confidence !== undefined) payload.confidence = confidence;

    return this.request('/api/admin/review/update-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload),
    });
  }

  // --- Admin Mapping Review ---

  async getUnmappedIssues(resolved = false) {
    return this.request(`/api/admin/review/mapping-review?resolved=${resolved}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async resolveMapping(review_id, issue_type, mapped_departments) {
    if (!Array.isArray(mapped_departments)) mapped_departments = [mapped_departments];
    return this.request(`/api/admin/review/mapping-review/${review_id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ issue_type, mapped_departments })
    })
  }

  // --- Authority Management (Zip Codes) ---

  async getAuthorities() {
    return this.request('/api/admin/review/authorities', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async updateAuthority(zip_code, data) {
    return this.request('/api/admin/review/authorities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ zip_code, data })
    });
  }

  async getAllMappings() {
    return this.request('/api/admin/review/mappings', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async updateMapping(issue_type, departments) {
    return this.request('/api/admin/review/mappings/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ issue_type, departments })
    });
  }

  async getMappingStats() {
    return this.request('/api/admin/review/stats/mapping', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async getMappingHistory() {
    return this.request('/api/admin/review/mapping-history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }
  async getUsers(params = {}) {
    // Build query string
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users/list?${query}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
  }

  async toggleUserStatus(user_id, is_active, reason = '') {
    return this.request('/api/admin/users/toggle-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ user_id, is_active, reason })
    });
  }

  async deleteUser(user_id) {
    return this.request(`/api/admin/users/delete/${user_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
  }

  // --- Authority Actions (Step 1) ---

  async getAuthorityIssue(token) {
    return this.request(`/api/authority-action/validate/${token}`, {
      method: 'GET'
    });
  }

  async updateAuthorityIssue(token, status, notes = '') {
    return this.request(`/api/authority-action/update/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
  }
}

// Export a default singleton for convenience, and the class for advanced use
const apiClient = new ApiClient();
export default apiClient;
export { ApiClient };


// testing commit -m