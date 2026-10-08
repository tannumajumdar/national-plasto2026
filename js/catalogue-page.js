/**
 * National Plasto — Product Catalogue page (products.html)
 * Renders window.NP_CATALOGUE (generated from the 2026 photoshoot) grouped
 * by category, with brand tabs, category chips, search, and a Quick-View modal
 * that shows a real 360° 3D model where one exists (see window.NP_MODELS).
 */
(function () {
  var DATA = window.NP_CATALOGUE || [];

  var BRANDS = ['National', 'Next', 'Sapphire', 'Captain'];
  var CATEGORY_ORDER = [
    'Arm Chairs', 'Premium Arm Chairs', 'Armless Chairs', 'Premium Armless Chairs',
    'Metallic Chairs', 'Steel Moulded Chairs', 'Baby Chairs', 'Stools', 'Tables',
    'Dining Sets', 'Trolleys & Racks', 'Wardrobes'
  ];
  // Legacy ?category= / ?cat= links used across the site
  var CATEGORY_GROUPS = {
    chairs: ['Arm Chairs', 'Premium Arm Chairs', 'Armless Chairs', 'Premium Armless Chairs', 'Metallic Chairs', 'Steel Moulded Chairs'],
    monoblock: ['Arm Chairs', 'Armless Chairs'],
    cushioned: ['Premium Arm Chairs', 'Premium Armless Chairs', 'Dining Sets'],
    tables: ['Tables', 'Dining Sets'],
    stools: ['Stools'],
    'baby-kids': ['Baby Chairs'],
    storage: ['Wardrobes', 'Trolleys & Racks'],
    utility: ['Trolleys & Racks'],
    industrial: ['Trolleys & Racks']
  };

  var state = { brand: 'all', cats: [], query: '' };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function catSlug(c) { return c.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-'); }

  function matches(p, ignoreCats) {
    if (state.brand !== 'all' && p.b !== state.brand) return false;
    if (!ignoreCats && state.cats.length && state.cats.indexOf(p.c) === -1) return false;
    if (state.query) {
      var hay = (p.n + ' ' + p.b + ' ' + p.c + ' ' + (p.sku || '')).toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function option(attr, value, label, count, on) {
    return '<button type="button" class="np-f-opt' + (on ? ' on' : '') + '" ' + attr + '="' + esc(value) + '">' +
      '<span class="np-f-tick" aria-hidden="true"></span>' + esc(label) +
      (count != null ? '<em>' + count + '</em>' : '') + '</button>';
  }

  function renderBrandTabs() {
    var counts = { all: DATA.length };
    DATA.forEach(function (p) { counts[p.b] = (counts[p.b] || 0) + 1; });
    var el = $('npBrandTabs');
    if (!el) return;
    el.innerHTML = ['all'].concat(BRANDS).map(function (b) {
      return option('data-brand', b, b === 'all' ? 'All brands' : b.toUpperCase(), counts[b] || 0, state.brand === b);
    }).join('');
  }

  function renderCategoryChips() {
    var counts = {};
    DATA.forEach(function (p) { if (matches(p, true)) counts[p.c] = (counts[p.c] || 0) + 1; });
    var total = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);
    var html = option('data-cat', '', 'All collections', total, !state.cats.length);
    CATEGORY_ORDER.forEach(function (c) {
      if (!counts[c]) return;
      html += option('data-cat', c, c, counts[c], state.cats.length === 1 && state.cats[0] === c);
    });
    // grouped links from the menu (e.g. "Moulded Furniture") select several collections at once
    if (state.cats.length > 1) {
      html = option('data-cat', '', 'All collections', total, false) +
        CATEGORY_ORDER.filter(function (c) { return counts[c]; }).map(function (c) {
          return option('data-cat', c, c, counts[c], state.cats.indexOf(c) !== -1);
        }).join('');
    }
    var el = $('npCategoryChips');
    if (el) el.innerHTML = html;
  }

  function card(p, idx) {
    var img = p.img[0];
    var alt = p.img[1];
    var thumbs = p.img.length > 1 ? '<div class="np-card-thumbs">' + p.img.slice(0, 5).map(function (im, i) {
      return '<img src="' + im.f + '" alt="" loading="lazy" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>';
    }).join('') + '</div>' : '';
    var has3d = !!modelFor(p);
    return '' +
      '<article class="np-card" data-idx="' + idx + '">' +
        '<div class="np-card-media" title="' + (has3d ? 'Open 360° 3D view' : 'Quick view') + '">' +
          '<span class="np-card-brand np-badge-' + p.b.toLowerCase() + '">' + esc(p.b) + '</span>' +
          '<img class="np-card-img" src="' + img.f + '" alt="' + esc(p.b + ' ' + p.n) + '" loading="lazy" width="' + img.w + '" height="' + img.h + '">' +
          (alt ? '<img class="np-card-img np-card-img-alt" src="' + alt.f + '" alt="" loading="lazy" aria-hidden="true">' : '') +
        '</div>' +
        thumbs +
        '<div class="np-card-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">' +
            '<h3>' + esc(p.n) + '</h3>' +
            (has3d ? '<span class="np-card-360-hint" title="Interactive 360° 3D view"><i class="fas fa-cube"></i> 3D</span>' : '') +
          '</div>' +
          '<p>' + esc(p.c) + (p.sku ? ' &middot; ' + esc(p.sku) : '') + '</p>' +
          '<div class="np-card-actions">' +
            '<button type="button" class="np-btn-view" data-idx="' + idx + '">' + (has3d ? '<i class="fas fa-cube"></i> 360&deg; View' : 'Quick View') + '</button>' +
            '<a class="np-btn-enquire" href="contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section">Enquire</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderGrid() {
    var groups = {};
    var shown = 0;
    DATA.forEach(function (p, i) {
      if (!matches(p)) return;
      (groups[p.c] = groups[p.c] || []).push(i);
      shown++;
    });
    var html = '';
    CATEGORY_ORDER.forEach(function (c) {
      var list = groups[c];
      if (!list) return;
      html += '<section class="np-cat-section" id="cat-' + catSlug(c) + '">' +
        '<div class="np-cat-head"><h2>' + esc(c) + '</h2><span>' + list.length + ' model' + (list.length > 1 ? 's' : '') + '</span></div>' +
        '<div class="np-grid">' + list.map(function (i) { return card(DATA[i], i); }).join('') + '</div>' +
        '</section>';
    });
    if (!shown) {
      html = '<div class="np-empty"><h3>No products match your search.</h3>' +
        '<button type="button" class="np-chip active" id="npResetAll">Show all products</button></div>';
    }
    var catEl = $('npCatalogue');
    if (catEl) catEl.innerHTML = html;
    var bits = [];
    if (state.cats.length === 1) bits.push(esc(state.cats[0]));
    else if (state.cats.length > 1) bits.push(state.cats.length + ' collections');
    if (state.brand !== 'all') bits.push(esc(state.brand.toUpperCase()));
    if (state.query) bits.push('&ldquo;' + esc(state.query) + '&rdquo;');
    var filtered = bits.length > 0;
    var resEl = $('npResultCount');
    if (resEl) {
      resEl.innerHTML = 'Showing <strong>' + shown + '</strong> product' + (shown === 1 ? '' : 's') +
        (filtered ? ' <span class="np-rc-tags">&middot; ' + bits.join(' &middot; ') + '</span>' +
          ' <button type="button" class="np-rc-clear" data-clear>Clear all</button>' : '');
    }
    var apply = $('npFilterApply');
    if (apply) apply.textContent = 'Show ' + shown + ' product' + (shown === 1 ? '' : 's');
  }

  function renderAll() {
    renderBrandTabs();
    renderCategoryChips();
    renderGrid();
  }

  /* ---------- Quick view modal: real 3D models + colourways ---------- */
  // window.NP_MODELS (js/catalogue-3d.js, written by tools/make-3d-models.py)
  // maps "Brand|Name" to a .glb model. Products with a model open in a real
  // 360° viewer; the rest show their colourway photos.
  var MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
  var modalProduct = null;

  function modelFor(p) { return (window.NP_MODELS || {})[p.b + '|' + p.n] || ''; }

  function loadModelViewer() {
    if (window.customElements && customElements.get('model-viewer')) return;
    if (document.getElementById('npModelViewerLib')) return;
    var s = document.createElement('script');
    s.type = 'module';
    s.id = 'npModelViewerLib';
    s.src = MODEL_VIEWER_SRC;
    document.head.appendChild(s);
  }

  // i === -1 shows the 3D model, otherwise colourway photo i
  function showModalImage(i) {
    var p = modalProduct;
    if (!p) return;
    var model = modelFor(p);
    var show3d = i === -1 && !!model;
    var stage = $('npModalImgContainer');
    var mv = $('npModalModel');
    stage.classList.toggle('np-show-3d', show3d);
    if (show3d) {
      if (mv.getAttribute('src') !== model) mv.setAttribute('src', model);
      mv.setAttribute('alt', p.b + ' ' + p.n + ' 3D model');
    } else {
      var im = p.img[Math.max(0, i)];
      var el = $('npModalImg');
      el.src = im.f;
      el.alt = p.b + ' ' + p.n + (im.v ? ' - ' + im.v : '');
    }
    Array.prototype.forEach.call($('npModalThumbs').children, function (b) {
      b.classList.toggle('on', +b.getAttribute('data-i') === i);
    });
  }

  function openModal(idx) {
    var p = DATA[idx];
    if (!p) return;
    modalProduct = p;
    var model = modelFor(p);
    if (model) loadModelViewer();

    $('npModalBrand').textContent = p.b;
    $('npModalBrand').className = 'np-card-brand np-badge-' + p.b.toLowerCase();
    $('npModalTitle').textContent = p.n;
    $('npModalMeta').textContent = p.c + (p.sku ? ' · ' + p.sku : '');
    $('npModalViews').textContent = (model ? '360° 3D view · ' : '') + p.img.length + ' colourway' + (p.img.length > 1 ? 's' : '');
    $('npModalEnquire').href = 'contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section';
    $('npModalImgContainer').classList.toggle('np-has-3d', !!model);

    $('npModalThumbs').innerHTML = (model ? '<button type="button" data-i="-1" class="np-thumb-3d" title="360° 3D view">3D</button>' : '') +
      p.img.map(function (im, i) {
        return '<button type="button" data-i="' + i + '" title="Colour ' + (i + 1) + '"><img src="' + im.f + '" alt=""></button>';
      }).join('');

    showModalImage(model ? -1 : 0);

    $('npModal').classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    $('npModal').classList.remove('open');
    document.documentElement.style.overflow = '';
  }

  /* ---------- Events ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('npCatalogue')) return;

    var params = new URLSearchParams(window.location.search);
    var brand = (params.get('brand') || '').toLowerCase();
    BRANDS.forEach(function (b) { if (b.toLowerCase() === brand) state.brand = b; });
    var cat = (params.get('category') || params.get('cat') || '').toLowerCase();
    if (CATEGORY_GROUPS[cat]) state.cats = CATEGORY_GROUPS[cat].slice();
    else CATEGORY_ORDER.forEach(function (c) {
      if (c.toLowerCase() === cat || catSlug(c) === cat) state.cats = [c];
    });
    var q = params.get('search');
    if (q) { state.query = q.toLowerCase(); var sEl = $('npSearch'); if (sEl) sEl.value = q; }

    renderAll();

    if (params.get('brand') || cat || q) {
      var list = document.getElementById('all-products');
      if (list) setTimeout(function () { list.scrollIntoView(); }, 60);
    }

    var brandTabs = $('npBrandTabs');
    if (brandTabs) {
      brandTabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-brand]');
        if (!b) return;
        state.brand = b.getAttribute('data-brand');
        state.cats = state.cats.filter(function (c) {
          return DATA.some(function (p) { return p.c === c && (state.brand === 'all' || p.b === state.brand); });
        });
        renderAll();
      });
    }

    var catChips = $('npCategoryChips');
    if (catChips) {
      catChips.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (!c) return;
        var v = c.getAttribute('data-cat');
        state.cats = v ? [v] : [];
        renderCategoryChips();
        renderGrid();
      });
    }

    var searchInput = $('npSearch');
    if (searchInput) {
      var t;
      searchInput.addEventListener('input', function () {
        var v = this.value.trim().toLowerCase();
        clearTimeout(t);
        t = setTimeout(function () { state.query = v; renderCategoryChips(); renderGrid(); }, 120);
      });
    }

    function clearAll() {
      state = { brand: 'all', cats: [], query: '' };
      var sEl = $('npSearch');
      if (sEl) sEl.value = '';
      renderAll();
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) clearAll();
    });

    // Mobile drawer filter
    function setFilterOpen(open) {
      document.documentElement.classList.toggle('np-filter-open', open);
    }
    var fOpen = $('npFilterOpen');
    if (fOpen) fOpen.addEventListener('click', function () { setFilterOpen(true); });
    var fClose = $('npFilterClose');
    if (fClose) fClose.addEventListener('click', function () { setFilterOpen(false); });
    var fBackdrop = $('npFilterBackdrop');
    if (fBackdrop) fBackdrop.addEventListener('click', function () { setFilterOpen(false); });
    var fApply = $('npFilterApply');
    if (fApply) fApply.addEventListener('click', function () {
      setFilterOpen(false);
      var list = document.getElementById('all-products');
      if (list) list.scrollIntoView();
    });

    $('npCatalogue').addEventListener('click', function (e) {
      if (e.target.id === 'npResetAll') {
        state = { brand: 'all', cats: [], query: '' };
        var sEl = $('npSearch');
        if (sEl) sEl.value = '';
        renderAll();
        return;
      }
      var thumb = e.target.closest('.np-card-thumbs img');
      if (thumb) {
        var cardEl = thumb.closest('.np-card');
        var p = DATA[+cardEl.getAttribute('data-idx')];
        var main = cardEl.querySelector('.np-card-img');
        if (main && p && p.img[+thumb.getAttribute('data-i')]) {
          main.src = p.img[+thumb.getAttribute('data-i')].f;
        }
        cardEl.classList.add('np-card-picked');
        Array.prototype.forEach.call(thumb.parentNode.children, function (x) { x.classList.toggle('on', x === thumb); });
        return;
      }
      var view = e.target.closest('.np-btn-view, .np-card-media');
      if (view) {
        var cardEl = view.closest('.np-card');
        if (cardEl) openModal(+cardEl.getAttribute('data-idx'));
      }
    });

    var thumbsEl = $('npModalThumbs');
    if (thumbsEl) {
      thumbsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]');
        if (b) showModalImage(+b.getAttribute('data-i'));
      });
    }

    var modalEl = $('npModal');
    if (modalEl) {
      modalEl.addEventListener('click', function (e) {
        if (e.target === this || e.target.closest('.np-modal-x')) closeModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); setFilterOpen(false); }
    });
  });
})();
