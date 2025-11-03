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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};