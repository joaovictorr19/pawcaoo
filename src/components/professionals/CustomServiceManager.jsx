import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Euro } from "lucide-react";
import { toast } from "sonner";

export default function CustomServiceManager({ services = [], onUpdate }) {
  const [localServices, setLocalServices] = useState(services);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newService, setNewService] = useState({
    service_name: "",
    description: "",
    price: "",
    duration_options: ["30 min", "1 hora"],
    custom_pricing: true
  });

  const handleAddService = () => {
    if (!newService.service_name || !newService.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }

    const updatedServices = [...localServices, {
      ...newService,
      price: parseFloat(newService.price)
    }];
    
    setLocalServices(updatedServices);
    onUpdate(updatedServices);
    
    setNewService({
      service_name: "",
      description: "",
      price: "",
      duration_options: ["30 min", "1 hora"],
      custom_pricing: true
    });
    setIsAddingNew(false);
    toast.success("Serviço adicionado com sucesso");
  };

  const handleRemoveService = (index) => {
    const updatedServices = localServices.filter((_, i) => i !== index);
    setLocalServices(updatedServices);
    onUpdate(updatedServices);
    toast.success("Serviço removido");
  };

  const handleUpdateService = (index, field, value) => {
    const updatedServices = [...localServices];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : value
    };
    setLocalServices(updatedServices);
  };

  const handleSaveChanges = () => {
    onUpdate(localServices);
    toast.success("Alterações guardadas");
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Serviços Personalizados</span>
          <Button onClick={() => setIsAddingNew(true)} size="sm" disabled={isAddingNew}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingNew && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label>Nome do Serviço *</Label>
                <Input
                  placeholder="Ex: Banho completo, Tosa, Passeio estendido..."
                  value={newService.service_name}
                  onChange={(e) => setNewService({...newService, service_name: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o serviço em detalhe..."
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div>
                <Label>Preço (€) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddService} size="sm" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button 
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewService({
                      service_name: "",
                      description: "",
                      price: "",
                      duration_options: ["30 min", "1 hora"],
                      custom_pricing: true
                    });
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {localServices.length === 0 && !isAddingNew ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum serviço personalizado ainda.</p>
            <p className="text-sm">Clique em "Adicionar Serviço" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localServices.map((service, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Input
                        value={service.service_name}
                        onChange={(e) => handleUpdateService(index, 'service_name', e.target.value)}
                        className="font-semibold mb-2"
                      />
                      <Textarea
                        value={service.description || ""}
                        onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                        placeholder="Descrição do serviço..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => handleRemoveService(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Preço:</Label>
                    <div className="relative flex-1 max-w-[150px]">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={service.price || ""}
                        onChange={(e) => handleUpdateService(index, 'price', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {localServices.length > 0 && (
          <Button onClick={handleSaveChanges} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar Todas as Alterações
          </Button>
        )}
      </CardContent>
    </Card>
  );
}