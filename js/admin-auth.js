// admin-auth.js
// -----------------------------------------------------------------------
// Gère la session d'un administrateur, côté navigateur.
// Complètement séparé de shop-auth.js (clé localStorage différente) pour
// qu'une session boutique et une session admin ne se marchent jamais dessus.
// -----------------------------------------------------------------------

const ADMIN_SESSION_KEY = 'tradehub_admin_session'; // { token, admin }

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return null;
  }
}

function setAdminSession(token, admin) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token, admin }));
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function isAdminLoggedIn() {
  return !!getAdminSession()?.token;
}

// Redirige vers la connexion admin si personne n'est connecté.
function requireAdminAuth() {
  if (!isAdminLoggedIn()) {
    window.location.href = 'admin-login.html';
  }
}

// Wrapper autour de fetch() qui ajoute automatiquement le token admin
async function adminApiFetch(endpoint, options = {}) {
  const session = getAdminSession();
  const res = await fetch(`${BACKEND_URL}/api/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (res.status === 401) {
    clearAdminSession();
    window.location.href = 'admin-login.html';
    return;
  }
  if (!res.ok) throw new Error(data.error || `Erreur API (${res.status})`);
  return data;
}
