import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Dog } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProfile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myWalkerProfiles } = useQuery({
    queryKey: ['myWalkerProfiles'],
    queryFn: () => base44.entities.WalkerProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 text-lg">Manage your account information</p>
        </div>

        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-2xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Full Name</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {user?.full_name || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {user?.email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Role</div>
                  <div className="text-xl font-semibold text-gray-900 capitalize">
                    {user?.role || 'user'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {myWalkerProfiles && myWalkerProfiles.length > 0 && (
          <Card className="border-0 shadow-2xl mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Dog className="w-6 h-6" />
                My Walker Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {myWalkerProfiles.map(profile => (
                  <div key={profile.id} className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-900">{profile.walker_name}</div>
                      <div className="text-sm text-gray-600">{profile.location}</div>
                      <div className="text-lg font-bold text-green-600 mt-1">
                        ${profile.hourly_rate}/hour
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Walks</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {profile.total_walks || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {(!myWalkerProfiles || myWalkerProfiles.length === 0) && (
            <Link to={createPageUrl('BecomeWalker')} className="block">
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 text-lg">
                <Dog className="w-5 h-5 mr-2" />
                Become a Walker
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}