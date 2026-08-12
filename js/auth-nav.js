// auth-nav.js
// -----------------------------------------------------------------------
// Affiche dans l'en-tête les boutons "Se connecter" / "Créer un compte"
// quand personne n'est connecté. Une fois connecté (client, boutique ou
// admin), ce conteneur reste VIDE : le nom du compte, les raccourcis et
// la déconnexion sont désormais regroupés dans le menu ☰ (voir
// page-nav.js), pour un en-tête plus sobre.
// -----------------------------------------------------------------------

function authNavT(key, fallback) {
  return typeof t === 'function' ? t(key) : fallback;
}

function renderAuthNav() {
  const container = document.getElementById('auth-nav');
  if (!container) return;

  const adminSession = typeof getAdminSession === 'function' ? getAdminSession() : null;
  const shopSession = typeof getShopSession === 'function' ? getShopSession() : null;
  const customerSession = typeof getCustomerSession === 'function' ? getCustomerSession() : null;

  // Une boutique n'achète pas sur TradeHub : pas de panier pour elle.
  const cartLink = document.getElementById('cart-nav-link');
  if (cartLink) {
    cartLink.classList.toggle('hidden', !!shopSession?.token);
  }

  if (adminSession?.token || shopSession?.token || customerSession?.token) {
    container.innerHTML = ''; // tout est dans le menu ☰
    return;
  }

  // Personne n'est connecté : boutons de connexion / inscription
  container.innerHTML = `
    <a href="login-shop.html" class="text-navy hover:text-primary font-medium">${authNavT('nav.login', 'Se connecter')}</a>
    <a href="register-customer.html" class="btn-primary px-4 py-2 rounded-md text-sm">${authNavT('nav.createAccount', 'Créer un compte')}</a>
  `;
}

document.addEventListener('DOMContentLoaded', renderAuthNav);
window.addEventListener('i18n:change', renderAuthNav);
