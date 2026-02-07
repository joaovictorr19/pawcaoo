import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import BasicInfoSection from "./sections/BasicInfoSection";
import ProfessionalSection from "./sections/ProfessionalSection";
import GamificationSection from "./sections/GamificationSection";
import BadgesSection from "./sections/BadgesSection";

export default function UserManageDialog({ user, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  // Queries
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: user.email }).then(
        (profiles) => profiles[0] || null
      ),
    enabled: !!user?.email && isOpen,
    staleTime: 10000,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadges", user?.email],
    queryFn: () =>
      base44.entities.UserBadge.filter({ user_email: user.email }),
    enabled: !!user?.email && isOpen,
    staleTime: 10000,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ["walkerProfile", user?.email],
    queryFn: () =>
      base44.entities.WalkerProfile.filter({ created_by: user.email }).then(
        (profiles) => profiles[0] || null
      ),
    enabled: !!user?.email && isOpen,
    staleTime: 10000,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ["trainerProfile", user?.email],
    queryFn: () =>
      base44.entities.TrainerProfile.filter({ created_by: user.email }).then(
        (profiles) => profiles[0] || null
      ),
    enabled: !!user?.email && isOpen,
    staleTime: 10000,
  });

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ["badgeDefinitions"],
    queryFn: () =>
      base44.entities.BadgeDefinition.filter({ is_active: true }, "-created_date", 500),
    staleTime: 30000,
  });

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div>
            <DialogTitle className="text-2xl">
              {user.full_name || "Utilizador"}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Dados</TabsTrigger>
            <TabsTrigger value="professional">Profissional</TabsTrigger>
            <TabsTrigger value="gamification">Gamificação</TabsTrigger>
            <TabsTrigger value="badges">Emblemas ({userBadges.length})</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <BasicInfoSection user={user} userProfile={userProfile} />
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-4">
            <ProfessionalSection
              user={user}
              walkerProfile={walkerProfile}
              trainerProfile={trainerProfile}
            />
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="space-y-4">
            <GamificationSection user={user} userProfile={userProfile} />
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <BadgesSection
              user={user}
              userBadges={userBadges}
              badgeDefinitions={badgeDefinitions}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}