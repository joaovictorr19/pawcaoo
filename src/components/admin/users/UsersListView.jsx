import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Search, Loader2 } from "lucide-react";
import UserManageDialog from "./UserManageDialog";

export default function UsersListView({ users, isLoading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchTerm]);

  const handleManageUser = (user) => {
    setSelectedUser(user);
    setShowManageDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">Gestão de Utilizadores</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Editar perfis, criar profissionais e gerir dados
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Procurar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-panel border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-[300px] font-semibold">Utilizador</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Nível</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan="5" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="5" className="text-center py-8 text-gray-500">
                    {searchTerm ? "Nenhum utilizador encontrado" : "Nenhum utilizador"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                            {user.full_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {user.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.account_type === "owner"
                              ? "Cliente"
                              : user.account_type === "walker"
                              ? "Passeador"
                              : user.account_type === "trainer"
                              ? "Treinador"
                              : user.account_type === "both"
                              ? "Ambos"
                              : "Empresa"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {user.email}
                      </code>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge className="bg-red-100 text-red-800 font-semibold">
                          👑 Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 font-semibold">
                          👤 Utilizador
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-amber-600">
                        Nv{user.gamification_level || 1}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleManageUser(user)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-9 px-4 font-semibold"
                      >
                        Gerir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Manage Dialog */}
      {selectedUser && (
        <UserManageDialog
          user={selectedUser}
          isOpen={showManageDialog}
          onClose={() => {
            setShowManageDialog(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}