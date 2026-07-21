import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MapPin, Globe, Check } from "lucide-react";
import { useLocalization, COUNTRY_CONFIG } from "@/components/LocalizationContext";

const countryFlags = {
  PT: '🇵🇹',
  ES: '🇪🇸',
  FR: '🇫🇷',
  GB: '🇬🇧',
  DE: '🇩🇪',
  IT: '🇮🇹',
  US: '🇺🇸'
};

export default function CountrySelector({ showLabel = true, size = 'default' }) {
  const { country, setCountry, availableCountries, userLocation, isLoading } = useLocalization();

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 animate-pulse" disabled>
        <Globe className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size === 'small' ? 'sm' : 'default'}
          className="gap-2 h-9"
        >
          <span className="text-lg">{countryFlags[country.code]}</span>
          {showLabel && (
            <>
              <span className="hidden sm:inline text-sm">{country.name}</span>
              <span className="text-xs text-gray-500">({country.currencySymbol})</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          Selecionar País / Select Country
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userLocation && (
          <>
            <DropdownMenuItem 
              onClick={() => {
                // Re-detect location
                localStorage.removeItem('pawcao_country');
                window.location.reload();
              }}
              className="text-blue-600"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Detetar automaticamente
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {availableCountries.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCountry(c.code)}
            className="cursor-pointer"
          >
            <span className="text-lg mr-2">{countryFlags[c.code]}</span>
            <span className="flex-1">{c.name}</span>
            <span className="text-xs text-gray-500 mr-2">{c.currencySymbol}</span>
            {country.code === c.code && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}