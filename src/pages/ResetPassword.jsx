import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";

export default function ResetPassword() {
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
      toast.error("As senhas não coincidem");
      return;
    }
    if (!token) {
      toast.error("Token inválido ou expirado");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      setSuccess(true);
      toast.success("Senha alterada com sucesso!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.message || "Erro ao resetar senha");
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
            <p className="text-red-600 font-medium">Link de recuperação inválido ou expirado</p>
            <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700 font-medium">
              Solicitar novo link
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
            <h1 className="text-2xl font-semibold text-slate-900">Nova Senha</h1>
            <p className="text-sm text-slate-500">Defina uma nova senha para sua conta</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm text-green-800 font-medium">Senha alterada com sucesso!</p>
              <p className="text-xs text-green-700">Será redirecionado para login em breve...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Nova Senha
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
                  Confirmar Senha
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resetar Senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}