import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [createGroupChat, setCreateGroupChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupParticipants, setGroupParticipants] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdParam = urlParams.get('conversation_id');
  const walkerIdParam = urlParams.get('walker_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const allConversations = await base44.entities.ChatConversation.list('-last_message_date');
      return allConversations.filter(conv => 
        conv.participants?.some(p => p.email === user?.email) &&
        !conv.is_archived
      );
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 5000, // Poll for new conversations every 5 seconds
  });

  const { data: selectedMessages, isLoading: loadingMessages } = useQuery({
    queryKey: ['chatMessages', selectedConversationId],
    queryFn: () => base44.entities.ChatMessage.filter(
      { conversation_id: selectedConversationId },
      'created_date'
    ),
    enabled: !!selectedConversationId,
    initialData: [],
    refetchInterval: 2000, // Poll for new messages every 2 seconds
  });

  const { data: walkers } = useQuery({
    queryKey: ['allWalkers'],
    queryFn: () => base44.entities.WalkerProfile.list(),
    initialData: [],
  });

  const { data: trainers } = useQuery({
    queryKey: ['allTrainers'],
    queryFn: () => base44.entities.TrainerProfile.list(),
    initialData: [],
  });

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0) {
      setSelectedConversationId(conversationIdParam);
    }
  }, [conversationIdParam, conversations]);

  // Create conversation with walker/trainer from URL
  useEffect(() => {
    if (walkerIdParam && user && walkers.length > 0 && conversations.length >= 0) {
      const walker = walkers.find(w => w.id === walkerIdParam);
      if (walker) {
        // Check if conversation already exists
        const existing = conversations.find(conv =>
          conv.participants?.some(p => p.email === walker.created_by)
        );
        
        if (existing) {
          setSelectedConversationId(existing.id);
        } else {
          // Create new conversation
          createConversationMutation.mutate({
            participants: [
              {
                email: user.email,
                name: user.full_name,
                photo_url: user.photo_url,
                role: 'owner'
              },
              {
                email: walker.created_by,
                name: walker.walker_name,
                photo_url: walker.photo_url,
                role: 'walker'
              }
            ]
          });
        }
      }
    }
  }, [walkerIdParam, user, walkers, conversations]);

  const createConversationMutation = useMutation({
    mutationFn: async ({ participants, conversationName }) => {
      // Check if one-on-one conversation already exists
      if (participants.length === 2) {
        const existing = conversations.find(conv =>
          conv.conversation_type === 'one_on_one' &&
          conv.participants?.length === 2 &&
          conv.participants.every(p => 
            participants.some(newP => newP.email === p.email)
          )
        );
        
        if (existing) {
          return existing;
        }
      }

      const newConv = await base44.entities.ChatConversation.create({
        conversation_type: participants.length > 2 ? 'group' : 'one_on_one',
        conversation_name: conversationName,
        participants: participants.map(p => ({
          ...p,
          last_read_at: new Date().toISOString()
        })),
        last_message: "Nova conversa iniciada",
        last_message_sender: user?.email,
        last_message_date: new Date().toISOString()
      });

      return newConv;
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationId(newConv.id);
      setShowNewChatDialog(false);
      setNewChatEmail("");
      setGroupName("");
      setGroupParticipants([]);
      toast.success("Conversa criada!");
    },
    onError: () => {
      toast.error("Erro ao criar conversa");
    }
  });

  const handleCreateChat = () => {
    if (createGroupChat) {
      if (!groupName.trim() || groupParticipants.length === 0) {
        toast.error("Preencha o nome e selecione participantes");
        return;
      }
      
      const participants = [
        {
          email: user?.email,
          name: user?.full_name,
          photo_url: user?.photo_url,
          role: 'owner'
        },
        ...groupParticipants
      ];
      
      createConversationMutation.mutate({
        participants,
        conversationName: groupName
      });
    } else {
      if (!newChatEmail.trim()) {
        toast.error("Digite um email");
        return;
      }
      
      // Find professional
      const walker = walkers.find(w => w.created_by === newChatEmail || w.walker_name.toLowerCase().includes(newChatEmail.toLowerCase()));
      const trainer = trainers.find(t => t.created_by === newChatEmail || t.trainer_name.toLowerCase().includes(newChatEmail.toLowerCase()));
      
      const professional = walker || trainer;
      
      if (!professional) {
        toast.error("Profissional não encontrado");
        return;
      }
      
      const participants = [
        {
          email: user?.email,
          name: user?.full_name,
          photo_url: user?.photo_url,
          role: 'owner'
        },
        {
          email: professional.created_by,
          name: walker ? walker.walker_name : trainer.trainer_name,
          photo_url: walker ? walker.photo_url : trainer.photo_url,
          role: walker ? 'walker' : 'trainer'
        }
      ];
      
      createConversationMutation.mutate({ participants });
    }
  };

  const toggleParticipant = (professional) => {
    const exists = groupParticipants.some(p => p.email === professional.created_by);
    
    if (exists) {
      setGroupParticipants(groupParticipants.filter(p => p.email !== professional.created_by));
    } else {
      const isWalker = walkers.some(w => w.id === professional.id);
      setGroupParticipants([
        ...groupParticipants,
        {
          email: professional.created_by,
          name: isWalker ? professional.walker_name : professional.trainer_name,
          photo_url: professional.photo_url,
          role: isWalker ? 'walker' : 'trainer'
        }
      ]);
    }
  };

  if (loadingConversations) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r">
          <Skeleton className="h-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="h-[calc(100vh-73px)] flex bg-gray-50">
      {/* Conversations List - Left Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Mensagens</h2>
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conversa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="group-chat"
                    checked={createGroupChat}
                    onCheckedChange={setCreateGroupChat}
                  />
                  <label htmlFor="group-chat" className="text-sm font-medium">
                    Criar grupo
                  </label>
                </div>

                {createGroupChat ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nome do Grupo</Label>
                      <Input
                        placeholder="Ex: Passeadores da Família"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Adicionar Participantes</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                        {[...walkers, ...trainers].map(professional => {
                          const isWalker = walkers.some(w => w.id === professional.id);
                          const name = isWalker ? professional.walker_name : professional.trainer_name;
                          const isSelected = groupParticipants.some(p => p.email === professional.created_by);
                          
                          return (
                            <div
                              key={professional.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                isSelected ? 'bg-green-50 border-2 border-green-500' : ''
                              }`}
                              onClick={() => toggleParticipant(professional)}
                            >
                              <Checkbox checked={isSelected} />
                              <div className="flex-1">
                                <div className="font-medium">{name}</div>
                                <div className="text-xs text-gray-500">
                                  {isWalker ? '🐕 Walker' : '🎓 Trainer'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>Email ou Nome do Profissional</Label>
                    <Input
                      placeholder="Digite email ou nome..."
                      value={newChatEmail}
                      onChange={(e) => setNewChatEmail(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={handleCreateChat}
                  disabled={createConversationMutation.isPending}
                  className="w-full"
                >
                  {createConversationMutation.isPending ? "Criando..." : "Criar Conversa"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          currentUserEmail={user?.email}
        />
      </div>

      {/* Chat Window - Right Side */}
      <div className="flex-1 flex flex-col">
        <ChatWindow
          conversation={selectedConversation}
          messages={selectedMessages}
          currentUser={user}
          onMessagesUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedConversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }}
        />
      </div>
    </div>
  );
}