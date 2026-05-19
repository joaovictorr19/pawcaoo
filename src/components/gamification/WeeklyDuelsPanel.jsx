import React, { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sword, Medal, TimerReset, Footprints } from "lucide-react";

const MEDALS = ["Medalha do Alfa", "Medalha da Alcateia", "Medalha do Guardião"];

const getCurrentWeekKey = () => {
  const now = new Date();
  const start = new Date(now);
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diff);
  return start.toISOString().slice(0, 10);
};

export default function WeeklyDuelsPanel({ user, users = [] }) {
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [xpBet, setXpBet] = useState(25);

  const weekKey = getCurrentWeekKey();

  const suggestedOpponents = useMemo(
    () => users.filter((item) => item.user_email && item.user_email !== user?.email).slice(0, 5),
    [users, user?.email]
  );

  const tempLeaderboard = useMemo(
    () => users
      .filter((item) => item.user_email)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        walks_completed: Math.max(1, 5 - index),
        wins: Math.max(0, 3 - index),
        medal: MEDALS[index] || null,
      })),
    [users]
  );

  const totalPrize = Math.max(0, Number(xpBet || 0) * 2);

  return (
    <section className="relative py-16 px-4 border-t border-amber-500/10">
      <div className="max-w-6xl mx-auto grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-amber-500/20 bg-neutral-900/60 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-amber-500/60 uppercase tracking-[0.3em] text-xs font-bold mb-2">Duelos Semanais</p>
              <h3 className="text-2xl font-black text-white">Desafia por passeios e aposta XP</h3>
            </div>
            <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <TimerReset className="w-3.5 h-3.5 mr-1" />
              Reset ao domingo
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-400 mb-2">Missão ativa</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-bold">Quem completa mais passeios</p>
                  <p className="text-sm text-gray-400">Semana de {weekKey}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-400 mb-2">Prémio total</p>
              <p className="text-3xl font-black text-amber-400">{totalPrize} XP</p>
              <p className="text-sm text-gray-400">O vencedor leva toda a aposta</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] items-end">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs text-blue-300 mb-3">Desafiante</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-blue-400/30">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback>{user?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-bold">{user?.full_name || "Tu"}</p>
                  <p className="text-sm text-gray-400">Aposta definida por ti</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                <Sword className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-xs text-purple-300 mb-3">Adversário</p>
              {selectedOpponent ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border border-purple-400/30">
                    <AvatarImage src={selectedOpponent.profile_photo_url} />
                    <AvatarFallback>{selectedOpponent.full_name?.[0] || "A"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-bold">{selectedOpponent.full_name}</p>
                    <p className="text-sm text-gray-400">Pronto para duelo</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Escolhe alguém abaixo para lançar o desafio.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_1fr] mt-6">
            <div>
              <label className="text-xs text-gray-400 block mb-2">XP apostado por cada utilizador</label>
              <Input
                type="number"
                min="1"
                value={xpBet}
                onChange={(e) => setXpBet(e.target.value)}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 block mb-2">Sugestões de adversário</p>
              <div className="flex flex-wrap gap-2">
                {suggestedOpponents.map((opponent) => (
                  <button
                    key={opponent.id}
                    onClick={() => setSelectedOpponent(opponent)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all ${selectedOpponent?.id === opponent.id ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-white/10 bg-black/20 text-gray-300 hover:border-amber-500/30"}`}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={opponent.profile_photo_url} />
                      <AvatarFallback>{opponent.full_name?.[0] || "A"}</AvatarFallback>
                    </Avatar>
                    {opponent.full_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button className="bg-amber-500 text-black hover:bg-amber-400" disabled={!selectedOpponent || !Number(xpBet)}>
              Lançar desafio
            </Button>
            <p className="text-xs text-gray-500">Nesta primeira versão, a área já mostra a dinâmica semanal e o prêmio total apostado.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-neutral-900/60 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-amber-500/60 uppercase tracking-[0.3em] text-xs font-bold mb-2">Leaderboard Semanal</p>
              <h3 className="text-xl font-black text-white">Top da semana</h3>
            </div>
            <Badge className="bg-black/40 text-amber-300 border border-amber-500/20">Temporário</Badge>
          </div>

          <div className="space-y-3">
            {tempLeaderboard.map((entry, index) => (
              <div key={entry.id || entry.user_email} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-amber-400 font-black">#{index + 1}</div>
                  <Avatar className="w-11 h-11 border border-amber-500/20">
                    <AvatarImage src={entry.profile_photo_url} />
                    <AvatarFallback>{entry.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{entry.full_name}</p>
                    <p className="text-xs text-gray-400">{entry.walks_completed} passeios • {entry.wins} vitórias</p>
                  </div>
                  {entry.medal && (
                    <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <Medal className="w-3.5 h-3.5 mr-1" />
                      {entry.medal}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-200 font-medium mb-1">Medalhas únicas de domingo</p>
            <p className="text-xs text-gray-400">No final da semana, os vencedores recebem medalhas exclusivas e o ranking recomeça do zero.</p>
          </div>
        </div>
      </div>
    </section>
  );
}