import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dog, Star, Shield, Heart, Clock, TrendingUp, Users, Award, CheckCircle2, Zap, Crown, Video } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import PawCaoLogo from "@/components/PawCaoLogo";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Check if user is logged in
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Redirect to Home if user is logged in using navigate
  useEffect(() => {
    if (!isLoading && user) {
      navigate(createPageUrl("Home")); // Use navigate instead of window.location.href
    }
  }, [user, isLoading, navigate]); // Added navigate to dependency array

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <PawCaoLogo size="large" />
          <p className="text-gray-600 mt-4">A carregar...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, don't show landing page (will redirect)
  if (user) {
    return null;
  }

  const features = [
    {
      icon: Shield,
      title: "100% Verificado",
      description: "Todos os profissionais passam por verificação rigorosa de documentos e antecedentes"
    },
    {
      icon: Star,
      title: "Avaliações Reais",
      description: "Sistema de avaliações transparente com feedback de clientes reais"
    },
    {
      icon: Clock,
      title: "Respostas Rápidas",
      description: "Profissionais premium respondem em menos de 15 minutos"
    },
    {
      icon: Heart,
      title: "Seguro Incluído",
      description: "Todos os serviços cobertos por seguro abrangente"
    },
    {
      icon: Award,
      title: "Programa de Fidelidade",
      description: "Ganhe PawPoints em cada reserva e resgate recompensas"
    },
    {
      icon: Users,
      title: "Comunidade Vibrante",
      description: "Junte-se a milhares de donos e profissionais apaixonados por cães"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Cães Felizes" },
    { value: "500+", label: "Profissionais" },
    { value: "50,000+", label: "Passeios" },
    { value: "4.9/5", label: "Avaliação" }
  ];

  const services = [
    {
      title: "Passeios de Cães",
      description: "Passeadores verificados para o seu melhor amigo",
      icon: "🐕"
    },
    {
      title: "Treino Profissional",
      description: "Treinadores certificados para educação canina",
      icon: "🎓"
    },
    {
      title: "Dog Sitting",
      description: "Cuidados 24/7 quando você está fora",
      icon: "🏠"
    },
    {
      title: "Emergências",
      description: "Passeios urgentes quando você precisa",
      icon: "⚡"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Navbar - Enhanced */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-green-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PawCaoLogo size="default" animated={true} />
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors dark:text-gray-300 dark:hover:text-green-400">
                Funcionalidades
              </a>
              <a href="#services" className="text-gray-700 hover:text-green-600 transition-colors dark:text-gray-300 dark:hover:text-green-400">
                Serviços
              </a>
              <a href="#stats" className="text-gray-700 hover:text-green-600 transition-colors dark:text-gray-300 dark:hover:text-green-400">
                Sobre Nós
              </a>
              <Link to={createPageUrl("AboutUs")} className="text-gray-700 hover:text-green-600 transition-colors dark:text-gray-300 dark:hover:text-green-400">
                Contacto
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleLogin}
                className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-gray-700"
              >
                Entrar
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
              >
                Criar Conta Grátis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced with animated logos */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 dark:bg-green-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo gigante animado */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <PawCaoLogo size="xlarge" animated={true} />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight drop-shadow-lg">
              O Melhor Cuidado Para o<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 dark:from-green-400 dark:via-blue-400 dark:to-purple-400">
                Seu Melhor Amigo
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Conectamos donos de cães com profissionais verificados e apaixonados. 
              Passeios, treino, dog sitting e muito mais! 🐾
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleLogin}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white h-14 text-lg px-8 hover:from-green-700 hover:to-blue-700 shadow-lg"
              >
                <Dog className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleLogin}
                className="border-2 border-green-600 text-green-600 h-14 text-lg px-8 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-gray-700"
              >
                <Crown className="w-5 h-5 mr-2" />
                Tornar-me Profissional
              </Button>
            </div>

            {/* Stats */}
            <div id="stats" className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2 dark:from-green-400 dark:to-blue-400">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Serviços PawCão
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Tudo o que o seu cão precisa, num só lugar
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all h-full bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">{service.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Por Que Escolher PawCão?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              A plataforma mais confiável de Portugal para cuidados caninos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all h-full dark:bg-gray-800">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto Para Começar?
            </h2>
            <p className="text-xl mb-8 text-white/90 dark:text-gray-200">
              Junte-se a milhares de donos e profissionais satisfeitos na maior plataforma de cuidados caninos de Portugal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleLogin}
                className="bg-white text-green-600 h-14 text-lg px-8 hover:bg-gray-100 shadow-lg dark:bg-gray-200 dark:text-green-800 dark:hover:bg-gray-300"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Criar Conta Grátis
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <PawCaoLogo size="default" className="brightness-0 invert" animated={true} />
              </div>
              <p className="text-gray-400 text-sm dark:text-gray-500">
                A plataforma líder para serviços profissionais de cuidados caninos em Portugal
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors dark:hover:text-green-400">Passeios de Cães</a></li>
                <li><a href="#" className="hover:text-white transition-colors dark:hover:text-green-400">Treino Profissional</a></li>
                <li><a href="#" className="hover:text-white transition-colors dark:hover:text-green-400">Dog Sitting</a></li>
                <li><a href="#" className="hover:text-white transition-colors dark:hover:text-green-400">Emergências</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl("AboutUs")} className="hover:text-white transition-colors dark:hover:text-green-400">Sobre Nós</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-white transition-colors dark:hover:text-green-400">Contacto</Link></li>
                <li><Link to={createPageUrl("FAQ")} className="hover:text-white transition-colors dark:hover:text-green-400">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors dark:hover:text-green-400">Termos de Serviço</Link></li>
                <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors dark:hover:text-green-400">Política de Privacidade</Link></li>
                <li><Link to={createPageUrl("CookiesPolicy")} className="hover:text-white transition-colors dark:hover:text-green-400">Política de Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PawCaoLogo size="small" showText={false} />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                © 2025 PawCão. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}