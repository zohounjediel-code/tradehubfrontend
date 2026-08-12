// page-nav.js
// -----------------------------------------------------------------------
// Menu de navigation déroulant (icône ☰), injecté directement dans la
// ligne de l'en-tête de CHAQUE page -- sur la même ligne que la barre de
// recherche quand il y en a une.
//
// Contenu toujours présent : Retour, Accueil, Catalogue, Comment
// commander, Centre d'aide, Contact.
// Contenu ajouté si quelqu'un est connecté (client, boutique ou admin) :
// ses raccourcis (ex. "Mes commandes" pour un client), puis "Retour au
// catalogue" juste avant "Déconnexion".
//
// Ce script lit directement les sessions dans localStorage (sans passer
// par shop-auth.js / admin-auth.js / customer-auth.js) pour fonctionner
// de façon autonome sur TOUTES les pages, y compris celles qui ne
// chargent pas ces scripts-là.
// -----------------------------------------------------------------------

const PAGE_NAV_SESSION_KEYS = {
  admin: 'tradehub_admin_session',
  shop: 'tradehub_shop_session',
  customer: 'tradehub_customer_session',
};

const PAGE_NAV_ROLE_LINKS = {
  shop: [
    { href: 'shop-dashboard.html', label: '🏪 Mon espace vendeur' },
    { href: 'shop-orders.html', label: '📦 Commandes' },
    { href: 'shop-profile.html', label: 'ℹ️ Mes informations' },
  ],
  admin: [
    { href: 'admin-dashboard.html', label: '🛡️ Boutiques' },
    { href: 'admin-orders.html', label: '📦 Commandes' },
    { href: 'admin-messages.html', label: '✉️ Messages' },
  ],
};

const PAGE_NAV_LINKS = [
  { href: 'index.html', label: '🏠 Accueil' },
  { href: 'index.html#products', label: '🛍️ Catalogue' },
  { href: 'how-to-order.html', label: '📦 Comment commander' },
  { href: 'help-center.html', label: "❓ Centre d'aide" },
  { href: 'contact.html', label: '✉️ Contact' },
];

function pageNavGetSession(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

// Renvoie { role, session } pour le premier compte connecté trouvé
// (admin > boutique > client), ou null si personne n'est connecté.
function pageNavGetActiveSession() {
  for (const role of ['admin', 'shop', 'customer']) {
    const session = pageNavGetSession(PAGE_NAV_SESSION_KEYS[role]);
    if (session?.token) return { role, session };
  }
  return null;
}

function pageNavLogout(role) {
  localStorage.removeItem(PAGE_NAV_SESSION_KEYS[role]);
  window.location.href = 'index.html';
}

// Trouve où insérer le menu dans la ligne d'en-tête, sans casser sa mise
// en page actuelle.
function getInjectionTarget(row) {
  // Cas 1 : il existe déjà un cluster de liens à droite (hors #auth-nav,
  // réécrit dynamiquement par un autre script et jamais à toucher ici).
  const existingCluster = row.querySelector(':scope > div.flex:not(#auth-nav)');
  if (existingCluster) return existingCluster;

  // Cas 2 : la ligne a plusieurs enfants -- on regroupe le dernier
  // élément existant avec notre menu dans un nouveau conteneur flex, pour
  // ne pas casser sa répartition actuelle (ex. justify-between).
  if (row.children.length > 1) {
    const lastChild = row.lastElementChild;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-3 shrink-0';
    row.insertBefore(wrapper, lastChild);
    wrapper.appendChild(lastChild);
    return wrapper;
  }

  // Cas 3 (rare) : un seul enfant dans la ligne -- on ajoute directement.
  return row;
}

function pageNavBackButtonHTML() {
  return `
    <button id="page-nav-back" type="button" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Retour
    </button>
  `;
}

function pageNavLinkHTML(l) {
  return `<a href="${l.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">${l.label}</a>`;
}

function pageNavLogoutButtonHTML() {
  return `<button id="page-nav-logout" type="button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Déconnexion</button>`;
}

function pageNavDropdownHTML(active) {
  // Personne connecté : Retour, puis les liens généraux du site.
  if (!active) {
    return `
      ${pageNavBackButtonHTML()}
      <div class="border-t border-gray-100 my-1"></div>
      ${PAGE_NAV_LINKS.map(pageNavLinkHTML).join('')}
    `;
  }

  // Client connecté : Retour, Accueil, Catalogue, Mes commandes, Mon
  // compte, Comment commander, Centre d'aide, Contact, Déconnexion.
  if (active.role === 'customer') {
    return `
      ${pageNavBackButtonHTML()}
      <div class="border-t border-gray-100 my-1"></div>
      ${pageNavLinkHTML({ href: 'index.html', label: '🏠 Accueil' })}
      ${pageNavLinkHTML({ href: 'index.html#products', label: '🛍️ Catalogue' })}
      ${pageNavLinkHTML({ href: 'my-orders.html', label: '📦 Mes commandes' })}
      ${pageNavLinkHTML({ href: 'customer-account.html', label: '👤 Mon compte' })}
      ${pageNavLinkHTML({ href: 'how-to-order.html', label: '📦 Comment commander' })}
      ${pageNavLinkHTML({ href: 'help-center.html', label: "❓ Centre d'aide" })}
      ${pageNavLinkHTML({ href: 'contact.html', label: '✉️ Contact' })}
      <div class="border-t border-gray-100 my-1"></div>
      ${pageNavLogoutButtonHTML()}
    `;
  }

  // Boutique ou admin connecté(e) : Retour, uniquement leurs raccourcis
  // de travail (pas les liens généraux du catalogue), puis Déconnexion.
  const roleLinks = (PAGE_NAV_ROLE_LINKS[active.role] || []).map(pageNavLinkHTML).join('');
  return `
    ${pageNavBackButtonHTML()}
    <div class="border-t border-gray-100 my-1"></div>
    ${roleLinks}
    <div class="border-t border-gray-100 my-1"></div>
    ${pageNavLogoutButtonHTML()}
  `;
}

function renderPageNav() {
  const header = document.querySelector('header');
  if (!header) return;
  const row = header.querySelector(':scope > div');
  if (!row) return;

  const active = pageNavGetActiveSession();
  const target = getInjectionTarget(row);

  const menuWrapper = document.createElement('div');
  menuWrapper.className = 'relative shrink-0';
  menuWrapper.innerHTML = `
    <button id="page-nav-toggle" type="button" aria-label="Menu de navigation"
      class="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-md hover:bg-black/5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div id="page-nav-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 text-left">
      ${pageNavDropdownHTML(active)}
    </div>
  `;

  target.appendChild(menuWrapper);

  const toggleBtn = document.getElementById('page-nav-toggle');
  const dropdown = document.getElementById('page-nav-dropdown');

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!menuWrapper.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  document.getElementById('page-nav-back').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  const logoutBtn = document.getElementById('page-nav-logout');
  if (logoutBtn && active) {
    logoutBtn.addEventListener('click', () => pageNavLogout(active.role));
  }
}

document.addEventListener('DOMContentLoaded', renderPageNav);
