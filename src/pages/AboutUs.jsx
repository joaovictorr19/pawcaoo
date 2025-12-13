import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Users, Award, Target, Zap, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AboutUs() {
  const { language } = useLanguage();

  // Fetch real-time stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['aboutUsStats'],
    queryFn: async () => {
      const [walkers, trainers, bookings, reviews, adoptions] = await Promise.all([
        base44.entities.WalkerProfile.filter({ is_active: true, verification_status: 'verified' }),
        base44.entities.TrainerProfile.filter({ is_active: true, verification_status: 'verified' }),
        base44.entities.Booking.filter({ status: 'completed' }),
        base44.entities.Review.list(),
        base44.entities.AdoptionApplication.filter({ status: 'approved' })
      ]);

      const totalProfessionals = walkers.length + trainers.length;
      const totalWalks = bookings.length;
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : 5.0;
      
      return {
        totalProfessionals,
        totalWalks,
        avgRating,
        adoptedDogs: adoptions.length,
        happyDogs: totalWalks + adoptions.length
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const content = {
    pt: {
      title: "Sobre o PawCão",
      subtitle: "A plataforma #1 de cuidados caninos em Portugal",
      missionTitle: "A Nossa Missão",
      missionText: "Conectar donos de cães com profissionais verificados e apaixonados, criando uma comunidade onde cada cão recebe o melhor cuidado possível.",
      
      storyTitle: "A Nossa História",
      storyText: "Fundado em 2024, o PawCão nasceu da paixão pelos cães e da necessidade de criar uma plataforma confiável onde donos possam encontrar profissionais qualificados. O que começou como uma ideia simples evoluiu para a maior rede de cuidados caninos em Portugal.",
      
      valuesTitle: "Os Nossos Valores",
      values: [
        {
          icon: Heart,
          title: "Paixão pelos Cães",
          description: "Cada decisão que tomamos tem os cães no centro. O bem-estar animal é a nossa prioridade máxima."
        },
        {
          icon: Shield,
          title: "Confiança & Segurança",
          description: "Verificação rigorosa de todos os profissionais, seguro incluído, e pagamentos seguros para sua tranquilidade."
        },
        {
          icon: Users,
          title: "Comunidade",
          description: "Construímos uma comunidade vibrante de amantes de cães, profissionais dedicados e proprietários responsáveis."
        },
        {
          icon: Award,
          title: "Qualidade",
          description: "Mantemos os mais altos padrões de qualidade em todos os serviços oferecidos na plataforma."
        }
      ],

      statsTitle: "PawCão em Números",

      whyTitle: "Por Que Escolher o PawCão?",
      whyItems: [
        {
          icon: Shield,
          title: "100% Verificado",
          description: "Todos os profissionais passam por verificação de antecedentes e documentos"
        },
        {
          icon: Heart,
          title: "Seguro Incluído",
          description: "Todos os serviços cobertos por seguro abrangente"
        },
        {
          icon: Zap,
          title: "Respostas Rápidas",
          description: "Profissionais premium respondem em menos de 15 minutos"
        },
        {
          icon: Award,
          title: "Programa de Fidelidade",
          description: "Ganhe PawPoints em cada reserva e resgate recompensas"
        }
      ],

      teamTitle: "A Nossa Equipa",
      teamText: "Somos uma equipa apaixonada de amantes de cães, tecnólogos e especialistas em cuidados animais dedicados a criar a melhor experiência possível.",
      
      joinTitle: "Junte-se à Família PawCão",
      joinText: "Seja você um dono de cão à procura de cuidados de confiança ou um profissional que quer fazer a diferença, tem um lugar aqui."
    },
    en: {
      title: "About PawCão",
      subtitle: "Portugal's #1 dog care platform",
      missionTitle: "Our Mission",
      missionText: "Connect dog owners with verified and passionate professionals, creating a community where every dog receives the best possible care.",
      
      storyTitle: "Our Story",
      storyText: "Founded in 2024, PawCão was born from a passion for dogs and the need to create a reliable platform where owners can find qualified professionals. What started as a simple idea evolved into Portugal's largest dog care network.",
      
      valuesTitle: "Our Values",
      values: [
        {
          icon: Heart,
          title: "Passion for Dogs",
          description: "Every decision we make has dogs at the center. Animal welfare is our top priority."
        },
        {
          icon: Shield,
          title: "Trust & Safety",
          description: "Rigorous verification of all professionals, insurance included, and secure payments for your peace of mind."
        },
        {
          icon: Users,
          title: "Community",
          description: "We build a vibrant community of dog lovers, dedicated professionals and responsible owners."
        },
        {
          icon: Award,
          title: "Quality",
          description: "We maintain the highest quality standards in all services offered on the platform."
        }
      ],

      statsTitle: "PawCão in Numbers",

      whyTitle: "Why Choose PawCão?",
      whyItems: [
        {
          icon: Shield,
          title: "100% Verified",
          description: "All professionals undergo background checks and document verification"
        },
        {
          icon: Heart,
          title: "Insurance Included",
          description: "All services covered by comprehensive insurance"
        },
        {
          icon: Zap,
          title: "Fast Responses",
          description: "Premium professionals respond in less than 15 minutes"
        },
        {
          icon: Award,
          title: "Loyalty Program",
          description: "Earn PawPoints on every booking and redeem rewards"
        }
      ],

      teamTitle: "Our Team",
      teamText: "We are a passionate team of dog lovers, technologists and animal care experts dedicated to creating the best possible experience.",
      
      joinTitle: "Join the PawCão Family",
      joinText: "Whether you're a dog owner looking for trusted care or a professional wanting to make a difference, you have a place here."
    },
    es: {
      title: "Sobre PawCão",
      subtitle: "La plataforma #1 de cuidado canino en Portugal",
      missionTitle: "Nuestra Misión",
      missionText: "Conectar dueños de perros con profesionales verificados y apasionados, creando una comunidad donde cada perro recibe el mejor cuidado posible.",
      
      storyTitle: "Nuestra Historia",
      storyText: "Fundada en 2024, PawCão nació de la pasión por los perros y la necesidad de crear una plataforma confiable donde los dueños puedan encontrar profesionales calificados. Lo que comenzó como una idea simple evolucionó en la red de cuidado canino más grande de Portugal.",
      
      valuesTitle: "Nuestros Valores",
      values: [
        {
          icon: Heart,
          title: "Pasión por los Perros",
          description: "Cada decisión que tomamos tiene a los perros en el centro. El bienestar animal es nuestra máxima prioridad."
        },
        {
          icon: Shield,
          title: "Confianza y Seguridad",
          description: "Verificación rigurosa de todos los profesionales, seguro incluido y pagos seguros para su tranquilidad."
        },
        {
          icon: Users,
          title: "Comunidad",
          description: "Construimos una comunidad vibrante de amantes de perros, profesionales dedicados y propietarios responsables."
        },
        {
          icon: Award,
          title: "Calidad",
          description: "Mantenemos los más altos estándares de calidad en todos los servicios ofrecidos en la plataforma."
        }
      ],

      statsTitle: "PawCão en Números",

      whyTitle: "¿Por Qué Elegir PawCão?",
      whyItems: [
        {
          icon: Shield,
          title: "100% Verificado",
          description: "Todos los profesionales pasan por verificación de antecedentes y documentos"
        },
        {
          icon: Heart,
          title: "Seguro Incluido",
          description: "Todos los servicios cubiertos por seguro integral"
        },
        {
          icon: Zap,
          title: "Respuestas Rápidas",
          description: "Profesionales premium responden en menos de 15 minutos"
        },
        {
          icon: Award,
          title: "Programa de Lealtad",
          description: "Gana PawPoints en cada reserva y canjea recompensas"
        }
      ],

      teamTitle: "Nuestro Equipo",
      teamText: "Somos un equipo apasionado de amantes de perros, tecnólogos y expertos en cuidado animal dedicados a crear la mejor experiencia posible.",
      
      joinTitle: "Únete a la Familia PawCão",
      joinText: "Ya seas un dueño de perro buscando cuidado confiable o un profesional que quiere hacer la diferencia, tienes un lugar aquí."
    }
  };

  const t = content[language] || content.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-500 to-blue-600 text-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              {t.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-10 h-10 text-green-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t.missionTitle}
                </h2>
              </div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                {t.missionText}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {t.storyTitle}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t.storyText}
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            {t.valuesTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <Card className="border-0 shadow-xl h-full hover:shadow-2xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <value.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {value.title}
                        </h3>
                        <p className="text-gray-700">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Real-Time Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            {t.statsTitle}
          </h2>
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-blue-600 text-white hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl md:text-4xl font-extrabold mb-2">
                      {stats?.happyDogs?.toLocaleString('pt-PT') || 0}+
                    </div>
                    <div className="text-sm md:text-base text-white/90">
                      {language === 'pt' ? 'Cães Felizes' : language === 'es' ? 'Perros Felices' : 'Happy Dogs'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl md:text-4xl font-extrabold mb-2">
                      {stats?.totalProfessionals?.toLocaleString('pt-PT') || 0}+
                    </div>
                    <div className="text-sm md:text-base text-white/90">
                      {language === 'pt' ? 'Profissionais Verificados' : language === 'es' ? 'Profesionales Verificados' : 'Verified Professionals'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <Heart className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl md:text-4xl font-extrabold mb-2">
                      {stats?.totalWalks?.toLocaleString('pt-PT') || 0}+
                    </div>
                    <div className="text-sm md:text-base text-white/90">
                      {language === 'pt' ? 'Passeios Realizados' : language === 'es' ? 'Paseos Realizados' : 'Walks Completed'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <Star className="w-8 h-8 mx-auto mb-3 opacity-80 fill-white" />
                    <div className="text-3xl md:text-4xl font-extrabold mb-2">
                      {stats?.avgRating || '5.0'}/5
                    </div>
                    <div className="text-sm md:text-base text-white/90">
                      {language === 'pt' ? 'Avaliação Média' : language === 'es' ? 'Calificación Promedio' : 'Average Rating'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Why Choose */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            {t.whyTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.whyItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              >
                <Card className="border-0 shadow-xl h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mb-16"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-8 md:p-12 text-center">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t.teamTitle}
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                {t.teamText}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 to-blue-600 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.joinTitle}
              </h2>
              <p className="text-xl text-white/90 mb-6">
                {t.joinText}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}