import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Package, Heart, Calendar, ShoppingBag, MapPin, X, TrendingUp, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { language } = useLanguage();

  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pawcao_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  // Search data with debounce
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: async () => {
      if (!query || query.length < 2) return null;

      const [walkers, users, products, partners] = await Promise.all([
        base44.entities.WalkerProfile.filter({ is_active: true }).catch(() => []),
        base44.entities.UserProfile.list().catch(() => []),
        base44.entities.PartnerProduct.filter({ is_available: true }).catch(() => []),
        base44.entities.Partnership.filter({ is_active: true }).catch(() => [])
      ]);

      const searchLower = query.toLowerCase();

      return {
        walkers: walkers.filter(w => 
          w.walker_name?.toLowerCase().includes(searchLower) ||
          w.location?.toLowerCase().includes(searchLower) ||
          w.services_offered?.some(s => s.service_name?.toLowerCase().includes(searchLower))
        ).slice(0, 5),
        users: users.filter(u =>
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.username?.toLowerCase().includes(searchLower) ||
          u.bio?.toLowerCase().includes(searchLower)
        ).slice(0, 5),
        products: products.filter(p =>
          p.product_name?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower) ||
          p.partner_name?.toLowerCase().includes(searchLower)
        ).slice(0, 5),
        partners: partners.filter(p =>
          p.company_name?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
        ).slice(0, 5)
      };
    },
    enabled: query.length >= 2,
    staleTime: 30000
  });

  // Quick links for empty state
  const quickLinks = [
    { icon: User, label: language === 'pt' ? 'Profissionais' : 'Professionals', url: createPageUrl("Home"), color: 'text-blue-600' },
    { icon: ShoppingBag, label: language === 'pt' ? 'Loja' : 'Shop', url: createPageUrl("Partners"), color: 'text-green-600' },
    { icon: Heart, label: language === 'pt' ? 'Adoção' : 'Adoption', url: createPageUrl("Home"), color: 'text-pink-600' },
    { icon: Calendar, label: language === 'pt' ? 'Minhas Reservas' : 'My Bookings', url: createPageUrl("MyBookings"), color: 'text-purple-600' },
    { icon: Package, label: language === 'pt' ? 'Minhas Encomendas' : 'My Orders', url: createPageUrl("MyOrders"), color: 'text-orange-600' },
    { icon: MapPin, label: language === 'pt' ? 'Emergência' : 'Emergency', url: createPageUrl("RequestWalk"), color: 'text-red-600' }
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleResultClick = (type, item) => {
    let url;
    switch(type) {
      case 'walker':
        url = createPageUrl(`WalkerDetails?id=${item.id}`);
        break;
      case 'user':
        url = createPageUrl(`UserProfile?${item.username ? `username=${item.username}` : `id=${item.user_id}`}`);
        break;
      case 'product':
        url = createPageUrl("Partners");
        break;
      case 'partner':
        url = createPageUrl(`PartnerDetails?id=${item.id}`);
        break;
      default:
        return;
    }
    
    saveRecentSearch(query, type);
    navigate(url);
    onClose();
  };

  const handleQuickLink = (url) => {
    navigate(url);
    onClose();
  };

  const saveRecentSearch = (searchQuery, type) => {
    const newSearch = { query: searchQuery, type, timestamp: Date.now() };
    const updated = [newSearch, ...recentSearches.filter(s => s.query !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('pawcao_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pawcao_recent_searches');
  };

  const filteredResults = searchResults && query.length >= 2 ? (
    activeTab === "all" ? {
      walkers: searchResults.walkers,
      users: searchResults.users,
      products: searchResults.products,
      partners: searchResults.partners
    } : {
      [activeTab]: searchResults[activeTab]
    }
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'pt' ? 'Pesquisar profissionais, produtos, utilizadores...' : 'Search professionals, products, users...'}
              className="pl-10 pr-10 h-12 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {query.length >= 2 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {['all', 'walkers', 'users', 'products', 'partners'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'all' ? (language === 'pt' ? 'Todos' : 'All') :
                   tab === 'walkers' ? (language === 'pt' ? 'Profissionais' : 'Professionals') :
                   tab === 'users' ? (language === 'pt' ? 'Utilizadores' : 'Users') :
                   tab === 'products' ? (language === 'pt' ? 'Produtos' : 'Products') :
                   (language === 'pt' ? 'Parceiros' : 'Partners')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto max-h-[500px] p-4">
          {!query || query.length < 2 ? (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {language === 'pt' ? 'Pesquisas Recentes' : 'Recent Searches'}
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {language === 'pt' ? 'Limpar' : 'Clear'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(search.query)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {language === 'pt' ? 'Acesso Rápido' : 'Quick Access'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickLinks.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickLink(link.url)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <link.icon className={`w-5 h-5 ${link.color}`} />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {link.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredResults ? (
            <div className="space-y-4">
              {/* Walkers */}
              {filteredResults.walkers?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Profissionais' : 'Professionals'}
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.walkers.map(walker => (
                      <button
                        key={walker.id}
                        onClick={() => handleResultClick('walker', walker)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={walker.photo_url || `https://ui-avatars.com/api/?name=${walker.walker_name}`}
                          alt={walker.walker_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{walker.walker_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {walker.location}
                            {walker.hourly_rate && (
                              <>
                                <span>•</span>
                                <span>€{walker.hourly_rate}/h</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {walker.rating ? `⭐ ${walker.rating.toFixed(1)}` : 'Novo'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {filteredResults.users?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Utilizadores' : 'Users'}
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.users.map(user => (
                      <button
                        key={user.user_email}
                        onClick={() => handleResultClick('user', user)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.full_name}`}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate flex items-center gap-1">
                            {user.full_name}
                            {user.is_verified && <Badge className="bg-blue-500 text-white text-[10px] px-1">✓</Badge>}
                          </p>
                          {user.username && (
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {filteredResults.products?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Produtos' : 'Products'}
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick('product', product)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.partner_name}</p>
                        </div>
                        <p className="font-bold text-green-600">€{product.price_euro}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Partners */}
              {filteredResults.partners?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Parceiros' : 'Partners'}
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.partners.map(partner => (
                      <button
                        key={partner.id}
                        onClick={() => handleResultClick('partner', partner)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={partner.logo_url || `https://ui-avatars.com/api/?name=${partner.company_name}`}
                          alt={partner.company_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{partner.company_name}</p>
                          <p className="text-xs text-gray-500">{partner.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {Object.values(filteredResults).every(arr => !arr || arr.length === 0) && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {language === 'pt' ? 'Nenhum resultado encontrado' : 'No results found'}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Tips */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-4 py-2 text-xs text-gray-500">
          <span className="font-medium">Dica:</span> Digite pelo menos 2 caracteres para pesquisar
        </div>
      </DialogContent>
    </Dialog>
  );
}