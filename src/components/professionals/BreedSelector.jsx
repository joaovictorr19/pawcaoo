import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const POPULAR_BREEDS = [
  // Raças Portuguesas Populares
  "Serra da Estrela", "Podengo Português", "Rafeiro do Alentejo", "Cão de Água Português",
  "Perdigueiro Português", "Castro Laboreiro", "Barbado da Terceira", "Cão de Fila de São Miguel",
  // Internacional Popular
  "Labrador Retriever", "Golden Retriever", "Pastor Alemão", "Bulldog Francês",
  "Bulldog Inglês", "Poodle", "Caniche", "Beagle", "Rottweiler", "Yorkshire Terrier", 
  "Boxer", "Dachshund", "Teckel", "Husky Siberiano", "Grande Dinamarquês", "Doberman",
  "Shih Tzu", "Boston Terrier", "Pomerânia", "Spitz Alemão", "Chihuahua",
  "Maltês", "Bichon Frisé", "Cocker Spaniel", "Springer Spaniel", "Border Collie",
  "Pastor Australiano", "Setter Inglês", "Setter Irlandês", "Pointer", "Braco",
  "São Bernardo", "Terra Nova", "Mastim", "Dogue Alemão", "Akita",
  "Shiba Inu", "Basenji", "Schnauzer", "Fox Terrier", "Bull Terrier",
  "Pit Bull", "American Staffordshire", "Staffordshire Bull Terrier", "Jack Russell Terrier",
  "West Highland White Terrier", "Cairn Terrier", "Airedale Terrier", "Weimaraner",
  "Dálmata", "Galgo", "Greyhound", "Whippet", "Saluki", "Afghan Hound",
  "Basset Hound", "Bloodhound", "Rhodesian Ridgeback", "Vizsla", "Brittany Spaniel",
  "Chesapeake Bay Retriever", "Flat-Coated Retriever", "Nova Scotia Duck Tolling Retriever",
  "Bernese Mountain Dog", "Bouvier des Flandres", "Maremma Sheepdog", "Anatolian Shepherd",
  "Caucasian Shepherd", "Cane Corso", "Fila Brasileiro", "Dogo Argentino",
  "Boerboel", "Leonberger", "Newfoundland", "Pyrenean Mountain Dog", "Great Pyrenees",
  "Kuvasz", "Komondor", "Puli", "Samoyed", "Alaskan Malamute", "American Eskimo Dog",
  "Finnish Spitz", "Norwegian Elkhound", "Swedish Vallhund", "Welsh Corgi Pembroke",
  "Welsh Corgi Cardigan", "Australian Cattle Dog", "Blue Heeler", "Kelpie",
  "Belgian Malinois", "Belgian Tervuren", "Belgian Sheepdog", "Dutch Shepherd",
  "Old English Sheepdog", "Briard", "Bearded Collie", "Rough Collie", "Smooth Collie",
  "Shetland Sheepdog", "Papillon", "Cavalier King Charles Spaniel", "English Toy Spaniel",
  "Japanese Chin", "Pekingese", "Lhasa Apso", "Tibetan Terrier", "Tibetan Mastiff",
  "Chinese Crested", "Chinese Shar-Pei", "Chow Chow", "Keeshond", "Schipperke",
  "Brussels Griffon", "Affenpinscher", "Miniature Pinscher", "Italian Greyhound",
  "Toy Fox Terrier", "Rat Terrier", "Manchester Terrier", "Smooth Fox Terrier",
  "Wire Fox Terrier", "Lakeland Terrier", "Welsh Terrier", "Irish Terrier",
  "Soft Coated Wheaten Terrier", "Kerry Blue Terrier", "Scottish Terrier", "Skye Terrier",
  "Dandie Dinmont Terrier", "Bedlington Terrier", "Sealyham Terrier", "Norfolk Terrier",
  "Norwich Terrier", "Parson Russell Terrier", "Glen of Imaal Terrier", "Irish Wolfhound",
  "Scottish Deerhound", "Borzoi", "Ibizan Hound", "Pharaoh Hound", "Cirneco dell'Etna",
  "Azawakh", "Sloughi", "Chart Polski", "Magyar Agar", "Spanish Galgo",
  "American Foxhound", "English Foxhound", "Harrier", "Beagle-Harrier", "Grand Basset Griffon Vendéen",
  "Petit Basset Griffon Vendéen", "Wirehaired Pointing Griffon", "German Wirehaired Pointer",
  "German Shorthaired Pointer", "English Setter", "Gordon Setter", "Irish Red and White Setter",
  "Spinone Italiano", "Bracco Italiano", "Braque Français", "Braque d'Auvergne",
  "Pudelpointer", "Wirehaired Vizsla", "Lagotto Romagnolo", "Spanish Water Dog",
  "Irish Water Spaniel", "American Water Spaniel", "Boykin Spaniel", "Field Spaniel",
  "Sussex Spaniel", "Clumber Spaniel", "English Cocker Spaniel", "Welsh Springer Spaniel",
  "SRD", "Vira-Lata", "Mestiço", "Rafeiro", "Mixed Breed"
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
    if (selectedBreeds.length === 0) {
      setAiSuggestions([]);
      return;
    }
    
    setLoadingSuggestions(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Baseado nestas raças de cães: ${selectedBreeds.join(", ")}, sugere 8 outras raças semelhantes que um passeador/treinador profissional possa ter interesse em trabalhar. Inclui raças portuguesas se relevante (Serra da Estrela, Podengo Português, etc). RESPONDE APENAS com um objeto JSON válido contendo um array "breeds" com nomes de raças em português, sem texto adicional.`,
        response_json_schema: {
          type: "object",
          properties: {
            breeds: {
              type: "array",
              items: { type: "string" },
              description: "Array de nomes de raças em português"
            }
          },
          required: ["breeds"]
        }
      });
      
      console.log('AI Response:', response);
      const suggestions = (response?.breeds || [])
        .filter(b => b && typeof b === 'string' && b.trim().length > 0)
        .filter(b => !selectedBreeds.includes(b))
        .slice(0, 8);
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      setAiSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Pesquisar raças ou escrever manualmente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                const trimmed = searchQuery.trim();
                if (!selectedBreeds.includes(trimmed)) {
                  handleAddBreed(trimmed);
                }
              }
            }}
            className="text-base"
          />
          {searchQuery && filteredBreeds.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {filteredBreeds.slice(0, 15).map(breed => (
                <button
                  key={breed}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddBreed(breed);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0 text-sm font-medium"
                >
                  {breed}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            getAiSuggestions();
          }}
          disabled={loadingSuggestions || selectedBreeds.length === 0}
          className="bg-purple-600 hover:bg-purple-700 h-11 md:h-10 px-4"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {loadingSuggestions ? "A carregar..." : "IA Sugerir"}
        </Button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        💡 <strong>Dica:</strong> Digite qualquer raça e pressione Enter para adicionar manualmente. Use a busca ou clique nas sugestões.
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
          <h4 className="text-sm font-semibold text-gray-900">Raças Selecionadas ({selectedBreeds.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedBreeds.map(breed => (
              <div key={breed} className="relative group">
                <Badge
                  className={`${
                    specializationBreeds?.includes(breed)
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  } pr-8 cursor-pointer transition-all hover:opacity-90 text-xs md:text-sm py-2 px-3`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onSpecializationChange) {
                      handleToggleSpecialization(breed);
                    }
                  }}
                >
                  {breed}
                  {specializationBreeds?.includes(breed) && (
                    <span className="ml-1 text-xs">★</span>
                  )}
                </Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveBreed(breed);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {onSpecializationChange && (
            <p className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2">
              💡 Clique numa raça para marcar como <strong>especialização</strong> (aparece com estrela ★)
            </p>
          )}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Raças Populares (clique para adicionar)</h4>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
          {POPULAR_BREEDS.filter(b => !selectedBreeds.includes(b)).slice(0, 30).map(breed => (
            <button
              key={breed}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddBreed(breed);
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all text-xs md:text-sm font-medium active:scale-95"
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