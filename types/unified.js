"use strict";
// ============================================
// 360AutoMVP Unified Types Package
// Version: 2.0 - Production Ready
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_CONFIGS = void 0;
exports.isCarListing = isCarListing;
exports.isHorseListing = isHorseListing;
exports.isRealEstateListing = isRealEstateListing;
// ============================================
// 11. TYPE GUARDS
// ============================================
function isCarListing(listing) {
    return listing.category === 'car';
}
function isHorseListing(listing) {
    return listing.category === 'horse';
}
function isRealEstateListing(listing) {
    return listing.category === 'real_estate';
}
exports.TIER_CONFIGS = {
    free: {
        tier: 'free',
        name: 'Базовый',
        price: 0,
        maxListings: 2,
        maxTeamMembers: 1,
        hasAnalytics: false,
        hasAdvancedAnalytics: false,
        hasLogo: false,
        hasDescription: false,
        hasPriorityBoost: 0,
        hasBoostDiscount: 0,
        hasAutoRenew: false,
        hasTemplates: false,
        hasBulkUpload: false,
        hasVerification: false,
        hasBrandedPage: false,
        hasQRCode: false,
        hasBanner: false,
        features: ['До 2 объявлений', 'Базовая поддержка'],
    },
    lite: {
        tier: 'lite',
        name: 'Лайт',
        price: 300,
        maxListings: 10,
        maxTeamMembers: 1,
        hasAnalytics: true,
        hasAdvancedAnalytics: false,
        hasLogo: true,
        hasDescription: false,
        hasPriorityBoost: 0,
        hasBoostDiscount: 20,
        hasAutoRenew: false,
        hasTemplates: false,
        hasBulkUpload: false,
        hasVerification: false,
        hasBrandedPage: false,
        hasQRCode: false,
        hasBanner: false,
        features: ['До 10 объявлений', 'Логотип компании', 'Базовая аналитика', 'Скидка на Boost -20%'],
    },
    business: {
        tier: 'business',
        name: 'Бизнес',
        price: 500,
        maxListings: 30,
        maxTeamMembers: 3,
        hasAnalytics: true,
        hasAdvancedAnalytics: true,
        hasLogo: true,
        hasDescription: true,
        hasPriorityBoost: 20,
        hasBoostDiscount: 30,
        hasAutoRenew: true,
        hasTemplates: true,
        hasBulkUpload: false,
        hasVerification: false,
        hasBrandedPage: false,
        hasQRCode: false,
        hasBanner: false,
        features: ['До 30 объявлений', 'Логотип + описание', 'До 3 менеджеров', 'Расширенная аналитика', 'Приоритет +20%', 'Шаблоны', 'Скидка на Boost -30%'],
    },
    pro: {
        tier: 'pro',
        name: 'Профи',
        price: 1500,
        maxListings: 'unlimited',
        maxTeamMembers: 'unlimited',
        hasAnalytics: true,
        hasAdvancedAnalytics: true,
        hasLogo: true,
        hasDescription: true,
        hasPriorityBoost: 50,
        hasBoostDiscount: 50,
        hasAutoRenew: true,
        hasTemplates: true,
        hasBulkUpload: true,
        hasVerification: true,
        hasBrandedPage: true,
        hasQRCode: true,
        hasBanner: true,
        features: ['Безлимит объявлений', 'Безлимит менеджеров', 'Приоритет +50%', 'Bulk загрузка', 'Верификация PRO', 'Брендированная страница', 'QR код', 'Скидка на Boost -50%'],
    },
};
// ============================================
// EXPORT ALL TYPES
// ============================================
// All types are already exported above
