import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Clock, Users, ChevronLeft, ChevronRight, MapPin, Tag } from "lucide-react";

function timeLeft(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export default function ShopOffersCarousel() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [, setTick] = useState(0);

  const { data: offers = [] } = useQuery({
    queryKey: ["shopOffers"],
    queryFn: async () => {
      const all = await base44.entities.ShopOffer.filter({ status: "active" }, "-created_date", 20);
      const now = Date.now();
      return (all || []).filter(
        (o) => new Date(o.expires_at).getTime() > now && (o.slots_available ?? 0) > 0
      );
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // re-render a cada segundo para o countdown
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // reset do index quando as ofertas mudam
  useEffect(() => {
    if (index >= offers.length) setIndex(0);
  }, [offers.length, index]);

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(offers.length, 1)), [offers.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + offers.length) % Math.max(offers.length, 1)), [offers.length]);

  // auto-rotação
  useEffect(() => {
    if (offers.length <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, offers.length]);

  if (offers.length === 0) return null;
  const current = offers[index];
  if (!current) return null;

  const remaining = timeLeft(current.expires_at);
  const discount = current.discount_percentage ||
    (current.original_price > current.offer_price
      ? Math.round(((current.original_price - current.offer_price) / current.original_price) * 100)
      : 0);

  const goToProfile = () => {
    if (current.professional_profile_id) navigate(`/${current.professional_profile_id}`);
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2 mb-2.5">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-black text-orange-600 uppercase tracking-wide">Ofertas Relâmpago</span>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row min-h-[180px]"
          >
            {/* Imagem */}
            <div className="sm:w-2/5 h-36 sm:h-auto relative bg-gradient-to-br from-orange-400 via-rose-400 to-teal-400 shrink-0">
              {current.image_url ? (
                <img
                  src={current.image_url}
                  alt={current.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {discount > 0 && (
                <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-black shadow-lg flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  -{discount}%
                </span>
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 bg-white p-4 md:p-5 flex flex-col justify-between">
              <div>
                <button onClick={goToProfile} className="text-[11px] font-bold text-teal-700 hover:underline text-left">
                  {current.professional_name}
                </button>
                <h3 className="font-heading font-extrabold text-slate-900 text-base md:text-lg leading-tight mt-0.5">
                  {current.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{current.description || current.service_name}</p>
                {current.location && (
                  <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                    <MapPin className="w-3 h-3" />
                    {current.location}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between gap-3 mt-3">
                <div>
                  {current.original_price > current.offer_price && (
                    <span className="text-xs text-slate-400 line-through mr-1.5">
                      €{current.original_price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xl font-black text-rose-600">
                    €{current.offer_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold">
                    <Users className="w-3 h-3" />
                    {current.slots_available}/{current.slots_total}
                  </span>
                  {remaining && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold tabular-nums">
                      <Clock className="w-3 h-3" />
                      {remaining}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Setas */}
        {offers.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-colors active:scale-90"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-colors active:scale-90"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </>
        )}

        {/* Dots */}
        {offers.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {offers.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}