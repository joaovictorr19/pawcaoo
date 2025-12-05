import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, FileText, Users, Dog, Info } from "lucide-react";
import SEO from "@/components/SEO";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Sitemap() {
  const { language } = useLanguage();

  const sections = [
    {
      title: "Main",
      icon: <Map className="w-5 h-5" />,
      links: [
        { name: "Home", url: "Home" },
        { name: "About Us", url: "AboutUs" },
        { name: "Contact", url: "Contact" },
        { name: "FAQ", url: "FAQ" },
      ]
    },
    {
      title: "Services",
      icon: <Dog className="w-5 h-5" />,
      links: [
        { name: "Dog Walkers", url: "Home" },
        { name: "Trainers", url: "Trainers" },
        { name: "Dog Sitting", url: "DogSittingServices" },
        { name: "Adoption", url: "AdoptionListings" },
        { name: "Emergency", url: "PostEmergency" },
      ]
    },
    {
      title: "Professionals",
      icon: <Users className="w-5 h-5" />,
      links: [
        { name: "Become a Walker", url: "BecomeWalker" },
        { name: "Become a Trainer", url: "BecomeTrainer" },
        { name: "Plans & Pricing", url: "Subscriptions" },
      ]
    },
    {
      title: "Legal",
      icon: <FileText className="w-5 h-5" />,
      links: [
        { name: "Terms of Service", url: "TermsOfService" },
        { name: "Privacy Policy", url: "PrivacyPolicy" },
        { name: "Cookies Policy", url: "CookiesPolicy" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <SEO 
        title="Sitemap - PawCão" 
        description="Mapa do site PawCão. Encontre todas as páginas importantes."
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sitemap</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link 
                        to={createPageUrl(link.url)} 
                        className="text-gray-600 hover:text-green-600 hover:underline transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Note for Search Engines:</p>
            <p>
              This is an HTML sitemap for users. 
              A standard XML sitemap is available at <code>/sitemap.xml</code> (if configured in build).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}