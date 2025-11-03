import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const POPULAR_BREEDS = [
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Boxer",
  "Dachshund", "Siberian Husky", "Great Dane", "Doberman Pinscher", "Shih Tzu",
  "Boston Terrier", "Pomeranian", "Havanese", "Shetland Sheepdog", "Brittany"
];

export default function BreedSelector({ selectedBreeds = [], onChange, specializationBreeds = [], onSpecializationChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const filteredBreeds = POPULAR_BREEDS.filter(breed =>
    breed.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedBreeds.includes(breed)
  );

  const handleAddBreed = (breed) => {
    if (!selectedBreeds.includes(breed)) {
      onChange([...selectedBreeds, breed]);
      setSearchQuery("");
    }
  };

  const handleRemoveBreed = (breed) => {
    onChange(selectedBreeds.filter(b => b !== breed));
    if (specializationBreeds.includes(breed)) {
      onSpecializationChange(specializationBreeds.filter(b => b !== breed));
    }
  };

  const handleToggleSpecialization = (breed) => {
    if (specializationBreeds.includes(breed)) {
      onSpecializationChange(specializationBreeds.filter(b => b !== breed));
    } else {
      onSpecializationChange([...specializationBreeds, breed]);
    }
  };

  const getAiSuggestions = async () => {
    if (selectedBreeds.length === 0) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these dog breeds: ${selectedBreeds.join(", ")}, suggest 5 other similar dog breeds that a professional dog walker/trainer might also be interested in working with. Return only a JSON array of breed names, nothing else.`,
        response_json_schema: {
          type: "object",
          properties: {
            breeds: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      const suggestions = response.breeds.filter(b => !selectedBreeds.includes(b));
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    }
    setLoadingSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Search for dog breeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                handleAddBreed(searchQuery.trim());
              }
            }}
          />
          {searchQuery && filteredBreeds.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredBreeds.slice(0, 10).map(breed => (
                <button
                  key={breed}
                  onClick={() => handleAddBreed(breed)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  {breed}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={getAiSuggestions}
          disabled={loadingSuggestions || selectedBreeds.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {loadingSuggestions ? "Loading..." : "AI Suggest"}
        </Button>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Suggested Breeds
          </h4>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map(breed => (
              <button
                key={breed}
                onClick={() => handleAddBreed(breed)}
                className="px-3 py-1 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                {breed}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBreeds.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Selected Breeds ({selectedBreeds.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedBreeds.map(breed => (
              <div key={breed} className="relative group">
                <Badge
                  className={`${
                    specializationBreeds.includes(breed)
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  } pr-8 cursor-pointer transition-all`}
                  onClick={() => handleToggleSpecialization(breed)}
                >
                  {breed}
                  {specializationBreeds.includes(breed) && (
                    <span className="ml-1 text-xs">★</span>
                  )}
                </Badge>
                <button
                  onClick={() => handleRemoveBreed(breed)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {onSpecializationChange && (
            <p className="text-xs text-gray-600">
              💡 Click on a breed to mark it as a specialization (starred)
            </p>
          )}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Popular Breeds</h4>
        <div className="flex flex-wrap gap-2">
          {POPULAR_BREEDS.filter(b => !selectedBreeds.includes(b)).slice(0, 12).map(breed => (
            <button
              key={breed}
              onClick={() => handleAddBreed(breed)}
              className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              {breed}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}