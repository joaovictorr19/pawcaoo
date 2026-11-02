import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { ta } from "@/components/authTranslations";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex justify-center">
            <PawCaoLogo size="medium" showText={true} />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">{ta('login', language)}</h1>
            <p className="text-sm text-slate-500">{ta('welcomeBack', language)}</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {ta('continueWithGoogle', language)}
          </button>

          <button
            onClick={handleAppleLogin}
            className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-black hover:bg-slate-800 text-white font-medium text-sm transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {ta('continueWithApple', language)}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{ta('or', language)}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{ta('email', language)}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{ta('password', language)}</label>
                <Link to="/forgot-password" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                  {ta('forgotPassword', language)}
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : ta('signIn', language)}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {ta('noAccount', language)}{" "}
            <Link to={(() => {
              const p = new URLSearchParams(window.location.search);
              const q = new URLSearchParams();
              if (p.get('from')) q.set('from', p.get('from'));
              if (p.get('returnTo')) q.set('returnTo', p.get('returnTo'));
              const qs = q.toString();
              return qs ? `/register?${qs}` : '/register';
            })()} className="text-orange-600 hover:text-orange-700 font-medium">
              {ta('createAccount', language)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}