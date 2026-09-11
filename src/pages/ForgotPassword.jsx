import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { ta } from "@/components/authTranslations";

export default function ForgotPassword() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
      setSent(true);
      toast.success(ta('recoverySent', language));
    } catch (error) {
      toast.success(ta('recoveryGeneric', language));
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex justify-center">
            <PawCaoLogo size="medium" showText={true} />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {sent ? ta('checkEmail', language) : ta('recoverPassword', language)}
            </h1>
            <p className="text-sm text-slate-500">
              {sent
                ? ta('recoveryGeneric', language)
                : ta('enterEmailToRecover', language)}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  {ta('email', language)}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : ta('sendLink', language)}
              </Button>
            </form>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-sm text-orange-800">
                {ta('linkSentTo', language, { email })}
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {ta('backToLogin', language)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}