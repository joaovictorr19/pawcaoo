import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Clock, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function DogSittingServices() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const services = [
    {
      id: "boarding",
      title: t('dogBoarding', language),
      description: t('boardingDesc', language),
      icon: HomeIcon,
      color: "from-blue-500 to-blue-600",
      features: [
        t('boardingFeature1', language),
        t('boardingFeature2', language),
        t('boardingFeature3', language),
        t('boardingFeature4', language),
        t('boardingFeature5', language)
      ],
      filterType: "boarding"
    },
    {
      id: "house_sitting",
      title: t('houseSitting', language),
      description: t('houseSittingDesc', language),
      icon: HomeIcon,
      color: "from-purple-500 to-purple-600",
      features: [
        t('houseSittingFeature1', language),
        t('houseSittingFeature2', language),
        t('houseSittingFeature3', language),
        t('houseSittingFeature4', language),
        t('houseSittingFeature5', language)
      ],
      filterType: "house_sitting"
    },
    {
      id: "drop_in_feeding",
      title: t('dropInVisits', language),
      description: t('dropInVisitsDesc', language),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      features: [
        t('dropInFeature1', language),
        t('dropInFeature2', language),
        t('dropInFeature3', language),
        t('dropInFeature4', language),
        t('dropInFeature5', language)
      ],
      filterType: "drop_in"
    }
  ];

  const handleRequestService = (serviceType) => {
    // Redirect to Home with filter for walkers offering this service
    navigate(createPageUrl(`Home?dogSittingService=${serviceType}`));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t('dogSittingTitle', language)}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('dogSittingSubtitle', language)}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {services.map((service) => (
            <Card key={service.id} className="glass-panel border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
              <div className={`h-3 bg-gradient-to-r ${service.color}`} />
              <CardHeader className="text-center pt-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                <p className="text-gray-600">{service.description}</p>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <Heart className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full bg-gradient-to-r ${service.color} hover:opacity-90 text-white shadow-lg h-12`}
                  onClick={() => handleRequestService(service.filterType)}
                >
                  {t('requestService', language)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-panel border-2 border-blue-200">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('whyChooseDogSitting', language)}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ {t('verifiedSitters', language)}</h4>
                <p className="text-gray-700">{t('verifiedSittersDesc', language)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ {t('securePayment', language)}</h4>
                <p className="text-gray-700">{t('securePaymentDesc', language)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ {t('communication247', language)}</h4>
                <p className="text-gray-700">{t('communication247Desc', language)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ {t('insuranceCoverage', language)}</h4>
                <p className="text-gray-700">{t('insuranceCoverageDesc', language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}