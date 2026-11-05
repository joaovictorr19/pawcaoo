import { Navigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { slugify } from "@/utils/profileSlug";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import UserProfile from "./UserProfile";

/**
 * ShortProfile — Rota curta /:slug que resolve o nome e renderiza o perfil
 * diretamente, mantendo o URL limpo (ex: pawcao.pt/hotel-canino-lisboa).
 *
 * Ordem de resolução (passos independentes correm em paralelo para abrir mais rápido):
 * 1 + 2. ProfileSlug entity e UserProfile por username
 * 3 + 4. WalkerProfile e TrainerProfile — busca por nome slugificado (lazy backfill)
 * 5. PartnerCompany → redirect to /PartnerDetails
 */
export default function ShortProfile() {
  const { slug: rawSlug } = useParams();
  const location = useLocation();
  const [resolved, setResolved] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!rawSlug) { setNotFound(true); return; }
      setResolved(null);
      setNotFound(false);

      // Fast path: navigation state provides email/type directly (from ProfessionalCard click)
      if (location.state?.email) {
        setResolved({ email: location.state.email, type: location.state.type });
        return;
      }

      // Aceita tanto slug (com hífens) quanto ID antigo (alfanumérico sem hífens)
      const looksLikeLegacyId = rawSlug.length > 20 && !rawSlug.includes('-');
      if (looksLikeLegacyId) {
        setResolved({ id: rawSlug });
        return;
      }

      const slug = rawSlug.toLowerCase();
      const baseSlug = slug.replace(/-\d+$/, '');

      // 1) e 2) em paralelo — são os acessos mais rápidos e mais frequentes
      const [slugRes, userRes] = await Promise.allSettled([
        base44.entities.ProfileSlug.filter({ slug }),
        base44.entities.UserProfile.filter({ username: slug }),
      ]);
      if (cancelled) return;

      if (slugRes.status === 'fulfilled' && slugRes.value?.length > 0) {
        const s = slugRes.value[0];
        if (s.entity_email) { setResolved({ email: s.entity_email, type: s.entity_type }); return; }
        if (s.entity_id) { setResolved({ id: s.entity_id, type: s.entity_type }); return; }
        // O email associado ao slug é privado — o servidor resolve o destino
        try {
          const res = await base44.functions.invoke('resolveProfileSlug', { slug });
          const target = res?.data || {};
          if (cancelled) return;
          if (target.partner_id) { setResolved({ partnerId: target.partner_id }); return; }
          if (target.profile_id) { setResolved({ id: target.profile_id, type: target.type }); return; }
        } catch (e) { /* segue para a resolução por nome */ }
      }

      if (userRes.status === 'fulfilled' && userRes.value?.length > 0 && userRes.value[0].user_email) {
        ensureSlug('user', userRes.value[0].user_email, userRes.value[0].full_name || slug, slug);
        setResolved({ email: userRes.value[0].user_email });
        return;
      }

      // 3) e 4) em paralelo — perfis profissionais
      const [walkersRes, trainersRes] = await Promise.allSettled([
        base44.entities.WalkerProfile.list(undefined, 200),
        base44.entities.TrainerProfile.list(undefined, 200),
      ]);
      if (cancelled) return;

      if (walkersRes.status === 'fulfilled' && walkersRes.value?.length > 0) {
        const matches = walkersRes.value.filter(w => {
          const name = w.hotel_details?.hotel_name || w.walker_name;
          const s = slugify(name);
          return s === slug || s === baseSlug;
        });
        // Priorizar hotéis se houver múltiplos matches (evita hotel → Dog Walker)
        const match = matches.find(w => w.professional_type === 'hotel') || matches[0];
        if (match?.created_by) {
          const type = match.professional_type === 'hotel' ? 'hotel' : 'walker';
          ensureSlug(type, match.created_by, match.hotel_details?.hotel_name || match.walker_name, slug);
          setResolved({ email: match.created_by, type });
          return;
        }
      }

      if (trainersRes.status === 'fulfilled' && trainersRes.value?.length > 0) {
        const match = trainersRes.value.find(t => {
          const s = slugify(t.trainer_name);
          return s === slug || s === baseSlug;
        });
        if (match?.created_by) {
          ensureSlug('trainer', match.created_by, match.trainer_name, slug);
          setResolved({ email: match.created_by, type: 'trainer' });
          return;
        }
      }

      // 5) PartnerCompany — só agora, quando nada acima correspondeu
      try {
        const companies = await base44.entities.PartnerCompany.list(undefined, 200);
        const match = companies.find(c => slugify(c.company_name) === slug);
        if (match?.id) {
          ensureSlug('company', match.company_email, match.company_name, slug);
          setResolved({ partnerId: match.id });
          return;
        }
      } catch (e) { /* intentionally ignored */ }

      if (!cancelled) setNotFound(true);
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

  // Renderizar o perfil diretamente — o URL mantém-se /p/slug
  if (resolved?.email) return <UserProfile fixedEmail={resolved.email} fixedType={resolved.type} />;
  if (resolved?.id) return <UserProfile fixedId={resolved.id} fixedType={resolved.type} />;
  if (resolved?.partnerId) return <Navigate to={`/PartnerDetails?id=${resolved.partnerId}`} replace />;

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Perfil não encontrado</h2>
          <p className="text-slate-500 mb-6">O perfil que procura não existe ou foi removido.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-full bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  // Esqueleto com a estrutura do perfil — aparece de imediato em vez de um spinner
  return <ProfileSkeleton />;
}