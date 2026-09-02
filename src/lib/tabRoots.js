// Raízes das abas/painéis principais — nestas páginas a seta de voltar
// global (MobileHeader) fica oculta; em todas as sub-páginas aparece.
export const TAB_ROOT_PATHS = [
  '/',
  '/Home',
  '/ClientDashboard',
  '/ProfessionalHubV2',
  '/HotelDashboard',
  '/StoreDashboard',
  '/ProfessionalCalendar',
  '/MyBookings',
  '/PartnerHotelPanel',
  '/UserProfile',
  '/AdminDashboard',
  '/Dashboard',
];

export const isTabRootPath = (pathname) => TAB_ROOT_PATHS.includes(pathname);