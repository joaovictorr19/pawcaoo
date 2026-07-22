import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { slugify } from '@/utils/profileSlug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  QrCode, Play, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Building2, User, GraduationCap, RefreshCw
} from 'lucide-react';

/**
 * QRProfileTest — Fluxo de teste que valida se cada QR Code de perfil
 * (hotel, Dog Walker, treinador) resolve para o perfil público correto,
 * detectando sobreposições de slug entre diferentes tipos de conta.
 */
export default function QRProfileTest() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null);

  const runTest = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);

    try {
      // 1. Recolher todos os perfis profissionais
      const [walkers, trainers] = await Promise.all([
        base44.entities.WalkerProfile.list(undefined, 200),
        base44.entities.TrainerProfile.list(undefined, 200),
      ]);

      // 2. Indexar ProfileSlug para resolução rápida
      const allSlugs = await base44.entities.ProfileSlug.list(undefined, 500);
      const slugMap = {};
      for (const s of allSlugs) {
        if (!s.slug) continue;
        if (!slugMap[s.slug]) slugMap[s.slug] = [];
        slugMap[s.slug].push(s);
      }

      // 3. Construir lista de perfis a testar
      const profiles = [];
      for (const w of walkers) {
        const name = w.hotel_details?.hotel_name || w.walker_name;
        if (!name || !w.created_by) continue;
        profiles.push({
          id: w.id,
          name,
          email: w.created_by,
          type: w.professional_type === 'hotel' ? 'hotel' : 'walker',
        });
      }
      for (const t of trainers) {
        if (!t.trainer_name || !t.created_by) continue;
        profiles.push({
          id: t.id,
          name: t.trainer_name,
          email: t.created_by,
          type: 'trainer',
        });
      }

      setProgress({ done: 0, total: profiles.length });

      // 4. Testar cada perfil
      const testResults = [];
      for (const profile of profiles) {
        const expectedSlug = slugify(profile.name);
        const slugEntries = slugMap[expectedSlug] || [];

        // Resolver como ShortProfile faria
        let resolvedEmail = null;
        let resolvedType = null;
        let resolutionMethod = null;

        if (slugEntries.length > 0) {
          const first = slugEntries[0];
          resolvedEmail = first.entity_email;
          resolvedType = first.entity_type;
          resolutionMethod = 'ProfileSlug';
        } else {
          // Fallback: simular lazy resolution do ShortProfile
          // Verifica se o slug base (sem sufixo numérico) colide
          const baseSlug = expectedSlug.replace(/-\d+$/, '');
          const matches = [];
          for (const w of walkers) {
            const wName = w.hotel_details?.hotel_name || w.walker_name;
            const s = slugify(wName);
            if (s === expectedSlug || s === baseSlug) {
              matches.push({
                email: w.created_by,
                type: w.professional_type === 'hotel' ? 'hotel' : 'walker',
                name: wName,
              });
            }
          }
          for (const t of trainers) {
            const s = slugify(t.trainer_name);
            if (s === expectedSlug || s === baseSlug) {
              matches.push({
                email: t.created_by,
                type: 'trainer',
                name: t.trainer_name,
              });
            }
          }
          // ShortProfile prioriza hotéis
          const hotelMatch = matches.find(m => m.type === 'hotel');
          const match = hotelMatch || matches[0];
          if (match) {
            resolvedEmail = match.email;
            resolvedType = match.type;
            resolutionMethod = matches.length > 1 ? 'Fallback (colisão)' : 'Fallback';
          }
        }

        // Avaliar resultado
        const emailMatch = resolvedEmail === profile.email;
        const typeMatch = resolvedType === profile.type;
        const isOverlap = slugEntries.length > 1 ||
          (resolutionMethod && resolutionMethod.includes('colisão'));

        const status = (emailMatch && typeMatch && !isOverlap)
          ? 'pass'
          : (isOverlap ? 'overlap' : 'fail');

        testResults.push({
          ...profile,
          slug: expectedSlug,
          resolvedEmail,
          resolvedType,
          resolutionMethod,
          status,
          qrUrl: `/p/${expectedSlug}`,
        });

        setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        // Atualizar incrementalmente
        if (testResults.length % 5 === 0) {
          setResults([...testResults]);
        }
      }

      setResults([...testResults]);

      // 5. Resumo
      const passed = testResults.filter(r => r.status === 'pass').length;
      const failed = testResults.filter(r => r.status === 'fail').length;
      const overlaps = testResults.filter(r => r.status === 'overlap').length;
      setSummary({ total: testResults.length, passed, failed, overlaps });
    } catch (err) {
      console.error('QR Profile Test error:', err);
    } finally {
      setRunning(false);
    }
  }, []);

  const passed = results.filter(r => r.status === 'pass');
  const failed = results.filter(r => r.status === 'fail');
  const overlaps = results.filter(r => r.status === 'overlap');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-teal-600" />
              Teste de QR Codes de Perfil
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Valida se cada QR de hotel/Dog Walker/treinador resolve para o perfil correto, sem sobreposição de tipos.
            </p>
          </div>
          <Button onClick={runTest} disabled={running} size="lg">
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A testar... ({progress.done}/{progress.total})</>
            ) : (
              <><Play className="w-4 h-4" /> Iniciar Teste</>
            )}
          </Button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">{summary.total}</p>
                <p className="text-xs text-slate-500 mt-1">Total Perfis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{summary.passed}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OK
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{summary.overlaps}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Sobreposições
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{summary.failed}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" /> Falhas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Failures & Overlaps */}
        {overlaps.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Sobreposições de Slug ({overlaps.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overlaps.map((r, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-amber-200 flex items-center gap-3 flex-wrap">
                  <TypeBadge type={r.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 font-mono">/p/{r.slug}</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>Esperado: <span className="font-mono font-bold">{r.email}</span></p>
                    <p>Resolvido: <span className="font-mono font-bold text-amber-700">{r.resolvedEmail}</span></p>
                    <p>Tipo resolvido: <span className="font-bold text-amber-700">{r.resolvedType}</span></p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {failed.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-900 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Resoluções Incorretas ({failed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {failed.map((r, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-red-200 flex items-center gap-3 flex-wrap">
                  <TypeBadge type={r.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 font-mono">/p/{r.slug}</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>Esperado: <span className="font-mono font-bold">{r.email}</span></p>
                    <p>Resolvido: <span className="font-mono font-bold text-red-700">{r.resolvedEmail || '—'}</span></p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Passed (collapsed) */}
        {passed.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Perfis OK ({passed.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {passed.map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {r.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !running && (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Clique em "Iniciar Teste" para verificar todos os QR codes de perfil.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const config = {
    hotel:   { icon: Building2,       label: 'Hotel',     cls: 'bg-purple-100 text-purple-700' },
    walker:  { icon: User,            label: 'Dog Walker',  cls: 'bg-blue-100 text-blue-700' },
    trainer: { icon: GraduationCap,  label: 'Treinador',  cls: 'bg-teal-100 text-teal-700' },
  };
  const c = config[type] || config.walker;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${c.cls}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}