import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export default function GroupWalkBookingCard({ event, dogProfiles = [], user }) {
  const queryClient = useQueryClient();
  const [selectedDogId, setSelectedDogId] = useState("");

  const availableDogs = dogProfiles.filter((dog) => event.accepted_sizes?.includes(dog.dog_size || dog.size));
  const isFull = (event.dogs_booked || 0) >= (event.max_dogs || 0) || event.status === "full";
  const alreadyJoined = (event.participants || []).some((participant) => participant.owner_email === user?.email && participant.dog_id === selectedDogId);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const dog = dogProfiles.find((item) => item.id === selectedDogId);
      if (!dog) throw new Error("Selecione um cão");

      if ((event.dogs_booked || 0) >= (event.max_dogs || 0) || event.status === "full") {
        throw new Error("Este passeio já atingiu a lotação máxima");
      }

      const alreadyExists = (event.participants || []).some((participant) => participant.owner_email === user.email && participant.dog_id === dog.id);
      if (alreadyExists) {
        throw new Error("Este cão já está inscrito neste passeio");
      }

      const updatedParticipants = [
        ...(event.participants || []),
        {
          owner_email: user.email,
          owner_name: user.full_name,
          dog_id: dog.id,
          dog_name: dog.dog_name,
          dog_size: dog.dog_size || dog.size,
        },
      ];

      const dogsBooked = updatedParticipants.length;
      return base44.entities.GroupWalkEvent.update(event.id, {
        participants: updatedParticipants,
        dogs_booked: dogsBooked,
        status: dogsBooked >= event.max_dogs ? "full" : "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicGroupWalkEvents"] });
      toast.success("Passeio em grupo agendado!");
    },
    onError: (error) => toast.error(error.message || "Erro ao agendar passeio."),
  });

  return (
    <Card className="bg-white border-slate-200 rounded-[2rem] overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-slate-900 font-black">{event.title}</h3>
            <p className="text-sm text-slate-500">com {event.professional_name}</p>
          </div>
          <Badge className="bg-orange-100 text-orange-700">€{event.price_per_dog}/cão</Badge>
        </div>

        {event.description && <p className="text-sm text-slate-600">{event.description}</p>}

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" />{event.location}</div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />{event.event_date} às {event.event_time}</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />{event.dogs_booked}/{event.max_dogs} vagas ocupadas</div>
        </div>

        <Select value={selectedDogId} onValueChange={setSelectedDogId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha o cão" />
          </SelectTrigger>
          <SelectContent>
            {availableDogs.map((dog) => (
              <SelectItem key={dog.id} value={dog.id}>{dog.dog_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => joinMutation.mutate()}
          disabled={!selectedDogId || joinMutation.isPending || event.status !== "open" || isFull || alreadyJoined}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          {isFull ? 'Lotação esgotada' : 'Agendar neste passeio'}
        </Button>
      </CardContent>
    </Card>
  );
}