import React from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADDON_SERVICES = [
  { id: 'walk', name: 'Passeio Extra', price: 20, icon: '🚶' },
  { id: 'training', name: 'Treino', price: 35, icon: '🎓' },
  { id: 'grooming', name: 'Banho & tosquias', price: 45, icon: '✨' },
  { id: 'bathing', name: 'Banho', price: 30, icon: '🚿' },
  { id: 'nail_trim', name: 'Corte de Unhas', price: 15, icon: '✂️' },
];

export default function HotelServiceAddons({ addOns, onAddOnsChange, partners }) {
  const [selectedService, setSelectedService] = React.useState('walk');
  const [quantity, setQuantity] = React.useState(1);
  const [selectedPartner, setSelectedPartner] = React.useState('');

  const handleAddService = () => {
    if (!selectedService) return;

    const service = ADDON_SERVICES.find(s => s.id === selectedService);
    const newAddon = {
      service_name: selectedService,
      quantity: parseInt(quantity) || 1,
      price_per_unit: service.price,
      total_price: (parseInt(quantity) || 1) * service.price,
      assigned_walker_email: selectedPartner || null,
    };

    onAddOnsChange([...addOns, newAddon]);
    
    // Reset form
    setQuantity(1);
    setSelectedPartner('');
  };

  const handleRemoveAddon = (index) => {
    onAddOnsChange(addOns.filter((_, i) => i !== index));
  };

  const totalAddonsPrice = addOns.reduce((sum, addon) => sum + addon.total_price, 0);

  const getServiceName = (id) => ADDON_SERVICES.find(s => s.id === id)?.name || id;
  const getServiceIcon = (id) => ADDON_SERVICES.find(s => s.id === id)?.icon || '•';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Serviços Adicionais</h3>
        
        {/* Add service form */}
        <Card className="p-4 bg-slate-50 border-slate-200">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDON_SERVICES.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.icon} {service.name} (€{service.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qtd"
                className="text-center"
              />
            </div>

            {partners && partners.length > 0 && (
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Parceiro (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem atribuição</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.email || partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              type="button"
              onClick={handleAddService}
              size="sm"
              className="w-full"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>
        </Card>
      </div>

      {/* Added services list */}
      {addOns.length > 0 && (
        <div>
          <div className="space-y-2">
            {addOns.map((addon, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getServiceIcon(addon.service_name)}</span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {getServiceName(addon.service_name)}
                      </p>
                      <p className="text-xs text-slate-600">
                        {addon.quantity}x €{addon.price_per_unit} = €{addon.total_price}
                      </p>
                      {addon.assigned_walker_email && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {addon.assigned_walker_email.split('@')[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveAddon(index)}
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-300">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">Total Add-ons:</span>
              <span className="text-lg font-bold text-blue-600">€{totalAddonsPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}