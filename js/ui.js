// ui.js
// -----------------------------------------------------------------------
// Fonctions d'affichage réutilisées sur plusieurs pages.
//
// Ce fichier est chargé à la fois sur des pages traduites (acheteur, avec
// js/i18n.js) et des pages back-office non traduites (admin/boutique,
// sans js/i18n.js) : `uiT()` retombe sur le texte français si `t()`
// n'existe pas, pour ne jamais planter sur ces pages-là.
// -----------------------------------------------------------------------

function uiT(key, fallback, vars) {
  return typeof t === 'function' ? t(key, vars) : fallback;
}

const PRICE_LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', es: 'es-ES' };

function formatPrice(value) {
  const locale = typeof getLang === 'function' ? PRICE_LOCALES[getLang()] || 'fr-FR' : 'fr-FR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
}

// Échappe le texte libre (nom produit...) qu'on place à la fois dans un
// attribut HTML (data-i18n-source) et dans le contenu de l'élément.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// N'affiche une image QUE si elle existe réellement -- si aucune photo
// n'a été trouvée pour ce produit, on préfère un espace neutre plutôt
// qu'une image factice qui ne ressemble pas à un vrai produit.
function productImageHTML(imageUrl, altText, imgClass) {
  return imageUrl
    ? `<img src="${imageUrl}" alt="${altText}" loading="lazy" class="${imgClass}" />`
    : '';
}

// Génère le HTML d'une carte produit pour la grille (accueil / recherche)
function productCardHTML(p) {
  const verifiedBadge = p.supplier_verified
    ? `<span class="badge-verified"><svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>${uiT('product.verified', 'Vérifié')}</span>`
    : '';

  return `
    <a href="product.html?slug=${p.slug}" class="product-card group bg-white rounded-lg overflow-hidden flex flex-col">
      <div class="aspect-square overflow-hidden bg-gray-100">
        ${productImageHTML(p.image_url, p.name, 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300')}
      </div>
      <div class="p-3 flex flex-col gap-1.5 flex-1">
        <p class="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]" data-i18n-source="${escapeHtml(p.name)}">${escapeHtml(p.name)}</p>
        <p class="font-display font-bold text-lg text-[color:var(--color-primary)]">
          ${formatPrice(p.price)} <span class="text-xs font-normal text-gray-500">${uiT('product.perUnit', '/ unité')}</span>
        </p>
        <span class="badge-moq w-fit">${uiT('product.moq', 'MOQ')} ${p.moq}</span>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-gray-500 truncate">${p.supplier_name}</span>
          ${verifiedBadge}
        </div>
        <div class="flex items-center gap-1 text-xs text-gray-500">
          <span class="star-rating">${renderStars(p.rating)}</span>
          <span>(${uiT('product.orders', `${p.orders_count.toLocaleString('fr-FR')} commandes`, { n: p.orders_count.toLocaleString('fr-FR') })})</span>
        </div>
      </div>
    </a>
  `;
}

// Petite notification transitoire en bas à droite
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'bg-[color:var(--color-navy)] text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}
