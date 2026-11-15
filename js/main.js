/**
 * BATI MAKİNE SAN. TİC. LTD. ŞTİ.
 * Modern Kurumsal Arayüz Etkileşim Betiği
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initRfqModal();
  initTableSearch();
  initCableTrayTabs();
  initActiveNav();
  initLightbox();
  initProductDetails();
});

/**
 * 0b. Ürün Bazlı Ölçü Alanları
 * Seçilen her ürün grubu için ayrı ölçü/adet alanı açılır.
 * Böylece tek talepte birden fazla ürün için ayrı boyut bilgisi verilebilir.
 */
function initProductDetails() {
  const isEnglish = (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0;
  document.querySelectorAll('input[type="checkbox"][data-wa-label]').forEach(cb => {
    if (!/_group$/.test(cb.name || '')) return;
    const labelEl = cb.closest('label');
    const groupEl = cb.closest('div[id]');
    if (!labelEl || !groupEl) return;

    const productName = cb.value;
    const detail = document.createElement('div');
    detail.className = 'product-detail-wrap';
    detail.style.display = 'none';
    detail.style.margin = '0 0 0.4rem 1.6rem';

    const ta = document.createElement('textarea');
    ta.className = 'form-control product-detail-input';
    ta.rows = 2;
    ta.style.fontSize = '0.9rem';
    ta.style.minHeight = '60px';
    ta.setAttribute('data-wa-label', productName + (isEnglish ? ' - Dimensions / Quantity' : ' - Ölçü / Adet'));
    ta.placeholder = isEnglish
      ? 'e.g. mesh spacing, wire diameter, size (mm), quantity'
      : 'Örn: göz aralığı, tel çapı, ebat (mm), adet veya metraj';
    detail.appendChild(ta);
    labelEl.insertAdjacentElement('afterend', detail);

    cb.addEventListener('change', () => {
      detail.style.display = cb.checked ? '' : 'none';
      if (!cb.checked) ta.value = '';
    });
  });
}

function resetProductDetails(form) {
  if (!form) return;
  form.querySelectorAll('.product-detail-wrap').forEach(w => {
    w.style.display = 'none';
    const ta = w.querySelector('textarea');
    if (ta) ta.value = '';
  });
}

/**
 * 0. Gerçek Teklif Talebi Gönderimi (E-Posta Entegrasyonu)
 * Formdaki [data-wa-label] alanlarını toplayıp yapılandırılmış bir
 * e-posta mesajı oluşturur ve ziyaretçinin e-posta uygulamasını açar.
 * Sunucu/ backend gerektirmez.
 */
window.BatiQuote = {
  EMAIL: 'batimakine@batimakine.com',

  /**
   * Form alanlarını sıralı satırlara çevirir. Çoklu ürün seçimi tek satırda
   * toplanır; her ürünün ölçü alanı kendi satırında listelenir.
   */
  collectFields(form) {
    const parts = []; // { type: 'text'|'group', label, value|values }
    const groups = new Map(); // label -> { values, positioned }
    form.querySelectorAll('[data-wa-label]').forEach((el) => {
      const label = el.getAttribute('data-wa-label');
      if (el.type === 'checkbox') {
        if (el.checked && el.value && el.value !== 'on') {
          if (!groups.has(label)) groups.set(label, { values: [], positioned: false });
          const g = groups.get(label);
          g.values.push(el.value.trim());
          if (!g.positioned) {
            g.positioned = true;
            parts.push({ type: 'group', label, values: g.values });
          }
        }
      } else {
        const value = (el.value || '').trim();
        if (value) parts.push({ type: 'text', label, value });
      }
    });
    return parts.map((p) => p.type === 'group'
      ? p.label + ': ' + p.values.join(', ')
      : p.label + ': ' + p.value);
  },

  /**
   * Form içeriğinden mailto: bağlantısı üretir.
   */
  buildMailto(form) {
    const isEnglish = (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0;
    const subject = isEnglish
      ? 'Price Quotation Request - batimakine.com'
      : 'Fiyat Teklifi Talebi - batimakine.com';
    const body = this.collectFields(form).join('\n');
    return 'mailto:' + this.EMAIL
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
  },

  send(event) {
    event.preventDefault();
    const form = event.target;
    if (!form || !form.checkValidity()) {
      if (form) form.reportValidity();
      return false;
    }

    const isEnglish = (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0;
    const fields = this.collectFields(form);
    if (!fields.length) return false;

    window.location.href = this.buildMailto(form);

    // Kullanıcıya dürüst geri bildirim: talep e-posta uygulamasına aktarıldı.
    let successBox = form.querySelector('.form-success-msg');
    if (!successBox) {
      successBox = document.createElement('div');
      successBox.className = 'form-success-msg';
      form.appendChild(successBox);
    }
    successBox.style.display = 'block';
    successBox.innerHTML = isEnglish
      ? '<strong>Your e-mail application has been opened with your request.</strong> Please press send in the e-mail window to complete your inquiry.'
      : '<strong>E-posta uygulamanız talebinizle birlikte açıldı.</strong> Açılan e-posta penceresinde gönder tuşuna basarak talebinizi tamamlayabilirsiniz.';

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = isEnglish ? 'Opening e-mail...' : 'E-posta açılıyor...';
    }

    form.reset();
    resetProductDetails(form);

    setTimeout(() => {
      if (submitBtn && originalText) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      const modal = form.closest('.modal-overlay');
      if (modal) {
        closeModal(modal);
        setTimeout(() => { successBox.style.display = 'none'; }, 400);
      } else {
        setTimeout(() => { successBox.style.display = 'none'; }, 8000);
      }
    }, 1200);

    return false;
  }
};

/**
 * 1. Mobil Menü Aç/Kapat
 */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (!toggleBtn || !mainNav) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('active');
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/**
 * 2. Kurumsal Fiyat Teklifi Modal & Form Yönetimi (Resmi B2B Talep)
 */
function initRfqModal() {
  const modal = document.getElementById('rfqModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const rfqTriggers = document.querySelectorAll('[data-rfq-product]');
  const productSelect = document.getElementById('rfqProductSelect') || document.getElementById('rfqProductGroup');
  const form = document.getElementById('rfqForm');

  rfqTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const product = btn.getAttribute('data-rfq-product');
      if (product && productSelect) {
        if (productSelect.tagName === 'SELECT') {
          for (let i = 0; i < productSelect.options.length; i++) {
            if (productSelect.options[i].value.toLowerCase().includes(product.toLowerCase()) ||
                product.toLowerCase().includes(productSelect.options[i].value.toLowerCase())) {
              productSelect.selectedIndex = i;
              break;
            }
          }
        } else if (productSelect.tagName === 'DIV') {
          // Çoklu seçim grubu: eşleşen tüm ürün kutularını işaretle
          const p = product.toLowerCase();
          const words = p.split(/[^a-zçğıöşü0-9xø]+/i).filter(w => w.length >= 4);
          productSelect.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const v = (cb.value || '').toLowerCase();
            if (!v) return;
            if (v.includes(p) || p.includes(v)) { cb.checked = true; return; }
            const vWords = v.split(/[^a-zçğıöşü0-9xø]+/i).filter(w => w.length >= 4);
            if (words.some(w => vWords.indexOf(w) !== -1)) cb.checked = true;
          });
        }
      }
      openModal(modal);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(modal));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal(modal);
    }
  });

  // Not: Form artık HTML'deki onsubmit="return window.BatiQuote.send(event)"
  // üzerinden işleniyor; burada ayrı dinleyici eklemek çift gönderime yol açar.
}

function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * 3. Canlı Tablo Arama & Filtreleme (Kafes Tel & Kablo Kanalı)
 */
function initTableSearch() {
  const searchInputs = document.querySelectorAll('.table-search-input');
  searchInputs.forEach(input => {
    const tableId = input.getAttribute('data-table');
    const table = document.getElementById(tableId);
    if (!table) return;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  });
}

/**
 * 4. Tel Kablo Kanalı Yükseklik Sekmeleri (H=35, H=55, H=105 mm)
 */
function initCableTrayTabs() {
  const tabBtns = document.querySelectorAll('.tray-tab-btn');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetHeight = btn.getAttribute('data-target-h');

      tabBtns.forEach(b => b.classList.remove('btn-primary', 'active'));
      tabBtns.forEach(b => b.classList.add('btn-outline'));
      btn.classList.add('btn-primary', 'active');
      btn.classList.remove('btn-outline');

      document.querySelectorAll('.tray-spec-group').forEach(group => {
        if (group.getAttribute('data-h') === targetHeight || targetHeight === 'all') {
          group.style.display = '';
        } else {
          group.style.display = 'none';
        }
      });
    });
  });
}

/**
 * 5. Aktif Menü Linki Vurgulama
 */
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/**
 * 6. Görsel İnceleme / Büyütme (Lightbox)
 */
function initLightbox() {
  const zoomableImages = document.querySelectorAll('.zoomable-img');
  if (!zoomableImages.length) return;

  const lbOverlay = document.createElement('div');
  lbOverlay.className = 'modal-overlay';
  lbOverlay.innerHTML = `
    <div style="max-width: 90vw; max-height: 90vh; position: relative;">
      <button class="modal-close" style="position: absolute; top: -35px; right: 0; color: #fff; font-size: 2rem;">&times;</button>
      <img src="" alt="Görsel İnceleme" style="max-width: 100%; max-height: 85vh; border: 2px solid #fff;">
    </div>
  `;
  document.body.appendChild(lbOverlay);

  const lbImg = lbOverlay.querySelector('img');
  const lbClose = lbOverlay.querySelector('.modal-close');

  zoomableImages.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lbOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  lbClose.addEventListener('click', () => {
    lbOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  lbOverlay.addEventListener('click', (e) => {
    if (e.target === lbOverlay) {
      lbOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}
