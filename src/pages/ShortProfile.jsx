import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { slugify } from "@/utils/profileSlug";

/**
 * ShortProfile — Rota curta /p/:slug que resolve o nome para o perfil completo
 * Permite links limpos tipo pawcao.pt/p/hotel-canino-lisboa
 *
 * Ordem de resolução:
 * 1. ProfileSlug entity (slug → entity_email/type)
 * 2. UserProfile.filter({ username: slug })
 * 3. WalkerProfile — busca por hotel_name/walker_name slugificado (lazy backfill)
 */
export default function ShortProfile() {
  const { slug: rawSlug } = useParams();
  const [redirect, setRedirect] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!rawSlug) { setNotFound(true); return; }

      // Aceita tanto slug (com hífens) quanto ID antigo (alfanumérico sem hífens)
      const looksLikeLegacyId = rawSlug.length > 20 && !rawSlug.includes('-');
      if (looksLikeLegacyId) {
        setRedirect(`/UserProfile?id=${rawSlug}`);
        return;
      }

      const slug = rawSlug.toLowerCase();

      try {
        // 1) Tentar ProfileSlug entity
        try {
          const slugs = await base44.entities.ProfileSlug.filter({ slug });
          if (slugs?.length > 0) {
            const s = slugs[0];
            if (s.entity_email) {
              setRedirect(`/UserProfile?email=${encodeURIComponent(s.entity_email)}`);
            } else if (s.entity_id) {
              setRedirect(`/UserProfile?id=${s.entity_id}`);
            }
            return;
          }
        } catch (e) { /* entity pode não existir ainda */ }

        // 2) Tentar UserProfile por username
        try {
          const users = await base44.entities.UserProfile.filter({ username: slug });
          if (users?.length > 0 && users[0].user_email) {
            ensureSlug('user', users[0].user_email, users[0].full_name || slug, slug);
            setRedirect(`/UserProfile?email=${encodeURIComponent(users[0].user_email)}`);
            return;
          }
        } catch (e) {}

        // 3) Tentar WalkerProfile — buscar por nome slugificado
        //    Aceita também slug com sufixo numérico (ex: hotel-canino-2 → base hotel-canino)
        try {
          const walkers = await base44.entities.WalkerProfile.list(undefined, 200);
          const baseSlug = slug.replace(/-\d+$/, '');
          const match = walkers.find(w => {
            const name = w.hotel_details?.hotel_name || w.walker_name;
            const s = slugify(name);
            return s === slug || s === baseSlug;
          });
          if (match && match.created_by) {
            const type = match.professional_type === 'hotel' ? 'hotel' : 'walker';
            ensureSlug(type, match.created_by, match.hotel_details?.hotel_name || match.walker_name, slug);
            setRedirect(`/UserProfile?email=${encodeURIComponent(match.created_by)}`);
            return;
          }
        } catch (e) {}

        // 4) Tentar TrainerProfile
        try {
          const trainers = await base44.entities.TrainerProfile.list(undefined, 200);
          const baseSlug = slug.replace(/-\d+$/, '');
          const match = trainers.find(t => {
            const s = slugify(t.trainer_name);
            return s === slug || s === baseSlug;
          });
          if (match && match.created_by) {
            ensureSlug('trainer', match.created_by, match.trainer_name, slug);
            setRedirect(`/UserProfile?email=${encodeURIComponent(match.created_by)}`);
            return;
          }
        } catch (e) {}

        // 5) Tentar PartnerCompany
        try {
          const companies = await base44.entities.PartnerCompany.list(undefined, 200);
          const match = companies.find(c => slugify(c.company_name) === slug);
          if (match && match.id) {
            ensureSlug('company', match.company_email, match.company_name, slug);
            setRedirect(`/PartnerDetails?id=${match.id}`);
            return;
          }
        } catch (e) {}

        // Não encontrado
        if (!cancelled) setNotFound(true);
      } catch (e) {
        if (!cancelled) setNotFound(true);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [rawSlug]);

  // Cria um registo ProfileSlug para resoluções futuras mais rápidas (lazy backfill)
  async function ensureSlug(entityType, email, displayName, slug) {
    try {
      await base44.entities.ProfileSlug.create({
        slug,
        entity_type: entityType,
        entity_email: email,
        display_name: displayName,
      });
    } catch (e) { /* slug pode já existir, ignorar */ }
  }

  if (redirect) return <Navigate to={redirect} replace />;

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Perfil não encontrado</h2>
          <p className="text-slate-500 mb-6">O perfil que procura não existe ou foi removido.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-full bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}