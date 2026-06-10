import React from 'react';
import { Users, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function HotelTeamSection({ hotelEmail }) {
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['hotelPartners', hotelEmail],
    queryFn: async () => {
      if (!hotelEmail) return [];
      try {
        // Fetch partners associated with this hotel
        const partnerships = await base44.asServiceRole.entities.Partnership.filter({
          partner_email: hotelEmail
        });

        if (!partnerships || partnerships.length === 0) return [];

        // Get walker/trainer details for each partner
        const partnersList = [];
        for (const partnership of partnerships) {
          try {
            const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({
              created_by: partnership.associated_email
            });
            if (walkers?.length > 0) {
              const walker = walkers[0];
              partnersList.push({
                id: walker.id,
                name: walker.walker_name,
                photo: walker.photo_url,
                location: walker.location,
                type: 'walker',
                email: partnership.associated_email
              });
            }
          } catch (e) {}
        }

        return partnersList;
      } catch (error) {
        console.error('Error fetching hotel partners:', error);
        return [];
      }
    },
    enabled: !!hotelEmail,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="h-6 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!partners || partners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-slate-900">Equipa de Parceiros</h3>
        <span className="ml-auto text-xs font-bold text-slate-400">{partners.length} passeadores</span>
      </div>

      <div className="space-y-3">
        {partners.map((partner) => (
          <motion.div
            key={partner.id}
            whileHover={{ scale: 1.02 }}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                <img
                  src={partner.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{partner.name}</p>
                {partner.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {partner.location}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-600" />
                  Parceiro
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}