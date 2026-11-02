import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { ta } from "@/components/authTranslations";
import { safeReturnTo } from "@/lib/authReturnTo";
import SocialAuthButton from "@/components/auth/SocialAuthButton";

export default function Login() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Destino após entrar: ?returnTo= (ex.: aprovação no consentimento MCP) manda,
  // senão o ?from= interno da app. safeReturnTo bloqueia redirecionamentos externos.
  const getDest = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('returnTo')) return safeReturnTo();
    return params.get('from') || '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = getDest();
    } catch (error) {
      toast.error(error.message || ta('invalidLogin', language));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    base44.auth.loginWithProvider("google", getDest());
  };

  const handleAppleLogin = () => {
    base44.auth.loginWithProvider("apple", getDest());
  };

  const registerHref = (() => {
    const p = new URLSearchParams(window.location.search);
    const q = new URLSearchParams();
    if (p.get('from')) q.set('from', p.get('from'));
    if (p.get('returnTo')) q.set('returnTo', p.get('returnTo'));
    const qs = q.toString();
    return qs ? `/register?${qs}` : '/register';
  })();

  return (
    <div className="min-h-screen w-full bg-slate-50 md:grid md:grid-cols-2">
      {/* Painel de marca — apenas em ecrãs largos */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0e9c8b] via-[#0c7d71] to-[#083b36] p-14 md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/[0.07] blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <PawCaoLogo size="small" showText={false} />
          </div>
          <span className="font-display text-3xl tracking-tight text-white">
            PawCão
          </span>
        </div>

        <div className="relative">
          <div className="mb-6 flex gap-3 text-white/25">
            <PawPrint className="h-6 w-6" />
            <PawPrint className="mt-4 h-6 w-6" />
            <PawPrint className="h-6 w-6" />
          </div>
          <div className="h-px w-16 bg-white/25" />
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2.5 md:hidden">
            <PawCaoLogo size="small" showText={false} />
            <span className="font-display text-2xl tracking-tight text-slate-900">
              Paw<span className="text-[#0d9483]">Cão</span>
            </span>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="font-heading text-[1.7rem] font-bold leading-tight tracking-tight text-slate-900">
              {ta('login', language)}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              {ta('welcomeBack', language)}
            </p>
          </div>

          <div className="space-y-3">
            <SocialAuthButton onClick={handleGoogleLogin} label={ta('continueWithGoogle', language)}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="h-5 w-5"
                alt=""
              />
            </SocialAuthButton>

            <SocialAuthButton onClick={handleAppleLogin} label={ta('continueWithApple', language)} tone="dark">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </SocialAuthButton>
          </div>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {ta('or', language)}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {ta('email', language)}
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#0d9483] focus:ring-2 focus:ring-[#0d9483]/15"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {ta('password', language)}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#0d9483] transition-colors hover:text-[#0a6f62]"
                >
                  {ta('forgotPassword', language)}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-4 pr-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#0d9483] focus:ring-2 focus:ring-[#0d9483]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-[#0d9483] text-sm font-bold text-white shadow-[0_6px_18px_rgba(13,148,131,0.28)] transition-all hover:bg-[#0b8274] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : ta('signIn', language)}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {ta('noAccount', language)}{" "}
            <Link to={registerHref} className="font-semibold text-[#0d9483] transition-colors hover:text-[#0a6f62]">
              {ta('createAccount', language)}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}