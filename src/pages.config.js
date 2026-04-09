/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

// All pages are lazy-loaded for route-level code splitting.
// Each page becomes its own chunk, loaded only when the user navigates to it.
// Expected impact: ~60-70% reduction in initial bundle size.
const page = (importFn) => lazy(importFn);

export const PAGES = {
    "AboutUs": page(() => import('./pages/AboutUs')),
    "AccountSettings": page(() => import('./pages/AccountSettings')),


    "AdminDashboard": page(() => import('./pages/AdminDashboard')),
    "AdminDebug": page(() => import('./pages/AdminDebug')),
    "AdminFinanceDashboard": page(() => import('./pages/AdminFinanceDashboard')),
    "AdminProfessionalApprovals": page(() => import('./pages/AdminProfessionalApprovals')),
    "AdminProductManagement": page(() => import('./pages/AdminProductManagement')),
    "AdminShelterVerification": page(() => import('./pages/AdminShelterVerification')),
    "AdminShopHub": page(() => import('./pages/AdminShopHub')),
    "AffiliateDashboard": page(() => import('./pages/AffiliateDashboard')),
    "AnimalProfile": page(() => import('./pages/AnimalProfile')),
    "ApiDocs": page(() => import('./pages/ApiDocs')),
    "ApproveAnnouncements": page(() => import('./pages/ApproveAnnouncements')),
    "BecomeProfessional": page(() => import('./pages/BecomeProfessional')),
    "BookService": page(() => import('./pages/BookService')),
    "CheckoutSuccess": page(() => import('./pages/CheckoutSuccess')),
    "ClientDashboard": page(() => import('./pages/ClientDashboard')),
    "ConnectedAccountStorefront": page(() => import('./pages/ConnectedAccountStorefront')),
    "Contact": page(() => import('./pages/Contact')),
    "CookiesPolicy": page(() => import('./pages/CookiesPolicy')),
    "Dashboard": page(() => import('./pages/Dashboard')),
    "DogConnectPremium": page(() => import('./pages/DogConnectPremium')),
    "DogConnectRewards": page(() => import('./pages/DogConnectRewards')),
    "DogSittingServices": page(() => import('./pages/DogSittingServices')),
    "EditAnimalProfile": page(() => import('./pages/EditAnimalProfile')),
    "EditTrainerProfile": page(() => import('./pages/EditTrainerProfile')),
    "EditWalkerProfile": page(() => import('./pages/EditWalkerProfile')),
    "EmergencyWalkDetails": page(() => import('./pages/EmergencyWalkDetails')),
    "EmployeeDashboard": page(() => import('./pages/EmployeeDashboard')),
    "FAQ": page(() => import('./pages/FAQ')),
    "Favorites": page(() => import('./pages/Favorites')),
    "FiscalSettings": page(() => import('./pages/FiscalSettings')),
    "ForumTopicDetails": page(() => import('./pages/ForumTopicDetails')),
    "Gamification": page(() => import('./pages/Gamification')),
    "Landing": page(() => import('./pages/Landing')),


    "LoyaltyRewards": page(() => import('./pages/LoyaltyRewards')),

    "ManageAvailability": page(() => import('./pages/ManageAvailability')),

    "MembershipPlans": page(() => import('./pages/MembershipPlans')),
    "MembershipSuccess": page(() => import('./pages/MembershipSuccess')),
    "ModerationPanel": page(() => import('./pages/ModerationPanel')),

    "MyBookings": page(() => import('./pages/MyBookings')),

    "MyProfile": page(() => import('./pages/MyProfile')),
    "MyRedemptions": page(() => import('./pages/MyRedemptions')),
    "MyOrders": page(() => import('./pages/MyOrders')),
    "MyWallet": page(() => import('./pages/MyWallet')),
    "MyWishlist": page(() => import('./pages/MyWishlist')),
    "Notifications": page(() => import('./pages/Notifications')),
    "OrderSuccess": page(() => import('./pages/OrderSuccess')),
    "OwnerSubscriptions": page(() => import('./pages/OwnerSubscriptions')),
    "PartnerContentSubmission": page(() => import('./pages/PartnerContentSubmission')),
    "PartnerDashboard": page(() => import('./pages/PartnerDashboard')),
    "PartnerDetails": page(() => import('./pages/PartnerDetails')),
    "PartnerServices": page(() => import('./pages/PartnerServices')),
    "Partners": page(() => import('./pages/Partners')),
    "PaymentMethods": page(() => import('./pages/PaymentMethods')),
    "PaymentSetup": page(() => import('./pages/PaymentSetup')),

    "PrivacyPolicy": page(() => import('./pages/PrivacyPolicy')),
    "RegisterCompany": page(() => import('./pages/RegisterCompany')),
    "RequestWalk": page(() => import('./pages/RequestWalk')),
    "ScheduledWalks": page(() => import('./pages/ScheduledWalks')),
    "Shop": page(() => import('./pages/Shop')),
    "ShelterDashboard": page(() => import('./pages/ShelterDashboard')),
    "ShelterProfile": page(() => import('./pages/ShelterProfile')),
    "ShelterRegister": page(() => import('./pages/ShelterRegister')),
    "Shelters": page(() => import('./pages/Shelters')),

    "Sitemap": page(() => import('./pages/Sitemap')),


    "StaticExport": page(() => import('./pages/StaticExport')),
    "StripeConnectSetup": page(() => import('./pages/StripeConnectSetup')),
    "Subscriptions": page(() => import('./pages/Subscriptions')),
    "TermsOfService": page(() => import('./pages/TermsOfService')),
    "TestPayments": page(() => import('./pages/TestPayments')),
    "TrainerDetails": page(() => import('./pages/TrainerDetails')),
    "Trainers": page(() => import('./pages/Trainers')),
    "UserProfile": page(() => import('./pages/UserProfile')),

    "WalkHistory": page(() => import('./pages/WalkHistory')),
    "WalkerDetails": page(() => import('./pages/WalkerDetails')),

    "WalkerWallet": page(() => import('./pages/WalkerWallet')),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};