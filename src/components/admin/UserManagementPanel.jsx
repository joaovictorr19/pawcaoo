import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersListView from "./users/UsersListView";
import BadgeUploadManager from "./BadgeUploadManager";

export default function UserManagementPanel() {
  const [activeTab, setActiveTab] = useState("users");

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 1000),
    staleTime: 30000,
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Utilizadores ({allUsers.length})</TabsTrigger>
          <TabsTrigger value="badges">Emblemas</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersListView users={allUsers} isLoading={loadingUsers} />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeUploadManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}