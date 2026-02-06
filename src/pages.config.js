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
import AIMatches from './pages/AIMatches';
import AboutUs from './pages/AboutUs';
import AccountSettings from './pages/AccountSettings';
import ActiveRide from './pages/ActiveRide';
import ActiveWalkDashboard from './pages/ActiveWalkDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminFinanceDashboard from './pages/AdminFinanceDashboard';
import AdminProductManagement from './pages/AdminProductManagement';
import AdminShelterVerification from './pages/AdminShelterVerification';
import AdminShopHub from './pages/AdminShopHub';
import AdoptionListingDetails from './pages/AdoptionListingDetails';
import AdoptionListings from './pages/AdoptionListings';
import AffiliateDashboard from './pages/AffiliateDashboard';
import ApiDocs from './pages/ApiDocs';
import ApplyForAdoption from './pages/ApplyForAdoption';
import ApproveAnnouncements from './pages/ApproveAnnouncements';
import BecomeProfessional from './pages/BecomeProfessional';
import BookService from './pages/BookService';
import Chat from './pages/Chat';
import CheckoutSuccess from './pages/CheckoutSuccess';
import ClientDashboard from './pages/ClientDashboard';
import Community from './pages/Community';
import ConnectedAccountStorefront from './pages/ConnectedAccountStorefront';
import Contact from './pages/Contact';
import CookiesPolicy from './pages/CookiesPolicy';
import CreateAdoptionListing from './pages/CreateAdoptionListing';
import Dashboard from './pages/Dashboard';
import DogConnectPremium from './pages/DogConnectPremium';
import DogConnectRewards from './pages/DogConnectRewards';
import DogSittingServices from './pages/DogSittingServices';
import EditTrainerProfile from './pages/EditTrainerProfile';
import EditWalkerProfile from './pages/EditWalkerProfile';
import EmergencyWalkDetails from './pages/EmergencyWalkDetails';
import EmployeeDashboard from './pages/EmployeeDashboard';
import FAQ from './pages/FAQ';
import Favorites from './pages/Favorites';
import FiscalSettings from './pages/FiscalSettings';
import ForumTopicDetails from './pages/ForumTopicDetails';
import Gamification from './pages/Gamification';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Leaderboard from './pages/Leaderboard';
import LiveWalkTracking from './pages/LiveWalkTracking';
import LoyaltyRewards from './pages/LoyaltyRewards';
import ManageAdoptionListings from './pages/ManageAdoptionListings';
import ManageAvailability from './pages/ManageAvailability';
import ManageMyAdoptions from './pages/ManageMyAdoptions';
import MembershipPlans from './pages/MembershipPlans';
import MembershipSuccess from './pages/MembershipSuccess';
import ModerationPanel from './pages/ModerationPanel';
import MyAdoptionApplications from './pages/MyAdoptionApplications';
import MyBookings from './pages/MyBookings';
import MyOrders from './pages/MyOrders';
import MyProfile from './pages/MyProfile';
import MyRedemptions from './pages/MyRedemptions';
import MyWallet from './pages/MyWallet';
import MyWishlist from './pages/MyWishlist';
import Notifications from './pages/Notifications';
import OrderSuccess from './pages/OrderSuccess';
import OwnerSubscriptions from './pages/OwnerSubscriptions';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerDetails from './pages/PartnerDetails';
import PartnerServices from './pages/PartnerServices';
import Partners from './pages/Partners';
import PaymentMethods from './pages/PaymentMethods';
import PaymentSetup from './pages/PaymentSetup';
import PostEmergency from './pages/PostEmergency';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import RegisterCompany from './pages/RegisterCompany';
import ScheduledWalks from './pages/ScheduledWalks';
import ShelterDashboard from './pages/ShelterDashboard';
import ShelterProfile from './pages/ShelterProfile';
import ShelterRegister from './pages/ShelterRegister';
import Shop from './pages/Shop';
import Sitemap from './pages/Sitemap';
import SocialEvents from './pages/SocialEvents';
import SocialFeed from './pages/SocialFeed';
import StaticExport from './pages/StaticExport';
import StripeConnectSetup from './pages/StripeConnectSetup';
import Subscriptions from './pages/Subscriptions';
import TermsOfService from './pages/TermsOfService';
import TestPayments from './pages/TestPayments';
import TrainerDetails from './pages/TrainerDetails';
import Trainers from './pages/Trainers';
import UserProfile from './pages/UserProfile';
import VeterinaryDashboard from './pages/VeterinaryDashboard';
import WalkHistory from './pages/WalkHistory';
import WalkerDetails from './pages/WalkerDetails';
import WalkerTrack from './pages/WalkerTrack';
import WalkerWallet from './pages/WalkerWallet';
import AnimalProfile from './pages/AnimalProfile';
import EditAnimalProfile from './pages/EditAnimalProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIMatches": AIMatches,
    "AboutUs": AboutUs,
    "AccountSettings": AccountSettings,
    "ActiveRide": ActiveRide,
    "ActiveWalkDashboard": ActiveWalkDashboard,
    "AdminDashboard": AdminDashboard,
    "AdminFinanceDashboard": AdminFinanceDashboard,
    "AdminProductManagement": AdminProductManagement,
    "AdminShelterVerification": AdminShelterVerification,
    "AdminShopHub": AdminShopHub,
    "AdoptionListingDetails": AdoptionListingDetails,
    "AdoptionListings": AdoptionListings,
    "AffiliateDashboard": AffiliateDashboard,
    "ApiDocs": ApiDocs,
    "ApplyForAdoption": ApplyForAdoption,
    "ApproveAnnouncements": ApproveAnnouncements,
    "BecomeProfessional": BecomeProfessional,
    "BookService": BookService,
    "Chat": Chat,
    "CheckoutSuccess": CheckoutSuccess,
    "ClientDashboard": ClientDashboard,
    "Community": Community,
    "ConnectedAccountStorefront": ConnectedAccountStorefront,
    "Contact": Contact,
    "CookiesPolicy": CookiesPolicy,
    "CreateAdoptionListing": CreateAdoptionListing,
    "Dashboard": Dashboard,
    "DogConnectPremium": DogConnectPremium,
    "DogConnectRewards": DogConnectRewards,
    "DogSittingServices": DogSittingServices,
    "EditTrainerProfile": EditTrainerProfile,
    "EditWalkerProfile": EditWalkerProfile,
    "EmergencyWalkDetails": EmergencyWalkDetails,
    "EmployeeDashboard": EmployeeDashboard,
    "FAQ": FAQ,
    "Favorites": Favorites,
    "FiscalSettings": FiscalSettings,
    "ForumTopicDetails": ForumTopicDetails,
    "Gamification": Gamification,
    "Home": Home,
    "Landing": Landing,
    "Leaderboard": Leaderboard,
    "LiveWalkTracking": LiveWalkTracking,
    "LoyaltyRewards": LoyaltyRewards,
    "ManageAdoptionListings": ManageAdoptionListings,
    "ManageAvailability": ManageAvailability,
    "ManageMyAdoptions": ManageMyAdoptions,
    "MembershipPlans": MembershipPlans,
    "MembershipSuccess": MembershipSuccess,
    "ModerationPanel": ModerationPanel,
    "MyAdoptionApplications": MyAdoptionApplications,
    "MyBookings": MyBookings,
    "MyOrders": MyOrders,
    "MyProfile": MyProfile,
    "MyRedemptions": MyRedemptions,
    "MyWallet": MyWallet,
    "MyWishlist": MyWishlist,
    "Notifications": Notifications,
    "OrderSuccess": OrderSuccess,
    "OwnerSubscriptions": OwnerSubscriptions,
    "PartnerDashboard": PartnerDashboard,
    "PartnerDetails": PartnerDetails,
    "PartnerServices": PartnerServices,
    "Partners": Partners,
    "PaymentMethods": PaymentMethods,
    "PaymentSetup": PaymentSetup,
    "PostEmergency": PostEmergency,
    "PrivacyPolicy": PrivacyPolicy,
    "ProfessionalDashboard": ProfessionalDashboard,
    "RegisterCompany": RegisterCompany,
    "ScheduledWalks": ScheduledWalks,
    "ShelterDashboard": ShelterDashboard,
    "ShelterProfile": ShelterProfile,
    "ShelterRegister": ShelterRegister,
    "Shop": Shop,
    "Sitemap": Sitemap,
    "SocialEvents": SocialEvents,
    "SocialFeed": SocialFeed,
    "StaticExport": StaticExport,
    "StripeConnectSetup": StripeConnectSetup,
    "Subscriptions": Subscriptions,
    "TermsOfService": TermsOfService,
    "TestPayments": TestPayments,
    "TrainerDetails": TrainerDetails,
    "Trainers": Trainers,
    "UserProfile": UserProfile,
    "VeterinaryDashboard": VeterinaryDashboard,
    "WalkHistory": WalkHistory,
    "WalkerDetails": WalkerDetails,
    "WalkerTrack": WalkerTrack,
    "WalkerWallet": WalkerWallet,
    "AnimalProfile": AnimalProfile,
    "EditAnimalProfile": EditAnimalProfile,
}

export const pagesConfig = {
    mainPage: "WalkerDetails",
    Pages: PAGES,
    Layout: __Layout,
};