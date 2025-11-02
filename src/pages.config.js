import Home from './pages/Home';
import WalkerDetails from './pages/WalkerDetails';
import MyBookings from './pages/MyBookings';
import BecomeWalker from './pages/BecomeWalker';
import MyProfile from './pages/MyProfile';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "WalkerDetails": WalkerDetails,
    "MyBookings": MyBookings,
    "BecomeWalker": BecomeWalker,
    "MyProfile": MyProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};