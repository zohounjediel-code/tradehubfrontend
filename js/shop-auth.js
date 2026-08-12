// shop-auth.js
// -----------------------------------------------------------------------
// Gère la session d'une boutique connectée, côté navigateur.
// Le token JWT reçu à la connexion est stocké dans localStorage, puis
// renvoyé au serveur à chaque appel protégé via l'en-tête Authorization.
// -----------------------------------------------------------------------

const SHOP_SESSION_KEY = 'tradehub_shop_session'; // { token, shop }

function getShopSession() {
  try {
    return JSON.parse(localStorage.getItem(SHOP_SESSION_KEY));
  } catch {
    return null;
  }
}

function setShopSession(token, shop) {
  localStorage.setItem(SHOP_SESSION_KEY, JSON.stringify({ token, shop }));
  updateShopNavLink();
}

function clearShopSession() {
  localStorage.removeItem(SHOP_SESSION_KEY);
  updateShopNavLink();
}

function isShopLoggedIn() {
  return !!getShopSession()?.token;
}

// Redirige vers la connexion si aucune boutique n'est connectée.
// À appeler en haut des pages protégées (dashboard, formulaire produit).
function requireShopAuth() {
  if (!isShopLoggedIn()) {
    window.location.href = 'login-shop.html';
  }
}

// Wrapper autour de fetch() qui ajoute automatiquement le token boutique.
// Si `body` est un FormData (upload de fichier), on laisse le navigateur
// définir lui-même le Content-Type (avec la boundary multipart requise) --
// il ne faut surtout pas le forcer à 'application/json' dans ce cas.
async function shopApiFetch(endpoint, options = {}) {
  const session = getShopSession();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers || {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api/shops${endpoint}`, { ...options, headers });

  const data = await res.json();

  // Token expiré ou invalide -> on déconnecte proprement
  if (res.status === 401) {
    clearShopSession();
    window.location.href = 'login-shop.html';
    return;
  }
  if (!res.ok) throw new Error(data.error || `Erreur API (${res.status})`);
  return data;
}

// Met à jour le lien "Devenir fournisseur" / "Mon espace vendeur" dans le header
function updateShopNavLink() {
  const link = document.getElementById('shop-nav-link');
  if (!link) return;
  const session = getShopSession();
  if (session?.shop) {
    link.textContent = `🏪 ${session.shop.shopName}`;
    link.href = 'shop-dashboard.html';
  } else {
    link.textContent = 'Devenir fournisseur';
    link.href = 'register-shop.html';
  }
}

document.addEventListener('DOMContentLoaded', updateShopNavLink);
