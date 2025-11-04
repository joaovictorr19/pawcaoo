import Home from './pages/Home';
import WalkerDetails from './pages/WalkerDetails';
import MyBookings from './pages/MyBookings';
import BecomeWalker from './pages/BecomeWalker';
import MyProfile from './pages/MyProfile';
import EmergencyWalkDetails from './pages/EmergencyWalkDetails';
import PostEmergency from './pages/PostEmergency';
import Favorites from './pages/Favorites';
import DogSittingServices from './pages/DogSittingServices';
import Messages from './pages/Messages';
import ScheduledWalks from './pages/ScheduledWalks';
import Notifications from './pages/Notifications';
import WalkHistory from './pages/WalkHistory';
import Subscriptions from './pages/Subscriptions';
import LoyaltyRewards from './pages/LoyaltyRewards';
import Partners from './pages/Partners';
import PartnerDetails from './pages/PartnerDetails';
import Trainers from './pages/Trainers';
import TrainerDetails from './pages/TrainerDetails';
import BecomeTrainer from './pages/BecomeTrainer';
import ManageAvailability from './pages/ManageAvailability';
import OwnerSubscriptions from './pages/OwnerSubscriptions';
import PartnerDashboard from './pages/PartnerDashboard';
import LiveWalkTracking from './pages/LiveWalkTracking';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import Leaderboard from './pages/Leaderboard';
import Community from './pages/Community';
import SocialFeed from './pages/SocialFeed';
import ForumTopicDetails from './pages/ForumTopicDetails';
import AccountSettings from './pages/AccountSettings';
import AdminDashboard from './pages/AdminDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiesPolicy from './pages/CookiesPolicy';
import PaymentMethods from './pages/PaymentMethods';
import PaymentSetup from './pages/PaymentSetup';
import StripeConnectSetup from './pages/StripeConnectSetup';
import ConnectedAccountStorefront from './pages/ConnectedAccountStorefront';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Landing from './pages/Landing';
import UserProfile from './pages/UserProfile';
import SocialEvents from './pages/SocialEvents';
import ModerationPanel from './pages/ModerationPanel';
import PartnerServices from './pages/PartnerServices';
import BookService from './pages/BookService';
import VeterinaryDashboard from './pages/VeterinaryDashboard';
import ApproveAnnouncements from './pages/ApproveAnnouncements';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "WalkerDetails": WalkerDetails,
    "MyBookings": MyBookings,
    "BecomeWalker": BecomeWalker,
    "MyProfile": MyProfile,
    "EmergencyWalkDetails": EmergencyWalkDetails,
    "PostEmergency": PostEmergency,
    "Favorites": Favorites,
    "DogSittingServices": DogSittingServices,
    "Messages": Messages,
    "ScheduledWalks": ScheduledWalks,
    "Notifications": Notifications,
    "WalkHistory": WalkHistory,
    "Subscriptions": Subscriptions,
    "LoyaltyRewards": LoyaltyRewards,
    "Partners": Partners,
    "PartnerDetails": PartnerDetails,
    "Trainers": Trainers,
    "TrainerDetails": TrainerDetails,
    "BecomeTrainer": BecomeTrainer,
    "ManageAvailability": ManageAvailability,
    "OwnerSubscriptions": OwnerSubscriptions,
    "PartnerDashboard": PartnerDashboard,
    "LiveWalkTracking": LiveWalkTracking,
    "ProfessionalDashboard": ProfessionalDashboard,
    "Leaderboard": Leaderboard,
    "Community": Community,
    "SocialFeed": SocialFeed,
    "ForumTopicDetails": ForumTopicDetails,
    "AccountSettings": AccountSettings,
    "AdminDashboard": AdminDashboard,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "CookiesPolicy": CookiesPolicy,
    "PaymentMethods": PaymentMethods,
    "PaymentSetup": PaymentSetup,
    "StripeConnectSetup": StripeConnectSetup,
    "ConnectedAccountStorefront": ConnectedAccountStorefront,
    "CheckoutSuccess": CheckoutSuccess,
    "AboutUs": AboutUs,
    "Contact": Contact,
    "FAQ": FAQ,
    "Landing": Landing,
    "UserProfile": UserProfile,
    "SocialEvents": SocialEvents,
    "ModerationPanel": ModerationPanel,
    "PartnerServices": PartnerServices,
    "BookService": BookService,
    "VeterinaryDashboard": VeterinaryDashboard,
    "ApproveAnnouncements": ApproveAnnouncements,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};