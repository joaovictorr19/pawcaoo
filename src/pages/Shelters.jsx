import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HomeIcon, Search, Building2, Plus } from "lucide-react";
import ShelterCard from "@/components/shelters/ShelterCard";
import { useLanguage } from "@/components/LanguageContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const texts = {
  pt: {
    title: "Abrigos & Organizações",
    subtitle: "Encontre abrigos de animais perto de si. Adote, doe ou seja voluntário.",
    search: "Pesquisar por nome ou cidade...",
    noResults: "Nenhum abrigo encontrado",
    noResultsSub: "Tente uma pesquisa diferente.",
    register: "Registar o Meu Abrigo",
    manageMyShelter: "Gerir o Meu Abrigo",
    results: "abrigos registados",
  },
  en: {
    title: "Shelters & Organizations",
    subtitle: "Find animal shelters near you. Adopt, donate or volunteer.",
    search: "Search by name or city...",
    noResults: "No shelters found",
    noResultsSub: "Try a different search.",
    register: "Register My Shelter",
    manageMyShelter: "Manage My Shelter",
    results: "registered shelters",
  },
  es: {
    title: "Refugios & Organizaciones",
    subtitle: "Encuentra refugios de animales cerca de ti. Adopta, dona o sé voluntario.",
    search: "Buscar por nombre o ciudad...",
    noResults: "Ningún refugio encontrado",
    noResultsSub: "Intenta una búsqueda diferente.",
    register: "Registrar Mi Refugio",
    manageMyShelter: "Gestionar Mi Refugio",
    results: "refugios registrados",
  },
};

export default function Shelters() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const tx = texts[language] || texts.en;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: myShelter } = useQuery({
    queryKey: ['myShelter', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const shelters = await base44.entities.ShelterProfile.filter({ created_by: user.email });
      return shelters[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: shelters = [], isLoading } = useQuery({
    queryKey: ['allApprovedShelters'],
    queryFn: async () => {
      const all = await base44.entities.ShelterProfile.list('-created_date', 200);
      return all.filter(s => s.verification_status === 'approved' || s.is_verified);
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return shelters;
    const term = searchTerm.toLowerCase();
    return shelters.filter(s =>
      s.shelter_name?.toLowerCase().includes(term) ||
      s.location_city?.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    );
  }, [shelters, searchTerm]);

  return (
    <div className="w-full flex justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-gray-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{tx.title}</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">{tx.subtitle}</p>
        </motion.div>

        {/* Actions + Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={tx.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-gray-200 bg-white shadow-sm rounded-lg"
            />
          </div>
          {myShelter ? (
            <Button
              onClick={() => navigate(createPageUrl("ShelterDashboard"))}
              variant="outline"
              className="h-10 px-5 whitespace-nowrap border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Building2 className="w-4 h-4 mr-2" /> {tx.manageMyShelter}
            </Button>
          ) : user ? (
            <Button
              onClick={() => navigate(createPageUrl("ShelterRegister"))}
              variant="outline"
              className="h-10 px-5 whitespace-nowrap border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> {tx.register}
            </Button>
          ) : null}
        </div>

        {/* Count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mb-6">
            {filtered.length} {tx.results}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-gray-100 shadow-sm">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <HomeIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">{tx.noResults}</h2>
            <p className="text-gray-400 text-sm">{tx.noResultsSub}</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {filtered.map((shelter) => (
              <ShelterCard key={shelter.id} shelter={shelter} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}