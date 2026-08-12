// customer-auth.js
// -----------------------------------------------------------------------
// Gère la session d'un client (acheteur) connecté, côté navigateur.
// Même pattern que shop-auth.js et admin-auth.js, avec sa propre clé
// localStorage pour ne jamais se marcher dessus.
// -----------------------------------------------------------------------

const CUSTOMER_SESSION_KEY = 'tradehub_customer_session'; // { token, customer }

function getCustomerSession() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY));
  } catch {
    return null;
  }
}

function setCustomerSession(token, customer) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ token, customer }));
}

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

function isCustomerLoggedIn() {
  return !!getCustomerSession()?.token;
}

function requireCustomerAuth() {
  if (!isCustomerLoggedIn()) {
    window.location.href = 'login-shop.html';
  }
}

// Wrapper autour de fetch() qui ajoute automatiquement le token client
async function customerApiFetch(endpoint, options = {}) {
  const session = getCustomerSession();
  const res = await fetch(`/api/customers${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (res.status === 401) {
    clearCustomerSession();
    window.location.href = 'login-shop.html';
    return;
  }
  if (!res.ok) throw new Error(data.error || `Erreur API (${res.status})`);
  return data;
}
