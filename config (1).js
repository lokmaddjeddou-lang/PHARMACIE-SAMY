// ============================================
// PHARMACIE SAMY - Configuration
// ============================================

// ⚠️ IMPORTANT: Replace these values with your Supabase credentials
const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    
    // Site Configuration
    SITE_NAME: 'PHARMACIE SAMY',
    SITE_URL: window.location.origin,
    
    // Contact Information
    WHATSAPP_NUMBER: '213770762987',
    WHATSAPP_URL: 'https://wa.me/213770762987',
    INSTAGRAM_URL: 'https://www.instagram.com/pharmaciesamy/',
    TIKTOK_URL: 'https://www.tiktok.com/@pharmacie.samy',
    MAPS_URL: 'https://www.google.com/maps/place/Pharmacie+AMAROUAYACHE+Samy+Les+sources/data=!4m2!3m1!1s0x0:0xcdf511b151908618?sa=X&ved=1t:2428&ictx=111',
    DIRECTIONS_URL: 'https://www.google.com/maps?cid=429266545775872780',
    
    // Business Hours
    HOURS: '7/7 — 08:00 à 00:00',
    
    // Currency
    CURRENCY: 'DZD',
    
    // Pagination
    ITEMS_PER_PAGE: 12,
    
    // Storage Bucket
    STORAGE_BUCKET: 'product-images',
    
    // Default Language
    DEFAULT_LANG: 'fr',
    
    // Supported Languages
    LANGUAGES: ['fr', 'en', 'ar'],
    
    // Theme
    DEFAULT_THEME: 'light' // 'light' or 'minimal'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
