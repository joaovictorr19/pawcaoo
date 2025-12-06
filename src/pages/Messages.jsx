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
  const trainerIdParam = urlParams.get('trainer_id'); // NOVO

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user?.email) return [];

      // Busca ampliada para garantir compatibilidade com conversas antigas (sem participant_emails)
      // Aumentando o limite para 200 para garantir que encontramos as conversas do usuário
      const allConversations = await base44.entities.ChatConversation.list('-last_message_date', 200);

      console.log('📬 ALL CONVERSATIONS:', allConversations.length);

      const mine = allConversations.filter(conv => 
        (conv.participant_emails?.includes(user.email)) || 
        (conv.participants?.some(p => p.email === user.email))
      );

      console.log('📬 MY CONVERSATIONS:', mine.length);

      return mine.filter(c => !c.is_archived);
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

  const { data: companies } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.PartnerCompany.list(),
    initialData: [],
  });

  // Fetch specific professional if ID is provided (handling pagination limits)
  const { data: specificWalker } = useQuery({
    queryKey: ['walker', walkerIdParam],
    queryFn: async () => {
      if (!walkerIdParam) return null;
      const res = await base44.entities.WalkerProfile.filter({ id: walkerIdParam });
      return res[0];
    },
    enabled: !!walkerIdParam,
  });

  const { data: specificTrainer } = useQuery({
    queryKey: ['trainer', trainerIdParam],
    queryFn: async () => {
      if (!trainerIdParam) return null;
      const res = await base44.entities.TrainerProfile.filter({ id: trainerIdParam });
      return res[0];
    },
    enabled: !!trainerIdParam,
  });

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0) {
      setSelectedConversationId(conversationIdParam);
    }
  }, [conversationIdParam, conversations]);

  // CORRIGIDO: Create conversation with walker/trainer from URL
  useEffect(() => {
    if (!user || conversations.length === undefined) return;

    const professionalId = walkerIdParam || trainerIdParam;
    if (!professionalId) return;

    const isWalker = !!walkerIdParam;
    // Use specific fetched professional or fallback to list
    const professional = isWalker 
      ? (specificWalker || walkers.find(p => p.id === professionalId))
      : (specificTrainer || trainers.find(p => p.id === professionalId));
    
    if (!professional) {
      // Waiting for specific query to load
      return;
    }

    console.log('🔍 Found professional:', professional);

    // Check if conversation already exists
    // Must match exactly 2 participants for 1-on-1 to avoid picking up group chats
    const existing = conversations.find(conv =>
      conv.conversation_type === 'one_on_one' &&
      conv.participants?.some(p => p.email === professional.created_by)
    );
    
    if (existing) {
      console.log('✅ Conversation exists:', existing.id);
      setSelectedConversationId(existing.id);
    } else {
      console.log('🆕 Creating new conversation...');
      
      const participants = [
        {
          email: user.email,
          name: user.full_name,
          photo_url: user.profile_photo_url,
          role: 'owner'
        },
        {
          email: professional.created_by,
          name: isWalker ? professional.walker_name : professional.trainer_name,
          photo_url: professional.photo_url,
          role: isWalker ? 'walker' : 'trainer'
        }
      ];

      // Also pass participant_emails for RLS
      createConversationMutation.mutate({ participants });
    }
  }, [walkerIdParam, trainerIdParam, user?.email, specificWalker, specificTrainer, walkers, trainers, conversations]);

  const createConversationMutation = useMutation({
    mutationFn: async ({ participants, conversationName }) => {
      console.log('🚀 Creating conversation with participants:', participants);

      // Check if one-on-one conversation already exists (via query for robustness)
      if (participants.length === 2) {
        const pEmails = participants.map(p => p.email);
        // Busca segura: busca por um participante e filtra no cliente
        const potentialMatches = await base44.entities.ChatConversation.filter({
           participant_emails: pEmails[0], // Busca pelo primeiro email (ex: user logado)
           conversation_type: 'one_on_one'
        });
        
        const existing = potentialMatches.find(c => 
          c.participant_emails && c.participant_emails.includes(pEmails[1])
        );
        
        if (existing) {
          console.log('✅ Found existing conversation:', existing.id);
          return existing;
        }
      }

      const newConv = await base44.entities.ChatConversation.create({
        conversation_type: participants.length > 2 ? 'group' : 'one_on_one',
        conversation_name: conversationName,
        participant_emails: participants.map(p => p.email), // CRUCIAL: Add this field for RLS
        participants: participants.map(p => ({
          ...p,
          last_read_at: new Date().toISOString()
        })),
        last_message: "Nova conversa iniciada",
        last_message_sender: user?.email,
        last_message_date: new Date().toISOString()
      });

      console.log('✅ Conversation created:', newConv.id);

      return newConv;
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationId(newConv.id);
      setShowNewChatDialog(false);
      setNewChatEmail("");
      setGroupName("");
      setGroupParticipants([]);
      toast.success("✅ Conversa criada!");
    },
    onError: (error) => {
      console.error('❌ Error creating conversation:', error);
      toast.error("❌ Erro ao criar conversa: " + error.message);
    }
  });

  const handleCreateChat = async () => {
    if (!user || !user.email) {
      toast.error("❌ Erro: Usuário não identificado. Tente recarregar.");
      return;
    }

    if (createGroupChat) {
      if (!groupName.trim() || groupParticipants.length === 0) {
        toast.error("❌ Preencha o nome e selecione participantes");
        return;
      }
      
      const participants = [
        {
          email: user.email,
          name: user.full_name,
          photo_url: user.profile_photo_url,
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
        toast.error("❌ Digite um email ou nome");
        return;
      }
      
      const searchTerm = newChatEmail.toLowerCase().trim();
      
      const walker = walkers.find(w => 
        w.created_by?.toLowerCase() === searchTerm ||
        w.walker_name?.toLowerCase().includes(searchTerm)
      );
      
      const trainer = trainers.find(t => 
        t.created_by?.toLowerCase() === searchTerm ||
        t.trainer_name?.toLowerCase().includes(searchTerm)
      );

      const company = companies.find(c =>
        c.company_email?.toLowerCase() === searchTerm ||
        c.company_name?.toLowerCase().includes(searchTerm)
      );
      
      let professional = walker || trainer || company;
      let isGenericUser = false;
      let genericUser = null;

      if (!professional) {
        // Fallback: Try to find a generic user
        try {
          const users = await base44.entities.User.filter({ email: searchTerm });
          if (users.length > 0) {
            genericUser = users[0];
            isGenericUser = true;
          }
        } catch (e) {
          console.error("Search user failed", e);
        }
      }
      
      if (!professional && !isGenericUser) {
        toast.error("❌ Conta não encontrada (Profissional, Empresa ou Usuário)");
        return;
      }
      
      console.log('✅ Found account:', professional || genericUser);
      
      let targetEmail = "";
      let targetName = "";
      let targetPhoto = "";
      let targetRole = "owner";

      if (isGenericUser) {
        targetEmail = genericUser.email;
        targetName = genericUser.full_name;
        targetPhoto = genericUser.profile_photo_url;
        targetRole = "owner";
      } else {
        targetEmail = professional.created_by || professional.company_email;
        targetName = walker ? professional.walker_name : (trainer ? professional.trainer_name : professional.company_name);
        targetPhoto = professional.photo_url || professional.logo_url;
        targetRole = walker ? 'walker' : (trainer ? 'trainer' : 'company');
      }

      const participants = [
        {
          email: user.email,
          name: user.full_name,
          photo_url: user.profile_photo_url,
          role: 'owner'
        },
        {
          email: targetEmail,
          name: targetName,
          photo_url: targetPhoto,
          role: targetRole
        }
      ];
      
      createConversationMutation.mutate({ participants });
    }
  };

  const toggleParticipant = (professional) => {
    const email = professional.created_by || professional.company_email;
    const exists = groupParticipants.some(p => p.email === email);
    
    if (exists) {
      setGroupParticipants(groupParticipants.filter(p => p.email !== email));
    } else {
      const isWalker = walkers.some(w => w.id === professional.id);
      const isTrainer = trainers.some(t => t.id === professional.id);
      
      setGroupParticipants([
        ...groupParticipants,
        {
          email: email,
          name: isWalker ? professional.walker_name : (isTrainer ? professional.trainer_name : professional.company_name),
          photo_url: professional.photo_url || professional.logo_url,
          role: isWalker ? 'walker' : (isTrainer ? 'trainer' : 'company')
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
            <DialogContent className="max-w-md">
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
                        className="bg-white text-gray-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Adicionar Participantes</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                        {[...walkers, ...trainers, ...companies].map(professional => {
                          const isWalker = walkers.some(w => w.id === professional.id);
                          const isTrainer = trainers.some(t => t.id === professional.id);
                          const isCompany = companies.some(c => c.id === professional.id);
                          
                          const name = isWalker ? professional.walker_name : (isTrainer ? professional.trainer_name : professional.company_name);
                          const email = professional.created_by || professional.company_email;
                          const isSelected = groupParticipants.some(p => p.email === email);
                          
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
                                  {isWalker ? '🐕 Walker' : (isTrainer ? '🎓 Trainer' : '🏢 Company')}
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
                      className="bg-white text-gray-900 placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Exemplo: "João Silva" ou "joao@mail.com"
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCreateChat}
                  disabled={createConversationMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
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