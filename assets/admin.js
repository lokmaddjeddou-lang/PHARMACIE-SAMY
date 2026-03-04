// ============================================
// PHARMACIE SAMY - Admin Panel
// ============================================

// Admin state
let adminState = {
    user: null,
    isAdmin: false,
    currentTab: 'products',
    editingId: null,
    uploadedImages: []
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

async function initializeAdmin() {
    // Initialize Supabase
    initSupabase();
    
    // Check authentication
    await checkAuth();
    
    // Setup event listeners
    setupAdminEventListeners();
}

async function checkAuth() {
    const user = await getCurrentUser();
    
    if (!user) {
        showLoginScreen();
        return;
    }
    
    // Check if admin
    const admin = await isAdmin();
    
    if (!admin) {
        showAccessDenied();
        return;
    }
    
    adminState.user = user;
    adminState.isAdmin = true;
    
    showDashboard();
    loadAdminData();
}

function showLoginScreen() {
    const loginSection = document.getElementById('admin-login');
    const dashboardSection = document.getElementById('admin-dashboard');
    
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
}

function showAccessDenied() {
    const loginSection = document.getElementById('admin-login');
    const dashboardSection = document.getElementById('admin-dashboard');
    const loginMessage = document.getElementById('login-message');
    
    if (loginMessage) {
        loginMessage.innerHTML = `
            <div class="alert alert-error">
                Accès refusé. Vous n'êtes pas administrateur.
            </div>
        `;
    }
    
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
}

function showDashboard() {
    const loginSection = document.getElementById('admin-login');
    const dashboardSection = document.getElementById('admin-dashboard');
    
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    
    // Update user info
    const userEmail = document.getElementById('user-email');
    if (userEmail && adminState.user) {
        userEmail.textContent = adminState.user.email;
    }
}

function setupAdminEventListeners() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Tab navigation
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Add buttons
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal());
    }
    
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openCategoryModal());
    }
    
    const addBrandBtn = document.getElementById('add-brand-btn');
    if (addBrandBtn) {
        addBrandBtn.addEventListener('click', () => openBrandModal());
    }
    
    // Modal close buttons
    document.querySelectorAll('.admin-modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.admin-modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Form submissions
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    const brandForm = document.getElementById('brand-form');
    if (brandForm) {
        brandForm.addEventListener('submit', handleBrandSubmit);
    }
    
    // Image upload
    const imageInput = document.getElementById('product-images');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
}

// ============================================
// Authentication
// ============================================

async function handleLogin() {
    const loginMessage = document.getElementById('login-message');
    
    if (loginMessage) {
        loginMessage.innerHTML = '<div class="spinner" style="margin: 1rem auto;"></div>';
    }
    
    const { data, error } = await signInWithGoogle();
    
    if (error) {
        if (loginMessage) {
            loginMessage.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
        }
    }
}

async function handleLogout() {
    await signOut();
    window.location.reload();
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tab) {
    adminState.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.toggle('hidden', content.dataset.tab !== tab);
    });
    
    // Load tab data
    loadAdminData();
}

async function loadAdminData() {
    switch(adminState.currentTab) {
        case 'products':
            await loadAdminProducts();
            break;
        case 'categories':
            await loadAdminCategories();
            break;
        case 'brands':
            await loadAdminBrands();
            break;
    }
}

// ============================================
// Products Management
// ============================================

async function loadAdminProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>';
    
    // Load categories and brands for filters
    await loadAdminFilterOptions();
    
    const { data: products, error } = await getSupabase()
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .order('created_at', { ascending: false });
    
    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center alert alert-error">${error.message}</td></tr>`;
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun produit</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                ${p.images && p.images[0] ? `<img src="${p.images[0].image_url}" alt="">` : '-'}
            </td>
            <td>${p.name_fr}</td>
            <td>${p.category ? p.category.name_fr : '-'}</td>
            <td>${p.brand ? p.brand.name : '-'}</td>
            <td>${p.price} DZD</td>
            <td>
                <span class="badge ${p.actif ? 'badge-success' : 'badge-secondary'}">
                    ${p.actif ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editProduct('${p.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

async function loadAdminFilterOptions() {
    // Load categories for select
    const { data: categories } = await getCategories();
    const categorySelect = document.getElementById('product-category');
    if (categorySelect && categories) {
        categorySelect.innerHTML = `
            <option value="">Sélectionner une catégorie</option>
            ${categories.map(c => `<option value="${c.id}">${c.name_fr}</option>`).join('')}
        `;
    }
    
    // Load brands for select
    const { data: brands } = await getBrands();
    const brandSelect = document.getElementById('product-brand');
    if (brandSelect && brands) {
        brandSelect.innerHTML = `
            <option value="">Sélectionner une marque</option>
            ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        `;
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    adminState.editingId = productId;
    adminState.uploadedImages = [];
    
    if (productId) {
        title.textContent = 'Modifier le produit';
        loadProductForEdit(productId);
    } else {
        title.textContent = 'Ajouter un produit';
        form.reset();
        document.getElementById('image-preview').innerHTML = '';
    }
    
    modal.classList.remove('hidden');
}

async function loadProductForEdit(productId) {
    const { data: product, error } = await getProductById(productId);
    
    if (error || !product) {
        showNotification('Erreur lors du chargement du produit', 'error');
        return;
    }
    
    document.getElementById('product-name-fr').value = product.name_fr || '';
    document.getElementById('product-name-en').value = product.name_en || '';
    document.getElementById('product-name-ar').value = product.name_ar || '';
    document.getElementById('product-description-fr').value = product.description_fr || '';
    document.getElementById('product-description-en').value = product.description_en || '';
    document.getElementById('product-description-ar').value = product.description_ar || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-brand').value = product.brand_id || '';
    document.getElementById('product-active').checked = product.actif;
    
    // Load images
    if (product.images && product.images.length > 0) {
        adminState.uploadedImages = product.images.map(img => ({
            url: img.image_url,
            path: img.image_url.split('/').pop()
        }));
        renderImagePreviews();
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name_fr: document.getElementById('product-name-fr').value,
        name_en: document.getElementById('product-name-en').value,
        name_ar: document.getElementById('product-name-ar').value,
        description_fr: document.getElementById('product-description-fr').value,
        description_en: document.getElementById('product-description-en').value,
        description_ar: document.getElementById('product-description-ar').value,
        price: parseFloat(document.getElementById('product-price').value),
        category_id: document.getElementById('product-category').value || null,
        brand_id: document.getElementById('product-brand').value || null,
        actif: document.getElementById('product-active').checked,
        slug: generateSlug(document.getElementById('product-name-fr').value)
    };
    
    let result;
    
    if (adminState.editingId) {
        result = await updateProduct(adminState.editingId, formData);
    } else {
        result = await createProduct(formData);
    }
    
    if (result.error) {
        showNotification(result.error.message, 'error');
        return;
    }
    
    // Save images
    const productId = adminState.editingId || result.data.id;
    await saveProductImages(productId);
    
    showNotification('Produit sauvegardé avec succès', 'success');
    closeAllModals();
    loadAdminProducts();
}

async function saveProductImages(productId) {
    // Delete existing images if editing
    if (adminState.editingId) {
        const { data: existingImages } = await getProductImages(productId);
        for (const img of existingImages || []) {
            await deleteProductImage(img.id);
        }
    }
    
    // Add new images
    for (let i = 0; i < adminState.uploadedImages.length; i++) {
        const img = adminState.uploadedImages[i];
        await addProductImage({
            product_id: productId,
            image_url: img.url,
            sort_order: i
        });
    }
}

async function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        return;
    }
    
    const { error } = await deleteProduct(productId);
    
    if (error) {
        showNotification(error.message, 'error');
        return;
    }
    
    showNotification('Produit supprimé avec succès', 'success');
    loadAdminProducts();
}

// ============================================
// Categories Management
// ============================================

async function loadAdminCategories() {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';
    
    const { data: categories, error } = await getSupabase()
        .from('categories')
        .select('*')
        .order('ordre', { ascending: true });
    
    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center alert alert-error">${error.message}</td></tr>`;
        return;
    }
    
    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Aucune catégorie</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(c => `
        <tr>
            <td>
                ${c.image_url ? `<img src="${c.image_url}" alt="">` : '-'}
            </td>
            <td>${c.name_fr}</td>
            <td>${c.ordre}</td>
            <td>
                <span class="badge ${c.actif ? 'badge-success' : 'badge-secondary'}">
                    ${c.actif ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editCategory('${c.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    
    adminState.editingId = categoryId;
    
    if (categoryId) {
        title.textContent = 'Modifier la catégorie';
        loadCategoryForEdit(categoryId);
    } else {
        title.textContent = 'Ajouter une catégorie';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

async function loadCategoryForEdit(categoryId) {
    const { data: category, error } = await getSupabase()
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
    
    if (error || !category) {
        showNotification('Erreur lors du chargement de la catégorie', 'error');
        return;
    }
    
    document.getElementById('category-name-fr').value = category.name_fr || '';
    document.getElementById('category-name-en').value = category.name_en || '';
    document.getElementById('category-name-ar').value = category.name_ar || '';
    document.getElementById('category-ordre').value = category.ordre || 0;
    document.getElementById('category-active').checked = category.actif;
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = {
        name_fr: document.getElementById('category-name-fr').value,
        name_en: document.getElementById('category-name-en').value,
        name_ar: document.getElementById('category-name-ar').value,
        ordre: parseInt(document.getElementById('category-ordre').value) || 0,
        actif: document.getElementById('category-active').checked,
        slug: generateSlug(document.getElementById('category-name-fr').value)
    };
    
    let result;
    
    if (adminState.editingId) {
        result = await updateCategory(adminState.editingId, formData);
    } else {
        result = await createCategory(formData);
    }
    
    if (result.error) {
        showNotification(result.error.message, 'error');
        return;
    }
    
    showNotification('Catégorie sauvegardée avec succès', 'success');
    closeAllModals();
    loadAdminCategories();
}

async function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

async function deleteCategory(categoryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        return;
    }
    
    const { error } = await deleteCategory(categoryId);
    
    if (error) {
        showNotification(error.message, 'error');
        return;
    }
    
    showNotification('Catégorie supprimée avec succès', 'success');
    loadAdminCategories();
}

// ============================================
// Brands Management
// ============================================

async function loadAdminBrands() {
    const tbody = document.getElementById('brands-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner"></div></td></tr>';
    
    const { data: brands, error } = await getSupabase()
        .from('brands')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center alert alert-error">${error.message}</td></tr>`;
        return;
    }
    
    if (!brands || brands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Aucune marque</td></tr>';
        return;
    }
    
    tbody.innerHTML = brands.map(b => `
        <tr>
            <td>
                ${b.logo_url ? `<img src="${b.logo_url}" alt="">` : '-'}
            </td>
            <td>${b.name}</td>
            <td>
                <span class="badge ${b.actif ? 'badge-success' : 'badge-secondary'}">
                    ${b.actif ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editBrand('${b.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBrand('${b.id}')">Supprimer</button>
            </td>
        </tr>
    `).join('');
}

function openBrandModal(brandId = null) {
    const modal = document.getElementById('brand-modal');
    const title = document.getElementById('brand-modal-title');
    const form = document.getElementById('brand-form');
    
    adminState.editingId = brandId;
    
    if (brandId) {
        title.textContent = 'Modifier la marque';
        loadBrandForEdit(brandId);
    } else {
        title.textContent = 'Ajouter une marque';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

async function loadBrandForEdit(brandId) {
    const { data: brand, error } = await getSupabase()
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();
    
    if (error || !brand) {
        showNotification('Erreur lors du chargement de la marque', 'error');
        return;
    }
    
    document.getElementById('brand-name').value = brand.name || '';
    document.getElementById('brand-active').checked = brand.actif;
}

async function handleBrandSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('brand-name').value,
        actif: document.getElementById('brand-active').checked,
        slug: generateSlug(document.getElementById('brand-name').value)
    };
    
    let result;
    
    if (adminState.editingId) {
        result = await updateBrand(adminState.editingId, formData);
    } else {
        result = await createBrand(formData);
    }
    
    if (result.error) {
        showNotification(result.error.message, 'error');
        return;
    }
    
    showNotification('Marque sauvegardée avec succès', 'success');
    closeAllModals();
    loadAdminBrands();
}

async function editBrand(brandId) {
    openBrandModal(brandId);
}

async function deleteBrand(brandId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
        return;
    }
    
    const { error } = await deleteBrand(brandId);
    
    if (error) {
        showNotification(error.message, 'error');
        return;
    }
    
    showNotification('Marque supprimée avec succès', 'success');
    loadAdminBrands();
}

// ============================================
// Image Upload
// ============================================

async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        // Upload to Supabase Storage
        const { data, error } = await uploadImage(file, 'products');
        
        if (error) {
            showNotification(`Erreur lors de l'upload: ${error.message}`, 'error');
            continue;
        }
        
        adminState.uploadedImages.push({
            url: data.url,
            path: data.path
        });
    }
    
    renderImagePreviews();
}

function renderImagePreviews() {
    const container = document.getElementById('image-preview');
    if (!container) return;
    
    container.innerHTML = adminState.uploadedImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img.url}" alt="Preview ${idx + 1}">
            <button type="button" class="image-preview-remove" onclick="removeImage(${idx})">×</button>
        </div>
    `).join('');
}

function removeImage(index) {
    adminState.uploadedImages.splice(index, 1);
    renderImagePreviews();
}

// ============================================
// Modal Utilities
// ============================================

function closeAllModals() {
    document.querySelectorAll('.admin-modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    adminState.editingId = null;
    adminState.uploadedImages = [];
}

// ============================================
// Notifications
// ============================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for inline onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editBrand = editBrand;
window.deleteBrand = deleteBrand;
window.removeImage = removeImage;
