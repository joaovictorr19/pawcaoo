import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState("register"); // "register" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
      toast.success("Código enviado para o seu email!");
    } catch (error) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode });
      base44.auth.setToken(res.access_token);
      window.location.href = "/";
    } catch (error) {
      toast.error(error.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await base44.auth.resendOtp(email);
      toast.success("Código reenviado!");
    } catch {
      toast.error("Erro ao reenviar código");
    }
  };

  const handleGoogleLogin = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const handleAppleLogin = () => {
    base44.auth.loginWithProvider("apple", "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex justify-center">
            <PawCaoLogo size="medium" showText={true} />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {step === "register" ? "Criar Conta" : "Verificar Email"}
            </h1>
            <p className="text-sm text-slate-500">
              {step === "register"
                ? "Junte-se à comunidade PawCão"
                : `Insira o código enviado para ${email}`}
            </p>
          </div>

          {step === "register" ? (
            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Continuar com Google
              </button>

              <button
                onClick={handleAppleLogin}
                className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-black hover:bg-slate-800 text-white font-medium text-sm transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continuar com Apple
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">ou</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Email</label>
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
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Senha</label>
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
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Confirmar Senha</label>
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
                  className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta"}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Código de Verificação</label>
                <Input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 text-center text-lg tracking-widest"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Reenviar código
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}