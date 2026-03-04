// ============================================
// PHARMACIE SAMY - Supabase Client
// ============================================

// Initialize Supabase client
let supabase = null;

// Initialize Supabase when config is loaded
function initSupabase() {
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded. Please load config.js first.');
        return null;
    }
    
    if (typeof supabaseJs === 'undefined') {
        console.error('Supabase JS library not loaded.');
        return null;
    }
    
    supabase = supabaseJs.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
    );
    
    return supabase;
}

// Get Supabase client (initialize if needed)
function getSupabase() {
    if (!supabase) {
        return initSupabase();
    }
    return supabase;
}

// Check if user is authenticated
async function isAuthenticated() {
    const client = getSupabase();
    if (!client) return false;
    
    const { data: { session } } = await client.auth.getSession();
    return !!session;
}

// Get current user
async function getCurrentUser() {
    const client = getSupabase();
    if (!client) return null;
    
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// Check if current user is admin
async function isAdmin() {
    const client = getSupabase();
    if (!client) return false;
    
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await client
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    return !!data && !error;
}

// Sign in with Google
async function signInWithGoogle() {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/admin.html'
        }
    });
    
    return { data, error };
}

// Sign out
async function signOut() {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client.auth.signOut();
    return { error };
}

// ============================================
// Categories API
// ============================================

async function getCategories() {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('actif', true)
        .order('ordre', { ascending: true });
    
    return { data, error };
}

async function getCategoryBySlug(slug) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('actif', true)
        .single();
    
    return { data, error };
}

async function createCategory(category) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('categories')
        .insert([category])
        .select()
        .single();
    
    return { data, error };
}

async function updateCategory(id, category) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
    
    return { data, error };
}

async function deleteCategory(id) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client
        .from('categories')
        .delete()
        .eq('id', id);
    
    return { error };
}

// ============================================
// Brands API
// ============================================

async function getBrands() {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('brands')
        .select('*')
        .eq('actif', true)
        .order('name', { ascending: true });
    
    return { data, error };
}

async function getBrandBySlug(slug) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .eq('actif', true)
        .single();
    
    return { data, error };
}

async function createBrand(brand) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('brands')
        .insert([brand])
        .select()
        .single();
    
    return { data, error };
}

async function updateBrand(id, brand) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('brands')
        .update(brand)
        .eq('id', id)
        .select()
        .single();
    
    return { data, error };
}

async function deleteBrand(id) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client
        .from('brands')
        .delete()
        .eq('id', id);
    
    return { error };
}

// ============================================
// Products API
// ============================================

async function getProducts(options = {}) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const {
        categoryId = null,
        brandId = null,
        search = null,
        minPrice = null,
        maxPrice = null,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 12
    } = options;
    
    let query = client
        .from('products')
        .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*)
        `)
        .eq('actif', true);
    
    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }
    
    if (brandId) {
        query = query.eq('brand_id', brandId);
    }
    
    if (search) {
        query = query.or(`name_fr.ilike.%${search}%,name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
    }
    
    if (minPrice !== null) {
        query = query.gte('price', minPrice);
    }
    
    if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
    }
    
    // Get total count for pagination
    const { count } = await query;
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    return { 
        data, 
        error, 
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
}

async function getProductBySlug(slug) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('products')
        .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*)
        `)
        .eq('slug', slug)
        .eq('actif', true)
        .single();
    
    return { data, error };
}

async function getProductById(id) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('products')
        .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*)
        `)
        .eq('id', id)
        .single();
    
    return { data, error };
}

async function createProduct(product) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('products')
        .insert([product])
        .select()
        .single();
    
    return { data, error };
}

async function updateProduct(id, product) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
    
    return { data, error };
}

async function deleteProduct(id) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client
        .from('products')
        .delete()
        .eq('id', id);
    
    return { error };
}

// ============================================
// Product Images API
// ============================================

async function getProductImages(productId) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
    
    return { data, error };
}

async function addProductImage(image) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('product_images')
        .insert([image])
        .select()
        .single();
    
    return { data, error };
}

async function deleteProductImage(id) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client
        .from('product_images')
        .delete()
        .eq('id', id);
    
    return { error };
}

// ============================================
// Storage API
// ============================================

async function uploadImage(file, path) {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { data, error } = await client
        .storage
        .from(CONFIG.STORAGE_BUCKET)
        .upload(filePath, file);
    
    if (error) {
        return { data: null, error };
    }
    
    // Get public URL
    const { data: { publicUrl } } = client
        .storage
        .from(CONFIG.STORAGE_BUCKET)
        .getPublicUrl(filePath);
    
    return { data: { path: filePath, url: publicUrl }, error: null };
}

async function deleteImage(path) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client
        .storage
        .from(CONFIG.STORAGE_BUCKET)
        .remove([path]);
    
    return { error };
}

// ============================================
// Export for use in other files
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabase,
        initSupabase,
        isAuthenticated,
        getCurrentUser,
        isAdmin,
        signInWithGoogle,
        signOut,
        getCategories,
        getCategoryBySlug,
        createCategory,
        updateCategory,
        deleteCategory,
        getBrands,
        getBrandBySlug,
        createBrand,
        updateBrand,
        deleteBrand,
        getProducts,
        getProductBySlug,
        getProductById,
        createProduct,
        updateProduct,
        deleteProduct,
        getProductImages,
        addProductImage,
        deleteProductImage,
        uploadImage,
        deleteImage
    };
}
