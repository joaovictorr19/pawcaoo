import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

const AGENT_NAME = "walker_recommender";
const STORAGE_KEY = "walker_recommender_conversation_id";

export default function WalkerRecommenderChat() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load or create conversation
  useEffect(() => {
    const init = async () => {
      try {
        let convId = sessionStorage.getItem(STORAGE_KEY);
        let conv = null;

        if (convId) {
          try {
            conv = await base44.agents.getConversation(convId);
          } catch { conv = null; }
        }

        if (!conv) {
          conv = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Recomendação de Dog Walkers" },
          });
          sessionStorage.setItem(STORAGE_KEY, conv.id);
        }

        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch (err) {
        console.error("Error initializing agent conversation:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Subscribe to streaming updates
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      if (isStreaming) {
        const last = (data.messages || [])[data.messages.length - 1];
        if (last && last.role === "assistant" && !last.tool_calls?.some(tc => tc.status === "pending" || tc.status === "running" || tc.status === "in_progress")) {
          setIsStreaming(false);
        }
      }
    });
    return () => unsubscribe();
  }, [conversationId, isStreaming]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming || !conversationId) return;
    setInput("");
    setIsStreaming(true);

    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (err) {
      console.error("Error sending message:", err);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Sparkles className="w-5 h-5 animate-pulse text-teal-500" />
          <span className="text-sm font-medium">A preparar o teu assistente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl rounded-t-2xl">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-slate-900 text-sm leading-tight">Assistente de Recomendação</h1>
            <p className="text-xs text-slate-500">Encontra o Dog Walker ideal para o teu cão</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-heading font-bold text-slate-800 mb-1">Olá! 👋</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Diz-me o que precisas: tipo de serviço, a tua cidade, o tamanho do teu cão e preferências especiais.
              Vou encontrar os melhores profissionais para ti!
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  isUser
                    ? "bg-teal-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm"
                }`}
              >
                {msg.content && (
                  isUser
                    ? <p className="whitespace-pre-wrap">{msg.content}</p>
                    : <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">{msg.content}</ReactMarkdown>
                )}
                {msg.tool_calls?.filter(tc => tc.display_projection?.hide_details && tc.display_projection?.details_redacted).map((tc, tcIdx) => (
                  <div key={tcIdx} className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    {tc.display_projection?.active_label && (tc.status === "pending" || tc.status === "running" || tc.status === "in_progress") && (
                      <span className="animate-pulse">{tc.display_projection.active_label}</span>
                    )}
                    {tc.display_projection?.label && (tc.status === "completed" || tc.status === "success") && (
                      <span>{tc.display_projection.label}</span>
                    )}
                    {tc.display_projection?.error_label && (tc.status === "failed" || tc.status === "error") && (
                      <span className="text-red-400">{tc.display_projection.error_label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl rounded-b-2xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Preciso de um Dog Walker em Lisboa para um cão médio, manhãs..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}