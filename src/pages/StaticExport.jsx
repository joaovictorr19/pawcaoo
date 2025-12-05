import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, CheckCircle2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function StaticExport() {
  // This is the 100% static HTML content
  const staticHtml = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PawCão - Encontre Passeadores de Cães Verificados e de Confiança</title>
    <meta name="description" content="Conecte-se com passeadores de cães verificados e de confiança perto de si. Agendamento fácil, seguro incluído e avaliações reais. O melhor cuidado para o seu melhor amigo.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://pawcao.base44.app/">
    <meta property="og:title" content="PawCão - Passeadores de Cães Verificados">
    <meta property="og:description" content="Encontre o passeador ideal para o seu cão. Profissionais verificados, seguro incluído e muito amor.">
    <meta property="og:image" content="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="PawCão - Passeadores de Cães Verificados">
    <meta property="twitter:description" content="Encontre o passeador ideal para o seu cão. Profissionais verificados.">
    <meta property="twitter:image" content="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop">

    <!-- Tailwind CSS (CDN for static file) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        .gradient-text {
            background: linear-gradient(to right, #16a34a, #2563eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .blob {
            position: absolute;
            filter: blur(40px);
            z-index: -1;
            opacity: 0.4;
            animation: move 10s infinite alternate;
        }
        @keyframes move {
            from { transform: translate(0, 0) scale(1); }
            to { transform: translate(20px, -20px) scale(1.1); }
        }
    </style>
</head>
<body class="bg-slate-50 text-gray-900">

    <!-- Navigation -->
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white shadow-md">
                        <i data-lucide="dog" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xl font-bold text-gray-900">PawCão</span>
                </div>
                
                <div class="hidden md:flex items-center gap-8 font-medium text-sm">
                    <a href="#beneficios" class="text-gray-600 hover:text-green-600 transition-colors">Benefícios</a>
                    <a href="#como-funciona" class="text-gray-600 hover:text-green-600 transition-colors">Como Funciona</a>
                    <a href="#depoimentos" class="text-gray-600 hover:text-green-600 transition-colors">Avaliações</a>
                </div>

                <a href="https://pawcao.base44.app/home" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-semibold text-sm transition-all shadow-lg hover:shadow-green-200 transform hover:-translate-y-0.5">
                    Entrar / Criar Conta
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-20 pb-32 overflow-hidden">
        <div class="blob bg-green-300 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply"></div>
        <div class="blob bg-blue-300 w-96 h-96 rounded-full top-0 right-0 mix-blend-multiply animation-delay-2000"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-green-100 shadow-sm mb-8 animate-fade-in-up">
                <span class="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span class="text-sm font-medium text-gray-600">A plataforma #1 de cuidados caninos</span>
            </div>

            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                Encontre Passeadores de Cães <br class="hidden md:block" />
                <span class="gradient-text">Verificados e de Confiança</span> <br class="hidden md:block" />
                Perto de Você
            </h1>
            
            <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Conectamos donos amorosos a profissionais apaixonados. 
                Passeios monitorados, seguro incluído e a tranquilidade que o seu melhor amigo merece.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://pawcao.base44.app/home" class="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                    <i data-lucide="search" class="w-5 h-5 mr-2"></i>
                    Encontrar Passeador
                </a>
                <a href="#como-funciona" class="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                    Como Funciona
                </a>
            </div>

            <!-- Social Proof Hero -->
            <div class="mt-12 flex items-center justify-center gap-4 text-sm text-gray-500">
                <div class="flex -space-x-2">
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt=""/>
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt=""/>
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" alt=""/>
                </div>
                <p>+10.000 donos felizes confiam no PawCão</p>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section id="beneficios" class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Por que escolher o PawCão?</h2>
                <p class="text-lg text-gray-600">Segurança e qualidade são as nossas prioridades.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-12">
                <!-- Benefit 1 -->
                <div class="group p-8 rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors duration-300">
                    <div class="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i data-lucide="shield-check" class="w-7 h-7"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">100% Verificado</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Cada passeador passa por uma rigorosa verificação de identidade e antecedentes criminais. Apenas os melhores entram.
                    </p>
                </div>

                <!-- Benefit 2 -->
                <div class="group p-8 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors duration-300">
                    <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i data-lucide="heart-handshake" class="w-7 h-7"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Seguro Incluído</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Todos os serviços agendados pela plataforma incluem cobertura de seguro veterinário para emergências.
                    </p>
                </div>

                <!-- Benefit 3 -->
                <div class="group p-8 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors duration-300">
                    <div class="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i data-lucide="star" class="w-7 h-7"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Avaliações Reais</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Leia comentários honestos e detalhados de outros donos. Veja fotos dos passeios e avaliações com estrelas.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- How it Works -->
    <section id="como-funciona" class="py-24 bg-slate-50 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
                <p class="text-lg text-gray-600">Três passos simples para um cão mais feliz.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 text-center relative">
                <!-- Connecting Line (Desktop) -->
                <div class="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-200 -z-10"></div>

                <!-- Step 1 -->
                <div class="relative">
                    <div class="w-24 h-24 mx-auto bg-white border-4 border-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <span class="text-3xl font-bold text-green-600">1</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Buscar</h3>
                    <p class="text-gray-600 px-4">
                        Navegue por perfis de passeadores na sua área. Filtre por preço, experiência e serviços.
                    </p>
                </div>

                <!-- Step 2 -->
                <div class="relative">
                    <div class="w-24 h-24 mx-auto bg-white border-4 border-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <span class="text-3xl font-bold text-green-600">2</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Conversar</h3>
                    <p class="text-gray-600 px-4">
                        Converse diretamente com o passeador. Faça perguntas e conheça-o antes de reservar.
                    </p>
                </div>

                <!-- Step 3 -->
                <div class="relative">
                    <div class="w-24 h-24 mx-auto bg-white border-4 border-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <span class="text-3xl font-bold text-green-600">3</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Agendar</h3>
                    <p class="text-gray-600 px-4">
                        Reserve e pague com segurança pela plataforma. Receba atualizações e fotos do passeio.
                    </p>
                </div>
            </div>
            
            <div class="text-center mt-16">
                <a href="https://pawcao.base44.app/home" class="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
                    Começar Agora
                    <i data-lucide="arrow-right" class="w-5 h-5 ml-2"></i>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="flex items-center gap-2">
                    <i data-lucide="dog" class="w-6 h-6 text-green-600"></i>
                    <span class="text-xl font-bold text-gray-900">PawCão</span>
                </div>
                
                <div class="text-sm text-gray-500">
                    &copy; 2025 PawCão. Todos os direitos reservados.
                </div>
                
                <div class="flex gap-6">
                    <a href="https://pawcao.base44.app/home" class="text-gray-500 hover:text-green-600 transition-colors">
                        <i data-lucide="instagram" class="w-5 h-5"></i>
                    </a>
                    <a href="https://pawcao.base44.app/home" class="text-gray-500 hover:text-green-600 transition-colors">
                        <i data-lucide="facebook" class="w-5 h-5"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Initialize Lucide Icons
        lucide.createIcons();
    </script>
</body>
</html>`;

  const handleDownload = () => {
    const blob = new Blob([staticHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "index.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Ficheiro index.html descarregado!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(staticHtml);
    toast.success("Código HTML copiado!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exportação de Landing Page Estática</h1>
          <p className="text-gray-600">
            Gere uma página HTML ultra-rápida e otimizada para SEO para usar no seu domínio externo (Netlify, Vercel, etc).
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Otimizado para SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Inclui meta tags, Open Graph, estrutura semântica e performance máxima.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Pronto para Publicar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Ficheiro único com CSS (Tailwind) e Ícones (Lucide) incluídos via CDN. Zero configuração.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-2 border-green-100">
          <CardHeader>
            <CardTitle>Descarregar Ficheiro</CardTitle>
            <CardDescription>
              Obtenha o ficheiro <code>index.html</code> pronto para arrastar e soltar no Netlify.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 h-12 px-6 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Descarregar index.html
            </Button>
            <Button variant="outline" onClick={copyToClipboard} className="h-12">
              <Copy className="w-5 h-5 mr-2" />
              Copiar Código
            </Button>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-mono text-xs text-gray-500">
            Pré-visualização do Código (início)
          </div>
          <pre className="p-4 text-xs text-gray-600 overflow-x-auto bg-slate-50">
            {staticHtml.substring(0, 500)}...
          </pre>
        </div>
      </div>
    </div>
  );
}