import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Search, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function AISearchAssistant({ onApplyFilters, currentMode = 'walkers' }) {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setAiSuggestion(null);

    try {
      // Construir o prompt baseada no modo atual
      const contextPrompt = currentMode === 'walkers' 
        ? "Services available: walking, boarding, house_sitting, drop_in. Filters: location, maxPrice, dogSize (small/medium/large), experience."
        : "Services: training. Filters: location, maxPrice, specialty (obedience, behavior, puppy), methodology.";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
          You are an AI search assistant for a Dog Walking/Training app.
          User Query: "${query}"
          Context: ${contextPrompt}
          
          Analyze the intent and extract structured filters.
          Return ONLY a JSON object with these keys (use null if not mentioned):
          {
            "location": string or null,
            "serviceType": string (enum based on context) or null,
            "maxPrice": number or null,
            "keywords": string[],
            "intent_summary": string (short friendly summary in the same language as the query)
          }
        `,
        response_json_schema: {
          type: "object",
          properties: {
            location: { type: "string" },
            serviceType: { type: "string" },
            maxPrice: { type: "number" },
            keywords: { type: "array", items: { type: "string" } },
            intent_summary: { type: "string" }
          }
        }
      });

      const result = response; // InvokeLLM returns the dict directly when schema is provided
      setAiSuggestion(result);
      
      // Aplicar filtros automaticamente
      if (onApplyFilters) {
        onApplyFilters(result);
      }

    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-r from-purple-50/50 to-blue-50/50 mb-6 overflow-hidden">
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">IA Smart Search</span>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={currentMode === 'walkers' 
                  ? "Ex: Passeador no Porto para cão grande que puxa a trela..." 
                  : "Ex: Treinador barato para cachorro agressivo..."}
                className="pr-10 border-purple-200 focus-visible:ring-purple-400 bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isAnalyzing || !query.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {aiSuggestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-purple-100"
            >
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-900 font-medium mb-2">
                    {aiSuggestion.intent_summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestion.location && (
                      <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                        📍 {aiSuggestion.location}
                      </Badge>
                    )}
                    {aiSuggestion.serviceType && (
                      <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                        🏷️ {aiSuggestion.serviceType}
                      </Badge>
                    )}
                    {aiSuggestion.maxPrice && (
                      <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                        💰 Max €{aiSuggestion.maxPrice}
                      </Badge>
                    )}
                    {aiSuggestion.keywords?.map((kw, i) => (
                      <Badge key={i} className="bg-purple-200 text-purple-800 hover:bg-purple-300 border-0">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}