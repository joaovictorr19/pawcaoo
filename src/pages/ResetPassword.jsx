import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { ta } from "@/components/authTranslations";

export default function ResetPassword() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(ta('passwordsDontMatch', language));
      return;
    }
    if (!token) {
      toast.error(ta('invalidToken', language));
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      setSuccess(true);
      toast.success(ta('passwordChanged', language));
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.message || ta('passwordResetError', language));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
            <PawCaoLogo size="medium" showText={true} />
            <p className="text-red-600 font-medium">{ta('recoveryInvalid', language)}</p>
            <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700 font-medium">
              {ta('requestNewLink', language)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex justify-center">
            <PawCaoLogo size="medium" showText={true} />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">{ta('newPassword', language)}</h1>
            <p className="text-sm text-slate-500">{ta('setNewPassword', language)}</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm text-green-800 font-medium">{ta('passwordChanged', language)}</p>
              <p className="text-xs text-green-700">{ta('redirectingToLogin', language)}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  {ta('newPassword', language)}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  {ta('confirmPassword', language)}
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : ta('resetPasswordBtn', language)}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}