/**
 * National Plasto — Product Catalogue page (products.html)
 * Renders window.NP_CATALOGUE (generated from the 2026 photoshoot) grouped
 * by category, with brand tabs, category chips, search and a gallery modal.
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
    $('npBrandTabs').innerHTML = ['all'].concat(BRANDS).map(function (b) {
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
    $('npCategoryChips').innerHTML = html;
  }

  function card(p, idx) {
    var img = p.img[0];
    var alt = p.img[1];
    var thumbs = p.img.length > 1 ? '<div class="np-card-thumbs">' + p.img.slice(0, 5).map(function (im, i) {
      return '<img src="' + im.f + '" alt="" loading="lazy" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>';
    }).join('') + '</div>' : '';
    return '' +
      '<article class="np-card" data-idx="' + idx + '">' +
        '<div class="np-card-media">' +
          '<span class="np-card-brand np-badge-' + p.b.toLowerCase() + '">' + esc(p.b) + '</span>' +
          '<img class="np-card-img" src="' + img.f + '" alt="' + esc(p.b + ' ' + p.n) + '" loading="lazy" width="' + img.w + '" height="' + img.h + '">' +
          (alt ? '<img class="np-card-img np-card-img-alt" src="' + alt.f + '" alt="" loading="lazy" aria-hidden="true">' : '') +
        '</div>' +
        thumbs +
        '<div class="np-card-body">' +
          '<h3>' + esc(p.n) + '</h3>' +
          '<p>' + esc(p.c) + (p.sku ? ' &middot; ' + esc(p.sku) : '') + '</p>' +
          '<div class="np-card-actions">' +
            '<button type="button" class="np-btn-view" data-idx="' + idx + '">View</button>' +
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
    $('npCatalogue').innerHTML = html;
    var bits = [];
    if (state.cats.length === 1) bits.push(esc(state.cats[0]));
    else if (state.cats.length > 1) bits.push(state.cats.length + ' collections');
    if (state.brand !== 'all') bits.push(esc(state.brand.toUpperCase()));
    if (state.query) bits.push('&ldquo;' + esc(state.query) + '&rdquo;');
    var filtered = bits.length > 0;
    $('npResultCount').innerHTML = 'Showing <strong>' + shown + '</strong> product' + (shown === 1 ? '' : 's') +
      (filtered ? ' <span class="np-rc-tags">&middot; ' + bits.join(' &middot; ') + '</span>' +
        ' <button type="button" class="np-rc-clear" data-clear>Clear all</button>' : '');
    var apply = $('npFilterApply');
    if (apply) apply.textContent = 'Show ' + shown + ' product' + (shown === 1 ? '' : 's');
  }

  function renderAll() {
    renderBrandTabs();
    renderCategoryChips();
    renderGrid();
  }

  /* ---------- Quick view modal ---------- */
  var modalProduct = null;
  function openModal(idx) {
    var p = DATA[idx];
    if (!p) return;
    modalProduct = p;
    $('npModalBrand').textContent = p.b;
    $('npModalBrand').className = 'np-card-brand np-badge-' + p.b.toLowerCase();
    $('npModalTitle').textContent = p.n;
    $('npModalMeta').textContent = p.c + (p.sku ? ' · ' + p.sku : '');
    $('npModalViews').textContent = p.img.length + (p.img.length > 1 ? ' views / colours' : ' view');
    $('npModalEnquire').href = 'contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section';
    $('npModalThumbs').innerHTML = p.img.map(function (im, i) {
      return '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '><img src="' + im.f + '" alt=""></button>';
    }).join('');
    showModalImage(0);
    $('npModal').classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function showModalImage(i) {
    var im = modalProduct.img[i];
    var el = $('npModalImg');
    el.src = im.f;
    el.alt = modalProduct.b + ' ' + modalProduct.n + (im.v ? ' - ' + im.v : '');
    Array.prototype.forEach.call($('npModalThumbs').children, function (b, j) { b.classList.toggle('on', j === i); });
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
      // exact category, by name or slug (e.g. ?cat=arm-chairs from the collection cards)
      if (c.toLowerCase() === cat || catSlug(c) === cat) state.cats = [c];
    });
    var q = params.get('search');
    if (q) { state.query = q.toLowerCase(); $('npSearch').value = q; }

    renderAll();

    // arriving from a collection / brand link: jump to the product list
    if (params.get('brand') || cat || q) {
      var list = document.getElementById('all-products');
      if (list) setTimeout(function () { list.scrollIntoView(); }, 60);
    }

    $('npBrandTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-brand]');
      if (!b) return;
      state.brand = b.getAttribute('data-brand');
      // keep the chosen collection if this brand makes it, otherwise show all
      state.cats = state.cats.filter(function (c) {
        return DATA.some(function (p) { return p.c === c && (state.brand === 'all' || p.b === state.brand); });
      });
      renderAll();
    });
    $('npCategoryChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-cat]');
      if (!c) return;
      var v = c.getAttribute('data-cat');
      state.cats = v ? [v] : [];
      renderCategoryChips();
      renderGrid();
    });
    var t;
    $('npSearch').addEventListener('input', function () {
      var v = this.value.trim().toLowerCase();
      clearTimeout(t);
      t = setTimeout(function () { state.query = v; renderCategoryChips(); renderGrid(); }, 120);
    });

    function clearAll() {
      state = { brand: 'all', cats: [], query: '' };
      $('npSearch').value = '';
      renderAll();
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) clearAll();
    });

    // mobile: filter panel opens as a drawer
    var filterPanel = $('npFilter');
    function setFilterOpen(open) {
      document.documentElement.classList.toggle('np-filter-open', open);
    }
    $('npFilterOpen').addEventListener('click', function () { setFilterOpen(true); });
    $('npFilterClose').addEventListener('click', function () { setFilterOpen(false); });
    $('npFilterBackdrop').addEventListener('click', function () { setFilterOpen(false); });
    $('npFilterApply').addEventListener('click', function () {
      setFilterOpen(false);
      var list = document.getElementById('all-products');
      if (list) list.scrollIntoView();
    });

    $('npCatalogue').addEventListener('click', function (e) {
      if (e.target.id === 'npResetAll') {
        state = { brand: 'all', cats: [], query: '' };
        $('npSearch').value = '';
        renderAll();
        return;
      }
      var thumb = e.target.closest('.np-card-thumbs img');
      if (thumb) {
        var cardEl = thumb.closest('.np-card');
        var p = DATA[+cardEl.getAttribute('data-idx')];
        var main = cardEl.querySelector('.np-card-img');
        main.src = p.img[+thumb.getAttribute('data-i')].f;
        cardEl.classList.add('np-card-picked');
        Array.prototype.forEach.call(thumb.parentNode.children, function (x) { x.classList.toggle('on', x === thumb); });
        return;
      }
      var view = e.target.closest('.np-btn-view, .np-card-media');
      if (view) openModal(+view.closest('.np-card').getAttribute('data-idx'));
    });

    $('npModalThumbs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]');
      if (b) showModalImage(+b.getAttribute('data-i'));
    });
    $('npModal').addEventListener('click', function (e) {
      if (e.target === this || e.target.closest('.np-modal-x')) closeModal();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); setFilterOpen(false); } });
  });
})();
