/**
 * National Plasto — Product Catalogue page (products.html)
 * Renders window.NP_CATALOGUE (generated from the 2026 photoshoot) grouped
 * by category, with brand tabs, category chips, search, interactive 360° Studio Showcase,
 * and a rich 360° 3D Quick-View rotation modal.
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
    return '' +
      '<article class="np-card" data-idx="' + idx + '">' +
        '<div class="np-card-media" title="Click to open 360° 3D Quick View">' +
          '<span class="np-card-brand np-badge-' + p.b.toLowerCase() + '">' + esc(p.b) + '</span>' +
          '<img class="np-card-img" src="' + img.f + '" alt="' + esc(p.b + ' ' + p.n) + '" loading="lazy" width="' + img.w + '" height="' + img.h + '">' +
          (alt ? '<img class="np-card-img np-card-img-alt" src="' + alt.f + '" alt="" loading="lazy" aria-hidden="true">' : '') +
        '</div>' +
        thumbs +
        '<div class="np-card-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">' +
            '<h3>' + esc(p.n) + '</h3>' +
            '<span class="np-card-360-hint" title="Interactive 360° rotation available"><i class="fas fa-sync-alt"></i> 360&deg;</span>' +
          '</div>' +
          '<p>' + esc(p.c) + (p.sku ? ' &middot; ' + esc(p.sku) : '') + '</p>' +
          '<div class="np-card-actions">' +
            '<button type="button" class="np-btn-view" data-idx="' + idx + '"><i class="fas fa-cube"></i> 360&deg; View</button>' +
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

  /* ---------- Quick view modal with 360° Interactive 3D Rotation ---------- */
  var modalProduct = null;
  var currentImageIndex = 0;
  var modalAngle = 0;
  var modalSpinRaf = null;

  function setModalAngle(deg, updateSlider) {
    modalAngle = ((deg % 360) + 360) % 360;
    var turntable = $('npModalTurntable');
    if (turntable) {
      turntable.style.transform = 'perspective(1000px) rotateY(' + modalAngle + 'deg)';
    }
    var slider = $('np360Slider');
    if (slider && updateSlider !== false) {
      slider.value = Math.round(modalAngle);
    }
    var stepEl = $('np360Step');
    if (stepEl) {
      if (modalProduct && modalProduct.img.length > 1) {
        stepEl.textContent = Math.round(modalAngle) + '° (View ' + (currentImageIndex + 1) + '/' + modalProduct.img.length + ')';
      } else {
        stepEl.textContent = Math.round(modalAngle) + '°';
      }
    }
    // Synchronize multi-image frame if product has multi angles
    if (modalProduct && modalProduct.img.length > 1) {
      var frameIdx = Math.floor((modalAngle / 360) * modalProduct.img.length) % modalProduct.img.length;
      if (frameIdx !== currentImageIndex) {
        showModalImage(frameIdx, false);
      }
    }
    // Update active preset button
    var presets = $('np360Presets');
    if (presets) {
      var rounded = Math.round(modalAngle / 90) * 90 % 360;
      Array.prototype.forEach.call(presets.querySelectorAll('.np-360-preset-btn'), function (btn) {
        var bDeg = +btn.getAttribute('data-deg');
        btn.classList.toggle('active', Math.abs(bDeg - rounded) < 20);
      });
    }
  }

  function stopAutoSpin() {
    if (modalSpinRaf) {
      cancelAnimationFrame(modalSpinRaf);
      modalSpinRaf = null;
    }
    var spinBtn = $('np360AutoSpinBtn');
    if (spinBtn) {
      spinBtn.classList.remove('spinning');
      spinBtn.innerHTML = '<i class="fas fa-play"></i> <span>Auto-Spin</span>';
    }
  }

  function toggleAutoSpin() {
    if (modalSpinRaf) {
      stopAutoSpin();
    } else {
      var spinBtn = $('np360AutoSpinBtn');
      if (spinBtn) {
        spinBtn.classList.add('spinning');
        spinBtn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
      }
      function loop() {
        setModalAngle(modalAngle + 1.25);
        modalSpinRaf = requestAnimationFrame(loop);
      }
      modalSpinRaf = requestAnimationFrame(loop);
    }
  }

  function showModalImage(i, resetAngle) {
    if (!modalProduct || !modalProduct.img.length) return;
    currentImageIndex = (i + modalProduct.img.length) % modalProduct.img.length;
    var im = modalProduct.img[currentImageIndex];
    var el = $('npModalImg');
    if (el) {
      el.src = im.f;
      el.alt = modalProduct.b + ' ' + modalProduct.n + (im.v ? ' - ' + im.v : '');
    }
    if (resetAngle !== false) {
      var targetAngle = (currentImageIndex / modalProduct.img.length) * 360;
      setModalAngle(targetAngle);
    }
    Array.prototype.forEach.call($('npModalThumbs').children, function (b, j) {
      b.classList.toggle('on', j === currentImageIndex);
    });
  }

  function openModal(idx) {
    var p = DATA[idx];
    if (!p) return;
    modalProduct = p;
    currentImageIndex = 0;
    stopAutoSpin();

    $('npModalBrand').textContent = p.b;
    $('npModalBrand').className = 'np-card-brand np-badge-' + p.b.toLowerCase();
    $('npModalTitle').textContent = p.n;
    $('npModalMeta').textContent = p.c + (p.sku ? ' · ' + p.sku : '');
    $('npModalViews').textContent = p.img.length + (p.img.length > 1 ? ' 360° interactive views & colourways' : ' 360° interactive 3D view');
    $('npModalEnquire').href = 'contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section';

    $('npModalThumbs').innerHTML = p.img.map(function (im, i) {
      return '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + ' title="View angle ' + (i+1) + '"><img src="' + im.f + '" alt=""></button>';
    }).join('');

    showModalImage(0, false);
    setModalAngle(0);

    $('npModal').classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    stopAutoSpin();
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
        if (b) {
          stopAutoSpin();
          showModalImage(+b.getAttribute('data-i'));
        }
      });
    }

    // Modal 360 controls
    var prevBtn = $('np360PrevBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stopAutoSpin();
        setModalAngle(modalAngle - 45);
      });
    }

    var nextBtn = $('np360NextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopAutoSpin();
        setModalAngle(modalAngle + 45);
      });
    }

    var autoSpinBtn = $('np360AutoSpinBtn');
    if (autoSpinBtn) {
      autoSpinBtn.addEventListener('click', function () {
        toggleAutoSpin();
      });
    }

    var slider = $('np360Slider');
    if (slider) {
      slider.addEventListener('input', function () {
        stopAutoSpin();
        setModalAngle(+this.value, false);
      });
    }

    var presets = $('np360Presets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var btn = e.target.closest('.np-360-preset-btn');
        if (btn) {
          stopAutoSpin();
          setModalAngle(+btn.getAttribute('data-deg'));
        }
      });
    }

    // Modal 360 drag & touch scrubbing
    var imgStage = $('npModalImgContainer');
    if (imgStage) {
      var isModalDragging = false;
      var startX = 0;
      var startAngle = 0;

      imgStage.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isModalDragging = true;
        startX = e.clientX;
        startAngle = modalAngle;
        imgStage.classList.add('is-dragging');
        stopAutoSpin();
      });

      window.addEventListener('mousemove', function (e) {
        if (!isModalDragging) return;
        var diff = (e.clientX - startX) * 0.8;
        setModalAngle(startAngle + diff);
      });

      window.addEventListener('mouseup', function () {
        if (isModalDragging) {
          isModalDragging = false;
          imgStage.classList.remove('is-dragging');
        }
      });

      imgStage.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          isModalDragging = true;
          startX = e.touches[0].clientX;
          startAngle = modalAngle;
          imgStage.classList.add('is-dragging');
          stopAutoSpin();
        }
      }, { passive: true });

      imgStage.addEventListener('touchmove', function (e) {
        if (!isModalDragging) return;
        if (e.touches.length === 1) {
          var diff = (e.touches[0].clientX - startX) * 0.8;
          setModalAngle(startAngle + diff);
        }
      }, { passive: true });

      imgStage.addEventListener('touchend', function () {
        isModalDragging = false;
        imgStage.classList.remove('is-dragging');
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
