
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Home } from "lucide-react"; // Added Home icon import
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function MyAdoptionApplications() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['myAdoptionApplications', user?.email],
    queryFn: () => base44.entities.AdoptionApplication.filter({ applicant_email: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: { 
        color: "bg-yellow-500", 
        icon: Clock, 
        text: language === 'pt' ? "Pendente" : language === 'es' ? "Pendiente" : "Pending Review" 
      },
      under_review: { 
        color: "bg-blue-500", 
        icon: AlertCircle, 
        text: language === 'pt' ? "Em Revisão" : language === 'es' ? "En Revisión" : "Under Review" 
      },
      approved: { 
        color: "bg-green-500", 
        icon: CheckCircle2, 
        text: language === 'pt' ? "Aprovado!" : language === 'es' ? "¡Aprobado!" : "Approved!" 
      },
      rejected: { 
        color: "bg-red-500", 
        icon: XCircle, 
        text: language === 'pt' ? "Não Aprovado" : language === 'es' ? "No Aprobado" : "Not Approved" 
      },
      on_hold: { 
        color: "bg-orange-500", 
        icon: AlertCircle, 
        text: language === 'pt' ? "Em Espera" : language === 'es' ? "En Espera" : "On Hold" 
      },
      withdrawn: { 
        color: "bg-gray-500", 
        icon: XCircle, 
        text: language === 'pt' ? "Retirado" : language === 'es' ? "Retirado" : "Withdrawn" 
      }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('myAdoptionApplications', language)}</h1>
          <p className="text-lg text-gray-600">
            {t('trackApplicationStatus', language)}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" /> {/* Changed from Heart to Home */}
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {t('noApplicationsYet', language)}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'pt' ? 'Navegue nos pets disponíveis e comece sua jornada de adoção!' : 
                 language === 'es' ? '¡Explora las mascotas disponibles y comienza tu viaje de adopción!' : 
                 'Browse available pets and start your adoption journey!'}
              </p>
              <Button
                onClick={() => navigate(createPageUrl('AdoptionListings'))}
                className="bg-gradient-to-r from-pink-600 to-purple-600"
              >
                {t('browsePets', language)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl mb-2">
                          {t('applicationFor', language)} {app.pet_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          {t('applied', language)} {format(new Date(app.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {getStatusBadge(app.application_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">{t('yourInformation', language)}</h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><strong>{t('phone', language)}:</strong> {app.applicant_phone}</p>
                          <p><strong>{t('city', language)}:</strong> {app.applicant_city}</p>
                          <p><strong>{t('home', language)}:</strong> {app.home_type} ({app.home_ownership})</p>
                        </div>
                      </div>

                      {app.interview_scheduled && (
                        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            {t('interviewScheduled', language)}
                          </h4>
                          <p className="text-sm text-blue-700">
                            {format(new Date(app.interview_date), 'PPP p')}
                          </p>
                        </div>
                      )}

                      {app.application_status === 'approved' && (
                        <div className="md:col-span-2 bg-green-50 rounded-lg p-4 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <h4 className="font-semibold text-green-900">
                              {t('congratulations', language)} 🎉
                            </h4>
                          </div>
                          <p className="text-sm text-green-700">
                            {t('applicationApprovedMessage', language)}
                          </p>
                        </div>
                      )}

                      {app.application_status === 'rejected' && app.rejection_reason && (
                        <div className="md:col-span-2 bg-red-50 rounded-lg p-4 border-2 border-red-200">
                          <h4 className="font-semibold text-red-900 mb-2">
                            {t('applicationStatus', language)}
                          </h4>
                          <p className="text-sm text-red-700">{app.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${app.listing_id}`))}
                        className="flex-1"
                      >
                        {t('viewPet', language)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
