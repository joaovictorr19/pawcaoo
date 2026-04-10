import { Link } from "react-router-dom";
import { MessageCircle, Camera } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import PawCaoLogo from "@/components/PawCaoLogo";

export default function LayoutFooter() {
  const { language } = useLanguage();

  return (
    <footer className="mt-16 backdrop-blur-2xl border-t transition-colors duration-300 relative z-0 bg-white/30 border-white/40 w-full">
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <PawCaoLogo size="default" className="mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              {t('footerTagline', language)}
            </p>
            <div className="space-y-2">
              <a href="mailto:support@pawcao.net" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                <MessageCircle className="w-4 h-4" />
                support@pawcao.net
              </a>
              <a href="https://instagram.com/paw.cao" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                <Camera className="w-4 h-4" />
                @Paw.cao
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('services', language)}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to={createPageUrl("Home")} className="hover:text-green-600 transition-colors">{t('findWalkers', language)}</Link></li>
              <li><Link to={createPageUrl("Trainers")} className="hover:text-green-600 transition-colors">{t('findTrainers', language)}</Link></li>
              <li><Link to={createPageUrl("DogSittingServices")} className="hover:text-green-600 transition-colors">{t('dogSitting', language)}</Link></li>
              <li><Link to={createPageUrl("Shop")} className="hover:text-green-600 transition-colors">{language === 'pt' ? 'Loja' : language === 'es' ? 'Tienda' : 'Shop'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('forProfessionals', language)}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to={createPageUrl("BecomeWalker")} className="hover:text-green-600 transition-colors">{t('becomeWalker', language)}</Link></li>
              <li><Link to={createPageUrl("BecomeTrainer")} className="hover:text-green-600 transition-colors">{t('becomeTrainer', language)}</Link></li>
              <li><Link to={createPageUrl("ProfessionalDashboard")} className="hover:text-green-600 transition-colors">{t('professionalDashboard', language)}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('company', language)}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to={createPageUrl("AboutUs")} className="hover:text-green-600 transition-colors">{t('aboutUs', language)}</Link></li>
              <li><Link to={createPageUrl("Contact")} className="hover:text-green-600 transition-colors">{t('contactUs', language)}</Link></li>
              <li><Link to={createPageUrl("FAQ")} className="hover:text-green-600 transition-colors">FAQ</Link></li>
              <li><Link to={createPageUrl("TermsOfService")} className="hover:text-green-600 transition-colors">{t('termsOfService', language)}</Link></li>
              <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-green-600 transition-colors">{t('privacyPolicy', language)}</Link></li>
              <li><Link to={createPageUrl("CookiesPolicy")} className="hover:text-green-600 transition-colors">{t('cookiesPolicy', language)}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            &copy; 2025 PawCao. {t('allRightsReserved', language)}.
          </p>
          <div className="flex items-center gap-2">
            <PawCaoLogo size="small" showText={false} />
            <span className="text-sm text-green-700 font-semibold">
              &#10003; {t('verifiedProfessionals', language)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
