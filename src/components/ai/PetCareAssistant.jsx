import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Dog, 
  Heart,
  Stethoscope,
  Apple,
  GraduationCap,
  X,
  Minimize2,
  Maximize2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import ReactMarkdown from 'react-markdown';

const translations = {
  pt: {
    title: 'Assistente PawCão',
    subtitle: 'Pergunte-me sobre cuidados com o seu pet!',
    placeholder: 'Ex: Como treinar o meu cão a não puxar a trela?',
    send: 'Enviar',
    thinking: 'A pensar...',
    suggestions: [
      { icon: Stethoscope, text: 'Sinais de doença no meu cão', category: 'health' },
      { icon: Apple, text: 'Alimentação ideal para cachorro', category: 'nutrition' },
      { icon: GraduationCap, text: 'Treino de obediência básica', category: 'training' },
      { icon: Heart, text: 'Ansiedade de separação', category: 'behavior' }
    ],
    categories: {
      health: 'Saúde',
      nutrition: 'Nutrição',
      training: 'Treino',
      behavior: 'Comportamento'
    },
    welcome: 'Olá! 🐾 Sou o assistente virtual da PawCão. Posso ajudar com dúvidas sobre saúde, nutrição, treino e comportamento do seu pet. Como posso ajudar?',
    errorMessage: 'Desculpe, ocorreu um erro. Tente novamente.',
    recommendServices: 'Com base na sua pergunta, recomendo:'
  },
  es: {
    title: 'Asistente PawCão',
    subtitle: '¡Pregúntame sobre el cuidado de tu mascota!',
    placeholder: 'Ej: ¿Cómo entrenar a mi perro a no tirar de la correa?',
    send: 'Enviar',
    thinking: 'Pensando...',
    suggestions: [
      { icon: Stethoscope, text: 'Señales de enfermedad en mi perro', category: 'health' },
      { icon: Apple, text: 'Alimentación ideal para cachorro', category: 'nutrition' },
      { icon: GraduationCap, text: 'Entrenamiento de obediencia básica', category: 'training' },
      { icon: Heart, text: 'Ansiedad por separación', category: 'behavior' }
    ],
    categories: {
      health: 'Salud',
      nutrition: 'Nutrición',
      training: 'Entrenamiento',
      behavior: 'Comportamiento'
    },
    welcome: '¡Hola! 🐾 Soy el asistente virtual de PawCão. Puedo ayudarte con dudas sobre salud, nutrición, entrenamiento y comportamiento de tu mascota. ¿Cómo puedo ayudarte?',
    errorMessage: 'Lo siento, ocurrió un error. Inténtalo de nuevo.',
    recommendServices: 'Basado en tu pregunta, recomiendo:'
  },
  en: {
    title: 'PawCão Assistant',
    subtitle: 'Ask me about pet care!',
    placeholder: 'Ex: How to train my dog not to pull on the leash?',
    send: 'Send',
    thinking: 'Thinking...',
    suggestions: [
      { icon: Stethoscope, text: 'Signs of illness in my dog', category: 'health' },
      { icon: Apple, text: 'Ideal food for puppies', category: 'nutrition' },
      { icon: GraduationCap, text: 'Basic obedience training', category: 'training' },
      { icon: Heart, text: 'Separation anxiety', category: 'behavior' }
    ],
    categories: {
      health: 'Health',
      nutrition: 'Nutrition',
      training: 'Training',
      behavior: 'Behavior'
    },
    welcome: 'Hello! 🐾 I\'m PawCão\'s virtual assistant. I can help with questions about your pet\'s health, nutrition, training, and behavior. How can I help?',
    errorMessage: 'Sorry, an error occurred. Please try again.',
    recommendServices: 'Based on your question, I recommend:'
  },
  fr: {
    title: 'Assistant PawCão',
    subtitle: 'Posez-moi vos questions sur les soins de votre animal!',
    placeholder: 'Ex: Comment apprendre à mon chien à ne pas tirer en laisse?',
    send: 'Envoyer',
    thinking: 'Réflexion...',
    suggestions: [
      { icon: Stethoscope, text: 'Signes de maladie chez mon chien', category: 'health' },
      { icon: Apple, text: 'Alimentation idéale pour chiot', category: 'nutrition' },
      { icon: GraduationCap, text: 'Dressage de base', category: 'training' },
      { icon: Heart, text: 'Anxiété de séparation', category: 'behavior' }
    ],
    categories: {
      health: 'Santé',
      nutrition: 'Nutrition',
      training: 'Dressage',
      behavior: 'Comportement'
    },
    welcome: 'Bonjour! 🐾 Je suis l\'assistant virtuel de PawCão. Je peux vous aider avec des questions sur la santé, la nutrition, le dressage et le comportement de votre animal. Comment puis-je vous aider?',
    errorMessage: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
    recommendServices: 'Selon votre question, je recommande:'
  }
};

// Pet care knowledge base embedded in prompts
const knowledgeBase = {
  health: `
    - Sinais de alerta: letargia, perda de apetite, vómitos, diarreia, dificuldade respiratória
    - Vacinação essencial: raiva, parvovirose, cinomose, hepatite
    - Desparasitação: interna (3-6 meses), externa (mensal)
    - Check-ups: anuais para adultos, semestrais para seniores
  `,
  nutrition: `
    - Cachorros: 3-4 refeições/dia até 6 meses, depois 2x/dia
    - Proteína: 25-30% para adultos, mais para cachorros
    - Evitar: chocolate, uvas, cebola, alho, xilitol
    - Hidratação: 50-60ml/kg de peso por dia
  `,
  training: `
    - Reforço positivo: recompensas imediatas após comportamento desejado
    - Consistência: mesmos comandos, mesmo tom
    - Sessões curtas: 5-15 minutos
    - Comandos básicos: senta, deita, fica, vem, não
    - Socialização: entre 3-14 semanas é crucial
  `,
  behavior: `
    - Ansiedade de separação: dessensibilização gradual
    - Agressividade: identificar gatilhos, consultar profissional
    - Latidos excessivos: exercício adequado, enriquecimento mental
    - Destruição: redirecionar para brinquedos apropriados
  `
};

export default function PetCareAssistant({ isOpen, onClose, userDogs = [] }) {
  const { language } = useLanguage();
  const t = translations[language] || translations['pt'];
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t.welcome }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch available services and products for recommendations
  const { data: walkers = [] } = useQuery({
    queryKey: ['walkersForAI'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true, verification_status: 'verified' }, '-rating', 5),
    enabled: isOpen
  });

  const { data: storeItems = [] } = useQuery({
    queryKey: ['storeItemsForAI'],
    queryFn: () => base44.entities.StoreItem.filter({ is_active: true }, '-rating', 10),
    enabled: isOpen
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectCategory = (question) => {
    const q = question.toLowerCase();
    if (q.includes('saúde') || q.includes('doença') || q.includes('vacina') || q.includes('veterinário') || q.includes('health') || q.includes('sick')) {
      return 'health';
    }
    if (q.includes('comida') || q.includes('alimenta') || q.includes('ração') || q.includes('dieta') || q.includes('food') || q.includes('nutrition')) {
      return 'nutrition';
    }
    if (q.includes('treino') || q.includes('treinar') || q.includes('comando') || q.includes('obediência') || q.includes('train')) {
      return 'training';
    }
    if (q.includes('comportamento') || q.includes('ansiedade') || q.includes('agressivo') || q.includes('latir') || q.includes('behavior') || q.includes('anxiety')) {
      return 'behavior';
    }
    return 'general';
  };

  const getRecommendations = (category, question) => {
    const recs = [];
    const q = question.toLowerCase();
    
    // Recommend trainers for training questions
    if (category === 'training' || q.includes('treino') || q.includes('treinar')) {
      const trainers = walkers.filter(w => w.is_verified_trainer);
      if (trainers.length > 0) {
        recs.push({
          type: 'service',
          title: language === 'pt' ? 'Treinadores Certificados' : 'Certified Trainers',
          items: trainers.slice(0, 2).map(t => ({ name: t.walker_name, id: t.id, rating: t.rating }))
        });
      }
    }
    
    // Recommend walkers for exercise/behavior
    if (category === 'behavior' || q.includes('exercício') || q.includes('energia')) {
      const topWalkers = walkers.slice(0, 2);
      if (topWalkers.length > 0) {
        recs.push({
          type: 'service',
          title: language === 'pt' ? 'Passeadores Recomendados' : 'Recommended Walkers',
          items: topWalkers.map(w => ({ name: w.walker_name, id: w.id, rating: w.rating }))
        });
      }
    }
    
    // Recommend products based on category
    if (category === 'nutrition') {
      const foodItems = storeItems.filter(i => i.category === 'Alimentação');
      if (foodItems.length > 0) {
        recs.push({
          type: 'product',
          title: language === 'pt' ? 'Produtos de Alimentação' : 'Food Products',
          items: foodItems.slice(0, 2).map(p => ({ name: p.title, id: p.id, price: p.price }))
        });
      }
    }
    
    if (category === 'health') {
      const healthItems = storeItems.filter(i => i.category === 'Higiene' || i.category === 'Veterinária');
      if (healthItems.length > 0) {
        recs.push({
          type: 'product',
          title: language === 'pt' ? 'Produtos de Saúde' : 'Health Products',
          items: healthItems.slice(0, 2).map(p => ({ name: p.title, id: p.id, price: p.price }))
        });
      }
    }
    
    return recs;
  };

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const category = detectCategory(messageToSend);
      const relevantKnowledge = category !== 'general' ? knowledgeBase[category] : Object.values(knowledgeBase).join('\n');
      
      // Build context about user's dogs
      const dogsContext = userDogs.length > 0 
        ? `O utilizador tem os seguintes cães: ${userDogs.map(d => `${d.dog_name} (${d.breed}, ${d.age_years || '?'} anos, ${d.dog_size})`).join(', ')}.`
        : '';

      const systemPrompt = `Tu és o assistente virtual da PawCão, uma plataforma de serviços para animais de estimação (passeadores, treinadores, loja, adoção).

REGRAS:
1. Responde SEMPRE em ${language === 'pt' ? 'Português' : language === 'es' ? 'Espanhol' : language === 'fr' ? 'Francês' : 'Inglês'}
2. Sê amigável, profissional e conciso (máximo 150 palavras)
3. Usa emojis ocasionalmente para tornar a conversa agradável
4. Se a pergunta for sobre emergência médica, SEMPRE recomenda consultar um veterinário
5. Quando apropriado, menciona que a PawCão tem serviços relevantes (passeadores, treinadores, loja)
6. Não inventes informações médicas - quando não tiveres certeza, recomenda profissional

BASE DE CONHECIMENTO:
${relevantKnowledge}

${dogsContext}

CONTEXTO: O utilizador perguntou sobre a categoria "${category}".`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nPergunta do utilizador: ${messageToSend}`,
        add_context_from_internet: false
      });

      const recommendations = getRecommendations(category, messageToSend);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: response,
        recommendations: recommendations.length > 0 ? recommendations : null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t.errorMessage 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]"
      >
        <Card className={`border-0 shadow-2xl overflow-hidden ${isMinimized ? 'h-auto' : 'h-[500px]'} flex flex-col`}>
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{t.title}</CardTitle>
                  <p className="text-xs text-white/80">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>p]:my-1">
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                        
                        {/* Recommendations */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-2 space-y-2">
                            <p className="text-xs text-gray-500 font-medium">{t.recommendServices}</p>
                            {msg.recommendations.map((rec, rIdx) => (
                              <div key={rIdx} className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                <p className="text-xs font-semibold text-blue-800 mb-1">{rec.title}</p>
                                <div className="flex flex-wrap gap-1">
                                  {rec.items.map((item, iIdx) => (
                                    <Badge 
                                      key={iIdx} 
                                      className="bg-white text-blue-700 text-[10px] cursor-pointer hover:bg-blue-100"
                                    >
                                      {item.name} {item.rating && `⭐${item.rating}`} {item.price && `€${item.price}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">{t.thinking}</span>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Suggestions (only show if few messages) */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {t.suggestions.map((sug, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] bg-gray-50 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleSend(sug.text)}
                        disabled={isLoading}
                      >
                        <sug.icon className="w-3 h-3 mr-1" />
                        {sug.text.length > 20 ? sug.text.substring(0, 20) + '...' : sug.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t bg-gray-50 flex-shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.placeholder}
                    className="flex-1 h-10 bg-white"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}