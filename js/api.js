// api.js
// -----------------------------------------------------------------------
// Petite couche pour appeler l'API backend depuis le navigateur.
// Comme le frontend est servi PAR le même serveur Express, on peut
// utiliser des chemins relatifs ("/api/...").
// -----------------------------------------------------------------------

const API_BASE = `${BACKEND_URL}/api`;

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Erreur API (${res.status})`);
  return res.json();
}

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur API (${res.status})`);
  return data;
}

const api = {
  getCategories: () => apiGet('/categories'),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiGet(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (slug) => apiGet(`/products/${slug}`),
};
