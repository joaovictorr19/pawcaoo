import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, Phone, MapPin, Home, Heart, Clock, DollarSign, 
  Activity, CheckCircle2, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";

export default function AdoptionApplicationDetails({ application }) {
  if (!application) return null;

  const InfoGroup = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-gray-900">{value || "N/A"}</p>
      </div>
    </div>
  );

  const BooleanBadge = ({ value, label }) => (
    <Badge variant={value ? "default" : "outline"} className={value ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
      {value ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-lg border">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {application.applicant_name}
          </h3>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {application.applicant_phone}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {application.applicant_city}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {application.age} anos</span>
          </div>
        </div>
        <div className="text-right">
          <Badge className="mb-1">{application.application_status}</Badge>
          <p className="text-xs text-gray-500">Enviado em: {format(new Date(application.created_date), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Environment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-600" />
              Ambiente Familiar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <InfoGroup label="Tipo de Casa" value={application.home_type} />
              <InfoGroup label="Posse" value={application.home_ownership} />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <BooleanBadge value={application.has_yard} label="Tem Quintal" />
              <BooleanBadge value={application.yard_fenced} label="Quintal Murado" />
              {application.home_ownership === 'rent' && (
                <BooleanBadge value={application.landlord_approval} label="Aprovação do Senhorio" />
              )}
            </div>

            <Separator />
            
            <div>
              <p className="font-medium mb-1">Membros da Casa</p>
              <p>Adultos/Total: {application.household_members}</p>
              {application.children_ages?.length > 0 && (
                <p className="text-gray-600">Idades das Crianças: {application.children_ages.join(", ")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experience & Lifestyle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Estilo de Vida & Experiência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoGroup label="Ocupação" value={application.occupation} />
            <InfoGroup label="Horas sozinho/dia" value={`${application.hours_alone} horas`} />
            
            <div>
              <p className="font-medium mb-1">Animais Atuais</p>
              {application.current_pets?.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600">
                  {application.current_pets.map((pet, i) => (
                    <li key={i}>{pet.pet_type} ({pet.age} anos) - {pet.spayed_neutered ? 'Castrado' : 'Inteiro'}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Nenhum animal atualmente</p>
              )}
            </div>

            <InfoGroup label="Experiência Anterior" value={application.previous_pet_experience} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Responses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Motivação e Cuidados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-bold text-gray-700">Por que deseja adotar?</p>
            <p className="bg-gray-50 p-3 rounded mt-1">{application.reason_for_adoption}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-gray-700">Plano de Exercícios</p>
              <p className="text-gray-600 mt-1">{application.exercise_plan}</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Compromisso a Longo Prazo</p>
              <p className="text-gray-600 mt-1">{application.long_term_commitment}</p>
            </div>
          </div>

          {application.emergency_plan && (
            <div>
              <p className="font-bold text-gray-700">Plano de Emergência</p>
              <p className="text-gray-600 mt-1">{application.emergency_plan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreements & References */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Concordâncias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {application.prepared_for_costs ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="text-sm">Preparado para custos financeiros</span>
            </div>
            <div className="flex items-center gap-2">
              {application.agree_to_home_visit ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
              <span className="text-sm">Concorda com visita domiciliar</span>
            </div>
            <div className="flex items-center gap-2">
              {application.agree_to_follow_up ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
              <span className="text-sm">Concorda com acompanhamento pós-adoção</span>
            </div>
          </CardContent>
        </Card>

        {application.vet_reference?.vet_name && (
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Referência Veterinária
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Nome:</strong> {application.vet_reference.vet_name}</p>
              <p><strong>Clínica:</strong> {application.vet_reference.vet_clinic}</p>
              <p><strong>Telefone:</strong> {application.vet_reference.vet_phone}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}