// app.js – Logique principale de KotUGB

// ── État de l'application ──────────────────────────────────────────────────
let filtresActifs = {
  recherche: "",
  type: "",
  prixMax: "",
  distanceMax: "",
  tri: "prix-asc"
};

// ── Sélecteurs DOM ─────────────────────────────────────────────────────────
const listEl        = document.getElementById("logementsList");
const emptyEl       = document.getElementById("emptyState");
const countEl       = document.getElementById("countLabel");
const searchInput   = document.getElementById("searchInput");
const filtreType    = document.getElementById("filtreType");
const filtrePrix    = document.getElementById("filtrePrixMax");
const filtreDistance= document.getElementById("filtreDistance");
const filtreTri     = document.getElementById("filtreTri");
const btnReset      = document.getElementById("btnReset");
const modal         = document.getElementById("modal");
const modalClose    = document.getElementById("modalClose");
const modalContent  = document.getElementById("modalContent");

// ── Icônes par type ────────────────────────────────────────────────────────
const typeIcons = {
  "Chambre"     : "🛏️",
  "Studio"      : "🏠",
  "Appartement" : "🏢",
  "Colocation"  : "👥"
};

// ── Formatage prix ─────────────────────────────────────────────────────────
function formatPrix(n) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

// ── Filtrage + tri ─────────────────────────────────────────────────────────
function filtrerEtTrier() {
  let resultats = logements.filter(function(l) {
    var q = filtresActifs.recherche.toLowerCase();
    var matchRecherche = !q ||
      l.titre.toLowerCase().includes(q) ||
      l.quartier.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q);

    var matchType     = !filtresActifs.type || l.type === filtresActifs.type;
    var matchPrix     = !filtresActifs.prixMax || l.prix <= parseInt(filtresActifs.prixMax);
    var matchDist     = !filtresActifs.distanceMax || l.distanceMin <= parseInt(filtresActifs.distanceMax);

    return matchRecherche && matchType && matchPrix && matchDist;
  });

  resultats.sort(function(a, b) {
    switch (filtresActifs.tri) {
      case "prix-asc"     : return a.prix - b.prix;
      case "prix-desc"    : return b.prix - a.prix;
      case "distance-asc" : return a.distanceMin - b.distanceMin;
      case "nom-asc"      : return a.titre.localeCompare(b.titre, "fr");
      default             : return 0;
    }
  });

  return resultats;
}

// ── Rendu d'une carte ──────────────────────────────────────────────────────
function creerCarteHTML(l) {
  var disponibiliteClass = l.disponible ? "dispo-oui" : "dispo-non";
  var disponibiliteTxt   = l.disponible ? "Disponible" : "Indisponible";
  var badgeHTML = l.badge
    ? '<span class="badge">' + l.badge + '</span>'
    : '';

  var equipHTML = l.equipements.slice(0, 4).map(function(e) {
    return '<span class="equip-tag">' + e + '</span>';
  }).join("");

  return '<div class="carte" onclick="ouvrirModal(' + l.id + ')">' +
    '<div class="carte-header">' +
      '<span class="type-icon">' + (typeIcons[l.type] || "🏠") + '</span>' +
      '<div class="carte-header-right">' +
        badgeHTML +
        '<span class="dispo ' + disponibiliteClass + '">' + disponibiliteTxt + '</span>' +
      '</div>' +
    '</div>' +
    '<h3 class="carte-titre">' + l.titre + '</h3>' +
    '<div class="carte-meta">' +
      '<span class="meta-item">📍 ' + l.quartier + '</span>' +
      '<span class="meta-item">🚶 ' + l.distanceMin + ' min du campus</span>' +
      '<span class="meta-item">📐 ' + l.surface + ' m²</span>' +
    '</div>' +
    '<div class="equip-list">' + equipHTML + '</div>' +
    '<div class="carte-footer">' +
      '<span class="prix">' + formatPrix(l.prix) + '<small>/mois</small></span>' +
      '<button class="btn-voir" onclick="ouvrirModal(' + l.id + '); event.stopPropagation()">Voir le détail →</button>' +
    '</div>' +
  '</div>';
}

// ── Rendu de la liste ──────────────────────────────────────────────────────
function afficherLogements() {
  var resultats = filtrerEtTrier();
  countEl.textContent = resultats.length + " offre" + (resultats.length > 1 ? "s" : "");

  if (resultats.length === 0) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    listEl.innerHTML = resultats.map(creerCarteHTML).join("");
  }
}

// ── Modal détail ───────────────────────────────────────────────────────────
function ouvrirModal(id) {
  var l = logements.find(function(x) { return x.id === id; });
  if (!l) return;

  var equipAll = l.equipements.map(function(e) {
    return '<span class="equip-tag">' + e + '</span>';
  }).join("");

  var disponibiliteTxt = l.disponible
    ? '<span class="dispo dispo-oui">✓ Disponible</span>'
    : '<span class="dispo dispo-non">✗ Indisponible</span>';

  modalContent.innerHTML =
    '<div class="modal-type-icon">' + (typeIcons[l.type] || "🏠") + '</div>' +
    '<h2 class="modal-titre">' + l.titre + '</h2>' +
    '<div class="modal-meta">' +
      '<span class="meta-item">📍 ' + l.quartier + '</span>' +
      '<span class="meta-item">🚶 ' + l.distanceMin + ' min du campus</span>' +
      '<span class="meta-item">📐 ' + l.surface + ' m²</span>' +
      '<span class="meta-item">🏷️ ' + l.type + '</span>' +
    '</div>' +
    '<p class="modal-description">' + l.description + '</p>' +
    '<div class="modal-section">' +
      '<h4>Équipements</h4>' +
      '<div class="equip-list">' + equipAll + '</div>' +
    '</div>' +
    '<div class="modal-section modal-footer-info">' +
      '<div class="modal-prix">' + formatPrix(l.prix) + ' <small>/mois</small></div>' +
      disponibiliteTxt +
    '</div>' +
    '<div class="modal-section">' +
      '<h4>Contact propriétaire</h4>' +
      '<a href="tel:' + l.contact.replace(/\s/g,"") + '" class="btn-contact">📞 ' + l.contact + '</a>' +
    '</div>';

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function fermerModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// ── Réinitialisation des filtres ───────────────────────────────────────────
function resetFiltres() {
  filtresActifs = { recherche: "", type: "", prixMax: "", distanceMax: "", tri: "prix-asc" };
  searchInput.value   = "";
  filtreType.value    = "";
  filtrePrix.value    = "";
  filtreDistance.value= "";
  filtreTri.value     = "prix-asc";
  afficherLogements();
}

// ── Écouteurs d'événements ─────────────────────────────────────────────────
searchInput.addEventListener("input", function() {
  filtresActifs.recherche = this.value.trim();
  afficherLogements();
});

filtreType.addEventListener("change", function() {
  filtresActifs.type = this.value;
  afficherLogements();
});

filtrePrix.addEventListener("change", function() {
  filtresActifs.prixMax = this.value;
  afficherLogements();
});

filtreDistance.addEventListener("change", function() {
  filtresActifs.distanceMax = this.value;
  afficherLogements();
});

filtreTri.addEventListener("change", function() {
  filtresActifs.tri = this.value;
  afficherLogements();
});

btnReset.addEventListener("click", resetFiltres);

modalClose.addEventListener("click", fermerModal);

modal.addEventListener("click", function(e) {
  if (e.target === modal) fermerModal();
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") fermerModal();
});

// ── Initialisation ─────────────────────────────────────────────────────────
afficherLogements();
