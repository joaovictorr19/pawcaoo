import React, { useState } from 'react';
import { Camera, MapPin, Dog, Shield, CheckCircle, Zap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function BecomeProRegistry() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    profilePhoto: null,
    coverPhoto: null,
    services: [],
    address: '',
    bio: '',
    documents: null,
  });

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Aqui você integraria com a API para criar o perfil profissional
      // Por enquanto apenas avançamos ao passo final
      nextStep();
    } catch (error) {
      console.error('Erro ao submeter registo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/ProfessionalHubV2');
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-16 pt-8 md:pt-12 px-4 md:px-6">
      {/* Progress Indicator */}
      <div className="flex gap-2 mb-10 md:mb-12 max-w-sm mx-auto">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= i ? 'bg-orange-500' : 'bg-slate-100'
            }`} 
          />
        ))}
      </div>

      {/* STEP 1: Visual Identity */}
      {step === 1 && (
        <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
            {/* PT: A tua vitrine, EN: Your Showcase */}
            A tua vitrine.
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10 text-left">
            Foto de perfil e capa (opcional)
          </p>
          
          <div className="relative mb-12 md:mb-16">
            {/* Cover Photo */}
            <label htmlFor="cover-upload" className="block cursor-pointer">
              <div className="w-full h-40 md:h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden hover:bg-slate-100 transition-all">
                <input 
                  id="cover-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'coverPhoto')}
                  className="hidden"
                />
                <Camera className="text-slate-300" size={32} />
                <span className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl shadow-lg text-[10px] font-black uppercase hover:shadow-md transition-shadow">
                  Adicionar Capa
                </span>
              </div>
            </label>

            {/* Profile Photo */}
            <label htmlFor="profile-upload" className="block cursor-pointer">
              <div className="absolute -bottom-8 md:-bottom-10 left-6 md:left-8 w-20 h-20 md:w-28 md:h-28 bg-white rounded-2xl md:rounded-3xl shadow-xl border-4 border-white flex items-center justify-center overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="bg-orange-50 w-full h-full flex items-center justify-center group">
                  <input 
                    id="profile-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                    className="hidden"
                  />
                  <Camera className="text-orange-300 group-hover:text-orange-400" size={28} />
                </div>
              </div>
            </label>
          </div>

          <div className="mt-16 md:mt-20 space-y-4">
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Fala um pouco sobre ti e a tua experiência..."
              className="w-full h-32 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <Button 
            onClick={nextStep} 
            className="w-full h-12 md:h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs md:text-sm mt-8 hover:bg-slate-800 active:scale-95 transition-all"
          >
            Continuar
          </Button>
        </div>
      )}

      {/* STEP 2: Services */}
      {step === 2 && (
        <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 leading-tight">
            O que ofereces?
          </h2>
          
          <div className="space-y-3 md:space-y-4">
            {[
              { id: 'walker', label: 'Dog Walker', icon: <Dog size={24} /> },
              { id: 'sitting', label: 'Dog Sitting', icon: <Shield size={24} /> },
              { id: 'exotic', label: 'Animais Exóticos', icon: <Zap size={24} /> }
            ].map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceToggle(service.id)}
                className={`w-full p-5 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between border-2 transition-all active:scale-95 ${
                  formData.services.includes(service.id)
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-slate-50 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${formData.services.includes(service.id) ? 'text-orange-500' : 'text-slate-400'}`}>
                    {service.icon}
                  </div>
                  <span className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-wider">
                    {service.label}
                  </span>
                </div>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 flex items-center justify-center transition-all ${
                  formData.services.includes(service.id)
                    ? 'bg-orange-500 border-orange-500'
                    : 'border-slate-300'
                }`}>
                  {formData.services.includes(service.id) && (
                    <CheckCircle size={20} className="text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8 md:gap-4">
            <Button 
              onClick={() => setStep(step - 1)} 
              variant="outline"
              className="flex-1 h-12 md:h-14 rounded-2xl font-black uppercase text-xs md:text-sm"
            >
              Voltar
            </Button>
            <Button 
              onClick={nextStep} 
              className="flex-1 h-12 md:h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs md:text-sm hover:bg-slate-800"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Location & Documents */}
      {step === 3 && (
        <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 leading-tight">
            Onde estás?
          </h2>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-slate-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">
                Endereço Completo
              </label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua, Número, Cidade..." 
                className="w-full bg-transparent font-bold text-slate-800 placeholder-slate-400 outline-none text-sm md:text-base"
              />
            </div>
            
            <label htmlFor="doc-upload" className="block cursor-pointer">
              <div className="p-6 md:p-8 border-2 border-dashed border-slate-200 rounded-2xl md:rounded-3xl text-center hover:border-slate-300 hover:bg-slate-50 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Documento de Identificação (Opcional)
                </p>
                <p className="text-slate-500 text-xs">Clica para enviar ficheiro</p>
                <input 
                  id="doc-upload"
                  type="file" 
                  onChange={(e) => handleFileUpload(e, 'documents')}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          <div className="flex gap-3 mt-8 md:gap-4">
            <Button 
              onClick={() => setStep(step - 1)} 
              variant="outline"
              className="flex-1 h-12 md:h-14 rounded-2xl font-black uppercase text-xs md:text-sm"
            >
              Voltar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 h-12 md:h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs md:text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Finalizar Registo'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="text-center animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Candidatura Enviada!
          </h2>
          
          <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-8">
            O teu perfil está em modo "Rascunho". Podes começar a explorar, mas o Admin irá validar os teus dados para apareceres no mapa oficial.
          </p>

          <Button 
            onClick={handleGoToDashboard}
            className="w-full h-12 md:h-14 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs md:text-sm hover:bg-orange-600 active:scale-95 transition-all"
          >
            Ir para o meu Painel Pro
          </Button>
        </div>
      )}
    </div>
  );
}