import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Ticket, Check, Megaphone } from "lucide-react";
import {
  discountLabel,
  getPromotionStatus,
  promoScopeLabel,
  vacanciesLeft,
} from "@/lib/promotions";

export default function ActivePromotions({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimedIds, setClaimedIds] = useState([]);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["shopPromotions"],
    queryFn: () =>
      base44.entities.Promotion.filter(
        { status: { $in: ["active", "sold_out"] } },
        "-created_date",
        20
      ),
    staleTime: 60 * 1000,
  });

  const active = useMemo(
    () =>
      promotions.filter((p) =>
        ["active", "scheduled", "sold_out"].includes(getPromotionStatus(p))
      ),
    [promotions]
  );

  const claimMutation = useMutation({
    mutationFn: async (promotionId) => {
      const res = await base44.functions.invoke("claimPromotion", { promotion_id: promotionId });
      return res.data;
    },
    onSuccess: (data, promotionId) => {
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setClaimedIds((prev) => [...prev, promotionId]);
      queryClient.invalidateQueries({ queryKey: ["shopPromotions"] });
      toast.success(data?.already_claimed ? "Já tinhas aderido a esta promoção" : "Promoção reservada. Fala com o parceiro ao reservar.");
    },
    onError: (error) => {
      const message = error?.response?.data?.error || "Não foi possível aderir agora";
      toast.error(message);
    },
  });

  if (isLoading || active.length === 0) return null;

  const handleClaim = (promo) => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
      return;
    }
    claimMutation.mutate(promo.id);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2.5">
        <Megaphone className="w-4 h-4 text-teal-600" />
        <p className="font-heading font-extrabold text-base text-slate-900">Promoções dos parceiros</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {active.map((promo) => {
          const discount = discountLabel(promo);
          const left = vacanciesLeft(promo);
          const claimed = claimedIds.includes(promo.id);
          const soldOut = left === 0;
          return (
            <div
              key={promo.id}
              className="snap-start shrink-0 w-[280px] rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
                  {promo.partner_name || "Parceiro PawCão"}
                </span>
                {discount && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-teal-600 text-white shrink-0">
                    {discount}
                  </span>
                )}
              </div>
              <p className="font-heading font-extrabold text-[15px] text-slate-900 leading-tight mt-1.5">
                {promo.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{promoScopeLabel(promo)}</p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {promo.free_extra && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {promo.free_extra}
                  </span>
                )}
                {left !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      soldOut
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {soldOut ? "Esgotada" : `${left} vagas restantes`}
                  </span>
                )}
              </div>

              {promo.description && (
                <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{promo.description}</p>
              )}

              <button
                onClick={() => handleClaim(promo)}
                disabled={soldOut || claimed || claimMutation.isPending}
                className={`mt-3 w-full h-9 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  claimed
                    ? "bg-teal-100 text-teal-800"
                    : soldOut
                    ? "bg-slate-100 text-slate-400"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                {claimed ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Reservada
                  </>
                ) : (
                  <>
                    <Ticket className="w-3.5 h-3.5" /> {soldOut ? "Esgotada" : "Aderir"}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}