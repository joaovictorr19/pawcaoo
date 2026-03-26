import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';
import { toast } from 'sonner';

export function ProfileActions({ walker, currentUser }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);

  const handleInstantCall = () => {
    if (!currentUser?.email) {
      toast.error('Faça login para chamar agora');
      return;
    }
    
    // Lógica: Redirecionar para PawGo com profissional pré-selecionado
    navigate(`/dashboard?preset=${walker.id}`);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Se necessário, scroll para formulário de booking
    const bookingForm = document.querySelector('[data-booking-form]');
    if (bookingForm) {
      bookingForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* SEÇÃO 1: CHAMADA IMEDIATA (Só aparece se online) */}
      {walker?.is_online && (
        <Card className="border-green-100 bg-green-50 rounded-[2.5rem] shadow-lg shadow-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 p-3 rounded-xl text-white">
                <Zap size={20} className="fill-white" />
              </div>
              <div>
                <h4 className="font-black uppercase text-xs text-green-700 tracking-widest">
                  Disponível Agora
                </h4>
                <p className="text-[9px] text-green-600 font-bold">
                  Resposta em minutos
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleInstantCall}
              className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-green-500/30 active:scale-95 transition-all"
            >
              <Zap size={16} className="mr-2 fill-white" />
              Chamar {walker?.walker_name || 'Profissional'} Agora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO 2: AGENDAMENTO (Sempre visível) */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-xl bg-white overflow-hidden">
        <CardContent className="p-6">
          <h4 className="font-black uppercase text-xs text-slate-900 mb-4 flex items-center gap-2 tracking-widest">
            <Calendar size={18} className="text-slate-400" />
            Agenda & Disponibilidade
          </h4>
          
          {walker?.id && (
            <AvailabilityCalendar 
              professional={walker}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          )}

          {/* Info text */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider">
              💡 Escolhe uma data para agendar passeios recorrentes ou futuras reservas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: Info de Status */}
      {!walker?.is_online && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
            ⏰ Este profissional está offline. Usa a agenda para agendar para quando estiver disponível.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProfileActions;