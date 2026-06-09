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
      subtitle: "Nascido da Frustração com Plataformas Confusas",
      missionTitle: "A Nossa Missão",
      missionText: "Simplificar a forma como os donos de cães encontram profissionais, hotéis caninos e parceiros pet shop. Oferecemos eficiência, segurança e uma experiência tão intuitiva que qualquer pessoa consegue fazer uma reserva em segundos, sem burocracias desnecessárias.",
      
      storyTitle: "A Nossa História: Por Que Criamos o PawCão",
      storyText: "Criámos o PawCão porque existe um problema real. Outros sites de cuidados para animais são confusos, longos em registos, cheios de passos desnecessários e francamente, não são eficientes. Vimos donos de cães frustrados, profissionais perdidos em interfaces complicadas, e hotéis caninos a gastar horas em processos que deviam levar minutos.\n\nDecidimos fazer diferente. O PawCão foi criado com um princípio simples: eficiência em primeiro lugar, sem comprometer a segurança. Queremos ser os líderes globais neste espaço, começando por Portugal e Espanha, criando uma plataforma que realmente serve as pessoas (e os cães).",
      
      valuesTitle: "Os Nossos Pilares",
      values: [
        {
          icon: Zap,
          title: "Eficiência Sem Compromissos",
          description: "Reservas em segundos, registos simplificados. Nada de formulários longos ou processos confusos. Fazemos a tecnologia servir você, não o contrário."
        },
        {
          icon: Shield,
          title: "Segurança Reforçada",
          description: "Embora sejamos rápidos, nunca descuramos a segurança. Verificação rigorosa, pagamentos encriptados, e confiança total em cada transação."
        },
        {
          icon: Award,
          title: "Gamificação & Recompensas",
          description: "Torne a experiência divertida. Ganhe pontos, desbloqueie recompensas, e seja parte de uma comunidade que valoriza a lealdade."
        },
        {
          icon: Users,
          title: "Comunidade Global",
          description: "Conectamos donos, profissionais, hotéis e pet shops. Um ecossistema completo onde todos prosperam juntos."
        }
      ],

      statsTitle: "PawCão em Números",

      whyTitle: "Por Que Escolher o PawCão?",
      whyItems: [
        {
          icon: Zap,
          title: "Reservas Simples",
          description: "Faça uma reserva em menos de 1 minuto. Sem burocracias, sem confusão."
        },
        {
          icon: Shield,
          title: "Segurança Total",
          description: "Todos os profissionais verificados, seguros incluídos, pagamentos 100% seguros."
        },
        {
          icon: Heart,
          title: "Acompanhamento em Tempo Real",
          description: "Saiba exatamente onde está o seu cão. Tracking GPS, fotos diárias, e atualizações constantes."
        },
        {
          icon: Award,
          title: "Recompensas Reais",
          description: "Cada reserva vale pontos. Resgate prêmios, upgrades, e vantagens exclusivas."
        }
      ],

      teamTitle: "A Nossa Visão para o Futuro",
      teamText: "Somos uma equipa de pessoas apaixonadas pela eficiência e pelo bem-estar animal. Acreditamos que a tecnologia deve tornar a vida mais simples, não mais complicada. O nosso objetivo é ser a plataforma número 1 globalmente para cuidados com animais de estimação.",
      
      joinTitle: "Junte-se ao Movimento",
      joinText: "Quer seja um dono que procura simplicidade e segurança, um profissional que quer crescer, ou um negócio pet que quer escalar—tem um lugar no PawCão. Estamos apenas a começar, e o melhor está por vir."
    },
    en: {
      title: "About PawCão",
      subtitle: "Born from Frustration with Confusing Platforms",
      missionTitle: "Our Mission",
      missionText: "Simplify how dog owners find professionals, dog hotels, and pet shop partners. We deliver efficiency, security, and such an intuitive experience that anyone can make a booking in seconds—without unnecessary red tape.",
      
      storyTitle: "Our Story: Why We Built PawCão",
      storyText: "We created PawCão because there's a real problem. Other pet care websites are confusing, lengthy in registration, filled with unnecessary steps, and frankly, inefficient. We saw dog owners frustrated, professionals lost in complicated interfaces, and dog hotels spending hours on processes that should take minutes.\n\nWe decided to do it differently. PawCão was built on one principle: efficiency first, never compromising on safety. We want to be the global leaders in this space, starting with Portugal and Spain, building a platform that truly serves people (and dogs).",
      
      valuesTitle: "Our Pillars",
      values: [
        {
          icon: Zap,
          title: "Efficiency Without Compromise",
          description: "Bookings in seconds, simplified registration. No long forms or confusing processes. We make technology work for you, not the other way around."
        },
        {
          icon: Shield,
          title: "Reinforced Security",
          description: "While we're fast, we never compromise on safety. Rigorous verification, encrypted payments, and complete trust in every transaction."
        },
        {
          icon: Award,
          title: "Gamification & Rewards",
          description: "Make the experience fun. Earn points, unlock rewards, and be part of a community that values loyalty."
        },
        {
          icon: Users,
          title: "Global Community",
          description: "We connect owners, professionals, hotels, and pet shops. A complete ecosystem where everyone thrives together."
        }
      ],

      statsTitle: "PawCão in Numbers",

      whyTitle: "Why Choose PawCão?",
      whyItems: [
        {
          icon: Zap,
          title: "Simple Bookings",
          description: "Make a reservation in under 1 minute. No red tape, no confusion."
        },
        {
          icon: Shield,
          title: "Complete Safety",
          description: "All professionals verified, insurance included, 100% secure payments."
        },
        {
          icon: Heart,
          title: "Real-Time Tracking",
          description: "Know exactly where your dog is. GPS tracking, daily photos, and constant updates."
        },
        {
          icon: Award,
          title: "Real Rewards",
          description: "Every booking earns you points. Redeem for prizes, upgrades, and exclusive perks."
        }
      ],

      teamTitle: "Our Vision for the Future",
      teamText: "We're a team of people passionate about efficiency and animal welfare. We believe technology should make life simpler, not more complicated. Our goal is to be the #1 platform globally for pet care.",
      
      joinTitle: "Join the Movement",
      joinText: "Whether you're an owner seeking simplicity and safety, a professional wanting to grow, or a pet business ready to scale—you have a place in PawCão. We're just getting started, and the best is yet to come."
    },
    es: {
      title: "Sobre PawCão",
      subtitle: "Nacido de la Frustración con Plataformas Confusas",
      missionTitle: "Nuestra Misión",
      missionText: "Simplificar cómo los dueños de perros encuentran profesionales, hoteles caninos y socios de tiendas de mascotas. Ofrecemos eficiencia, seguridad y una experiencia tan intuitiva que cualquiera puede hacer una reserva en segundos, sin trámites innecesarios.",
      
      storyTitle: "Nuestra Historia: Por Qué Creamos PawCão",
      storyText: "Creamos PawCão porque existe un problema real. Otros sitios de cuidado de mascotas son confusos, tediosos en los registros, llenos de pasos innecesarios y francamente, no son eficientes. Vimos dueños de perros frustrados, profesionales perdidos en interfaces complicadas, y hoteles caninos gastando horas en procesos que deberían tomar minutos.\n\nDecidimos hacerlo diferente. PawCão fue creado con un principio simple: eficiencia primero, sin comprometer la seguridad. Queremos ser los líderes globales en este espacio, comenzando con Portugal y España, construyendo una plataforma que realmente sirva a las personas (y a los perros).",
      
      valuesTitle: "Nuestros Pilares",
      values: [
        {
          icon: Zap,
          title: "Eficiencia Sin Compromiso",
          description: "Reservas en segundos, registros simplificados. Sin formularios largos ni procesos confusos. Hacemos que la tecnología le sirva a usted, no al revés."
        },
        {
          icon: Shield,
          title: "Seguridad Reforzada",
          description: "Aunque somos rápidos, nunca comprometemos la seguridad. Verificación rigurosa, pagos encriptados, y confianza total en cada transacción."
        },
        {
          icon: Award,
          title: "Gamificación y Recompensas",
          description: "Haga que la experiencia sea divertida. Gane puntos, desbloquee recompensas y sea parte de una comunidad que valora la lealtad."
        },
        {
          icon: Users,
          title: "Comunidad Global",
          description: "Conectamos dueños, profesionales, hoteles y tiendas de mascotas. Un ecosistema completo donde todos prosperan juntos."
        }
      ],

      statsTitle: "PawCão en Números",

      whyTitle: "¿Por Qué Elegir PawCão?",
      whyItems: [
        {
          icon: Zap,
          title: "Reservas Simples",
          description: "Haga una reserva en menos de 1 minuto. Sin trámites, sin confusión."
        },
        {
          icon: Shield,
          title: "Seguridad Total",
          description: "Todos los profesionales verificados, seguros incluidos, pagos 100% seguros."
        },
        {
          icon: Heart,
          title: "Seguimiento en Tiempo Real",
          description: "Sepa exactamente dónde está su perro. GPS tracking, fotos diarias y actualizaciones constantes."
        },
        {
          icon: Award,
          title: "Recompensas Reales",
          description: "Cada reserva le gana puntos. Canjee premios, mejoras y ventajas exclusivas."
        }
      ],

      teamTitle: "Nuestra Visión para el Futuro",
      teamText: "Somos un equipo de personas apasionadas por la eficiencia y el bienestar animal. Creemos que la tecnología debe hacer la vida más simple, no más complicada. Nuestro objetivo es ser la plataforma número 1 globalmente para el cuidado de mascotas.",
      
      joinTitle: "Únete al Movimiento",
      joinText: "Ya sea que busques simpleza y seguridad, que seas un profesional que quiere crecer, o un negocio de mascotas listo para escalar—tienes un lugar en PawCão. Acabamos de empezar, y lo mejor está por venir."
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