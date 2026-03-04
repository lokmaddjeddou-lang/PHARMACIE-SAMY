// ============================================
// PHARMACIE SAMY - Main Application
// ============================================

// Global state
let currentLang = localStorage.getItem('lang') || 'fr';
let currentTheme = localStorage.getItem('theme') || 'light';

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set language
    setLanguage(currentLang, false);
    
    // Set theme
    setTheme(currentTheme);
    
    // Initialize Supabase
    initSupabase();
    
    // Setup navigation
    setupNavigation();
    
    // Setup language switcher
    setupLanguageSwitcher();
    
    // Load page-specific content
    loadPageContent();
}

// ============================================
// Language & RTL
// ============================================

function setLanguage(lang, save = true) {
    currentLang = lang;
    
    if (save) {
        localStorage.setItem('lang', lang);
    }
    
    // Set dir attribute for RTL
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Update language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update all translatable elements
    updatePageText();
    
    // Update meta tags
    updateMetaTags();
}

function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = t(key, currentLang);
        if (text !== key) {
            el.textContent = text;
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const text = t(key, currentLang);
        if (text !== key) {
            el.placeholder = text;
        }
    });
}

function updateMetaTags() {
    const title = t('meta_title', currentLang);
    const description = t('meta_description', currentLang);
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = description;
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.content = title;
    }
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
        ogDesc.content = description;
    }
}

function setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            setLanguage(lang);
        });
    });
}

// ============================================
// Theme
// ============================================

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'minimal' : 'light';
    setTheme(newTheme);
}

// ============================================
// Navigation
// ============================================

function setupNavigation() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.setAttribute('aria-expanded', nav.classList.contains('active'));
        });
    }
    
    // Set active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Page Content Loading
// ============================================

function loadPageContent() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
        case 'index.html':
        case '':
            loadHomePage();
            break;
        case 'catalogue.html':
            loadCataloguePage();
            break;
        case 'category.html':
            loadCategoryPage();
            break;
        case 'brand.html':
            loadBrandPage();
            break;
        case 'product.html':
            loadProductPage();
            break;
        case 'contact.html':
            loadContactPage();
            break;
    }
}

// ============================================
// Home Page
// ============================================

async function loadHomePage() {
    await loadCategoriesSection();
    await loadFeaturedProducts();
}

async function loadCategoriesSection() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    const { data: categories, error } = await getCategories();
    
    if (error || !categories) {
        container.innerHTML = `<p class="text-center">${t('msg_error', currentLang)}</p>`;
        return;
    }
    
    if (categories.length === 0) {
        container.innerHTML = `<p class="text-center">${t('msg_no_products', currentLang)}</p>`;
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <a href="category.html?slug=${cat.slug}" class="card category-card">
            <div class="card-image">
                <img src="${cat.image_url || 'https://placehold.co/400x250/0d7377/ffffff?text=' + encodeURIComponent(cat.name_fr)}" 
                     alt="${cat['name_' + currentLang] || cat.name_fr}" 
                     loading="lazy">
            </div>
            <div class="card-content">
                <h3 class="card-title">${cat['name_' + currentLang] || cat.name_fr}</h3>
            </div>
        </a>
    `).join('');
}

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    const { data: products, error } = await getProducts({ limit: 8 });
    
    if (error || !products) {
        container.innerHTML = `<p class="text-center">${t('msg_error', currentLang)}</p>`;
        return;
    }
    
    if (products.length === 0) {
        container.innerHTML = `<p class="text-center">${t('msg_no_products', currentLang)}</p>`;
        return;
    }
    
    container.innerHTML = products.map(product => renderProductCard(product)).join('');
}

// ============================================
// Catalogue Page
// ============================================

let catalogueState = {
    page: 1,
    category: '',
    brand: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    minPrice: '',
    maxPrice: ''
};

async function loadCataloguePage() {
    // Setup filters
    setupCatalogueFilters();
    
    // Load filter options
    await loadFilterOptions();
    
    // Load products
    await loadCatalogueProducts();
}

async function loadFilterOptions() {
    // Load categories
    const { data: categories } = await getCategories();
    const categorySelect = document.getElementById('filter-category');
    if (categorySelect && categories) {
        categorySelect.innerHTML = `
            <option value="">${t('filter_all', currentLang)}</option>
            ${categories.map(c => `<option value="${c.id}">${c['name_' + currentLang] || c.name_fr}</option>`).join('')}
        `;
    }
    
    // Load brands
    const { data: brands } = await getBrands();
    const brandSelect = document.getElementById('filter-brand');
    if (brandSelect && brands) {
        brandSelect.innerHTML = `
            <option value="">${t('filter_all', currentLang)}</option>
            ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        `;
    }
}

function setupCatalogueFilters() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            catalogueState.search = this.value;
            catalogueState.page = 1;
            loadCatalogueProducts();
        }, 300));
    }
    
    // Category filter
    const categorySelect = document.getElementById('filter-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            catalogueState.category = this.value;
            catalogueState.page = 1;
            loadCatalogueProducts();
        });
    }
    
    // Brand filter
    const brandSelect = document.getElementById('filter-brand');
    if (brandSelect) {
        brandSelect.addEventListener('change', function() {
            catalogueState.brand = this.value;
            catalogueState.page = 1;
            loadCatalogueProducts();
        });
    }
    
    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const [sortBy, sortOrder] = this.value.split(':');
            catalogueState.sortBy = sortBy;
            catalogueState.sortOrder = sortOrder;
            loadCatalogueProducts();
        });
    }
    
    // Price filters
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    
    if (minPriceInput) {
        minPriceInput.addEventListener('change', function() {
            catalogueState.minPrice = this.value;
            catalogueState.page = 1;
            loadCatalogueProducts();
        });
    }
    
    if (maxPriceInput) {
        maxPriceInput.addEventListener('change', function() {
            catalogueState.maxPrice = this.value;
            catalogueState.page = 1;
            loadCatalogueProducts();
        });
    }
}

async function loadCatalogueProducts() {
    const container = document.getElementById('products-grid');
    const paginationContainer = document.getElementById('pagination');
    
    if (!container) return;
    
    container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
    
    const options = {
        page: catalogueState.page,
        limit: CONFIG.ITEMS_PER_PAGE,
        sortBy: catalogueState.sortBy,
        sortOrder: catalogueState.sortOrder
    };
    
    if (catalogueState.category) options.categoryId = catalogueState.category;
    if (catalogueState.brand) options.brandId = catalogueState.brand;
    if (catalogueState.search) options.search = catalogueState.search;
    if (catalogueState.minPrice) options.minPrice = parseFloat(catalogueState.minPrice);
    if (catalogueState.maxPrice) options.maxPrice = parseFloat(catalogueState.maxPrice);
    
    const { data: products, error, pagination } = await getProducts(options);
    
    if (error) {
        container.innerHTML = `<p class="text-center">${t('msg_error', currentLang)}</p>`;
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `<p class="text-center">${t('msg_no_products', currentLang)}</p>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    container.innerHTML = products.map(product => renderProductCard(product)).join('');
    
    // Render pagination
    if (paginationContainer && pagination) {
        renderPagination(paginationContainer, pagination, (page) => {
            catalogueState.page = page;
            loadCatalogueProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function renderPagination(container, pagination, onPageChange) {
    const { page, totalPages } = pagination;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
            ${t('pagination_prev', currentLang)}
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            html += `
                <button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === page - 2 || i === page + 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }
    
    html += `
        <button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
            ${t('pagination_next', currentLang)}
        </button>
    `;
    
    html += `<span class="pagination-info">${t('pagination_page', currentLang)} ${page} ${t('pagination_of', currentLang)} ${totalPages}</span>`;
    
    container.innerHTML = html;
    
    // Add click handlers
    container.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', function() {
            onPageChange(parseInt(this.dataset.page));
        });
    });
}

// ============================================
// Category Page
// ============================================

async function loadCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = 'catalogue.html';
        return;
    }
    
    const { data: category, error } = await getCategoryBySlug(slug);
    
    if (error || !category) {
        document.getElementById('category-title').textContent = t('msg_error', currentLang);
        return;
    }
    
    // Update page title
    document.getElementById('category-title').textContent = category['name_' + currentLang] || category.name_fr;
    document.getElementById('category-description').textContent = '';
    
    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = category['name_' + currentLang] || category.name_fr;
    }
    
    // Load products in this category
    const container = document.getElementById('products-grid');
    if (container) {
        container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
        
        const { data: products, error: prodError } = await getProducts({ 
            categoryId: category.id,
            limit: 100
        });
        
        if (prodError || !products || products.length === 0) {
            container.innerHTML = `<p class="text-center">${t('msg_no_products', currentLang)}</p>`;
            return;
        }
        
        container.innerHTML = products.map(product => renderProductCard(product)).join('');
    }
    
    // Load brands in this category
    await loadCategoryBrands(category.id);
}

async function loadCategoryBrands(categoryId) {
    const container = document.getElementById('brands-grid');
    if (!container) return;
    
    const { data: products } = await getProducts({ categoryId, limit: 100 });
    
    if (!products || products.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Extract unique brands
    const brands = [...new Map(products.filter(p => p.brand).map(p => [p.brand.id, p.brand])).values()];
    
    container.innerHTML = brands.map(brand => `
        <a href="brand.html?slug=${brand.slug}" class="card">
            <div class="card-content text-center">
                <h4 class="card-title">${brand.name}</h4>
            </div>
        </a>
    `).join('');
}

// ============================================
// Brand Page
// ============================================

async function loadBrandPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = 'catalogue.html';
        return;
    }
    
    const { data: brand, error } = await getBrandBySlug(slug);
    
    if (error || !brand) {
        document.getElementById('brand-title').textContent = t('msg_error', currentLang);
        return;
    }
    
    // Update page title
    document.getElementById('brand-title').textContent = brand.name;
    
    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = brand.name;
    }
    
    // Load products for this brand
    const container = document.getElementById('products-grid');
    if (container) {
        container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
        
        const { data: products, error: prodError } = await getProducts({ 
            brandId: brand.id,
            limit: 100
        });
        
        if (prodError || !products || products.length === 0) {
            container.innerHTML = `<p class="text-center">${t('msg_no_products', currentLang)}</p>`;
            return;
        }
        
        container.innerHTML = products.map(product => renderProductCard(product)).join('');
    }
}

// ============================================
// Product Page
// ============================================

async function loadProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = 'catalogue.html';
        return;
    }
    
    const { data: product, error } = await getProductBySlug(slug);
    
    if (error || !product) {
        document.getElementById('product-detail').innerHTML = `<p class="text-center">${t('msg_error', currentLang)}</p>`;
        return;
    }
    
    // Update page title
    document.title = `${product['name_' + currentLang] || product.name_fr} | ${CONFIG.SITE_NAME}`;
    
    // Update breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    
    if (breadcrumbCategory && product.category) {
        breadcrumbCategory.textContent = product.category['name_' + currentLang] || product.category.name_fr;
        breadcrumbCategory.href = `category.html?slug=${product.category.slug}`;
        breadcrumbCategory.style.display = 'inline';
    }
    
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = product['name_' + currentLang] || product.name_fr;
    }
    
    // Render product detail
    renderProductDetail(product);
}

function renderProductDetail(product) {
    const container = document.getElementById('product-detail');
    if (!container) return;
    
    const name = product['name_' + currentLang] || product.name_fr;
    const description = product['description_' + currentLang] || product.description_fr || '';
    const categoryName = product.category ? (product.category['name_' + currentLang] || product.category.name_fr) : '';
    const brandName = product.brand ? product.brand.name : '';
    
    // Get images
    const images = product.images && product.images.length > 0 
        ? product.images.sort((a, b) => a.sort_order - b.sort_order)
        : [{ image_url: 'https://placehold.co/600x600/0d7377/ffffff?text=' + encodeURIComponent(name) }];
    
    // WhatsApp message
    const whatsappKey = `whatsapp_inquiry_${currentLang}`;
    const whatsappMessage = t(whatsappKey, currentLang, {
        name: name,
        price: product.price,
        url: window.location.href
    });
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    
    container.innerHTML = `
        <div class="product-gallery">
            <div class="product-gallery-main">
                <img id="main-image" src="${images[0].image_url}" alt="${name}">
            </div>
            ${images.length > 1 ? `
                <div class="product-gallery-thumbs">
                    ${images.map((img, idx) => `
                        <div class="product-gallery-thumb ${idx === 0 ? 'active' : ''}" data-src="${img.image_url}">
                            <img src="${img.image_url}" alt="${name} - ${idx + 1}">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="product-info">
            <h1>${name}</h1>
            <div class="price">${product.price} ${CONFIG.CURRENCY}</div>
            
            ${description ? `<div class="description">${description}</div>` : ''}
            
            <div class="product-meta">
                ${categoryName ? `
                    <div class="product-meta-item">
                        <span class="product-meta-label">${t('filter_category', currentLang)}:</span>
                        <span>${categoryName}</span>
                    </div>
                ` : ''}
                ${brandName ? `
                    <div class="product-meta-item">
                        <span class="product-meta-label">${t('filter_brand', currentLang)}:</span>
                        <span>${brandName}</span>
                    </div>
                ` : ''}
                <div class="product-meta-item">
                    <span class="product-meta-label">${t('product_price', currentLang)}:</span>
                    <span>${product.price} ${CONFIG.CURRENCY}</span>
                </div>
            </div>
            
            <a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg btn-block">
                <span>💬</span>
                ${t('product_inquiry', currentLang)}
            </a>
        </div>
    `;
    
    // Setup gallery thumbnails
    container.querySelectorAll('.product-gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const src = this.dataset.src;
            document.getElementById('main-image').src = src;
            container.querySelectorAll('.product-gallery-thumb').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ============================================
// Contact Page
// ============================================

function loadContactPage() {
    // Update WhatsApp link
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappLink) {
        whatsappLink.href = CONFIG.WHATSAPP_URL;
    }
    
    // Update Instagram link
    const instagramLink = document.getElementById('instagram-link');
    if (instagramLink) {
        instagramLink.href = CONFIG.INSTAGRAM_URL;
    }
    
    // Update TikTok link
    const tiktokLink = document.getElementById('tiktok-link');
    if (tiktokLink) {
        tiktokLink.href = CONFIG.TIKTOK_URL;
    }
    
    // Update directions link
    const directionsLink = document.getElementById('directions-link');
    if (directionsLink) {
        directionsLink.href = CONFIG.DIRECTIONS_URL;
    }
}

// ============================================
// Product Card Component
// ============================================

function renderProductCard(product) {
    const name = product['name_' + currentLang] || product.name_fr;
    const imageUrl = product.images && product.images.length > 0
        ? product.images.sort((a, b) => a.sort_order - b.sort_order)[0].image_url
        : 'https://placehold.co/400x300/0d7377/ffffff?text=' + encodeURIComponent(name);
    
    return `
        <a href="product.html?slug=${product.slug}" class="card product-card">
            <div class="card-image">
                <img src="${imageUrl}" alt="${name}" loading="lazy">
                <span class="product-price">${product.price} ${CONFIG.CURRENCY}</span>
            </div>
            <div class="card-content">
                <h3 class="card-title">${name}</h3>
                ${product.brand ? `<p class="card-text">${product.brand.name}</p>` : ''}
            </div>
        </a>
    `;
}

// ============================================
// Utilities
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate slug from string
function generateSlug(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setLanguage,
        setTheme,
        generateSlug,
        debounce
    };
}
