// cart.js
// -----------------------------------------------------------------------
// Panier "hybride" :
//   - Client connecté  -> panier stocké côté SERVEUR (lié à son compte),
//     donc il survit à une déconnexion/reconnexion, comme sur la plupart
//     des sites marchands.
//   - Personne connectée (invité) -> panier dans le navigateur
//     (localStorage), comme avant.
//
// Toutes les fonctions sont ASYNCHRONES (même le panier local, pour
// garder une seule et même interface partout dans le code) : partout où
// on appelle ces fonctions, il faut utiliser `await`.
// -----------------------------------------------------------------------

const CART_KEY = 'tradehub_cart'; // panier "invité" (localStorage)

function isCustomerLoggedInForCart() {
  return typeof getCustomerSession === 'function' && !!getCustomerSession()?.token;
}

// ---------- Panier invité (localStorage) ----------
function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function saveLocalCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ---------- Panier compte (serveur) ----------
async function cartApiFetch(endpoint, options = {}) {
  const session = typeof getCustomerSession === 'function' ? getCustomerSession() : null;
  const res = await fetch(`/api/cart${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur API (${res.status})`);
  return data;
}

// ---------- API commune (utilisée partout dans le reste du code) ----------

async function getCart() {
  if (isCustomerLoggedInForCart()) {
    try {
      return await cartApiFetch('/');
    } catch {
      return [];
    }
  }
  return getLocalCart();
}

async function addToCart(item) {
  if (isCustomerLoggedInForCart()) {
    await cartApiFetch('/', {
      method: 'POST',
      body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
    });
  } else {
    const cart = getLocalCart();
    const existing = cart.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    saveLocalCart(cart);
  }
  await updateCartBadge();
}

async function updateCartItemQuantity(productId, quantity) {
  if (isCustomerLoggedInForCart()) {
    await cartApiFetch(`/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  } else {
    const cart = getLocalCart();
    const item = cart.find((i) => i.productId === productId);
    if (item) {
      item.quantity = Math.max(item.moq, quantity);
      saveLocalCart(cart);
    }
  }
  await updateCartBadge();
}

async function removeFromCart(productId) {
  if (isCustomerLoggedInForCart()) {
    await cartApiFetch(`/${productId}`, { method: 'DELETE' });
  } else {
    const cart = getLocalCart().filter((i) => i.productId !== productId);
    saveLocalCart(cart);
  }
  await updateCartBadge();
}

// Vide le panier (utilisé après une commande validée)
async function clearCart() {
  if (isCustomerLoggedInForCart()) {
    try {
      await cartApiFetch('/', { method: 'DELETE' });
    } catch {
      // si l'appel échoue, on nettoie quand même le panier invité ci-dessous
    }
  }
  localStorage.removeItem(CART_KEY);
  await updateCartBadge();
}

async function getCartTotal() {
  const cart = await getCart();
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

async function getCartCount() {
  const cart = await getCart();
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

// Met à jour le badge du panier dans le header (présent sur certaines pages)
async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = await getCartCount();
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

// Détecte un vrai rafraîchissement de page (F5, bouton actualiser...),
// à distinguer d'une simple navigation entre deux pages du site (clic sur
// un lien) -- on ne veut vider le panier QUE sur un vrai refresh, sinon
// le panier disparaîtrait à chaque clic, ce qui casserait tout le site.
function isPageReload() {
  try {
    const [entry] = performance.getEntriesByType('navigation');
    return entry?.type === 'reload';
  } catch {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Choix spécifique à ce projet (différent de la norme e-commerce) :
  // sur un rafraîchissement de page, si personne n'est connecté en tant
  // que client, le panier invité repart de zéro.
  if (isPageReload() && !isCustomerLoggedInForCart()) {
    localStorage.removeItem(CART_KEY);
  }
  updateCartBadge();
});
