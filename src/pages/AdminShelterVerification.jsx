import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { 
  ShieldCheck, XCircle, CheckCircle, ExternalLink, MapPin, 
  Phone, Mail, Building2, AlertCircle 
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
// NotificationService removed - use NotificationManager instead

export default function AdminShelterVerification() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      window.location.href = '/';
    }
  }, [currentUser]);

  const { data: pendingShelters, isLoading } = useQuery({
    queryKey: ['pendingShelters'],
    queryFn: () => base44.entities.ShelterProfile.filter({ verification_status: 'pending' }),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      // Update profile
      await base44.entities.ShelterProfile.update(id, {
        verification_status: status,
        is_verified: status === 'approved',
        rejection_reason: reason || null,
      });

      // Create notification record for the shelter owner
       const shelter = pendingShelters.find(s => s.id === id);
       if (shelter && shelter.created_by) {
         await base44.entities.Notification.create({
           recipient_email: shelter.created_by,
           title: status === 'approved' 
             ? (language === 'pt' ? '✅ Perfil de Abrigo Verificado!' : '✅ Shelter Profile Verified!')
             : (language === 'pt' ? '⚠️ Verificação do Abrigo Recusada' : '⚠️ Shelter Verification Rejected'),
           message: status === 'approved'
             ? (language === 'pt' ? `Parabéns! O perfil do abrigo "${shelter.shelter_name}" foi verificado. Agora você tem acesso total.` : `Congratulations! The shelter profile "${shelter.shelter_name}" has been verified. You now have full access.`)
             : (language === 'pt' ? `Infelizmente a verificação para "${shelter.shelter_name}" foi recusada. Motivo: ${reason}` : `Unfortunately verification for "${shelter.shelter_name}" was rejected. Reason: ${reason}`),
           type: 'verification',
           priority: status === 'approved' ? 'high' : 'normal',
           action_url: '/ShelterDashboard',
           is_read: false
         });
       }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingShelters']);
      toast({
        title: "Status updated",
        description: "Shelter verification status has been updated successfully.",
      });
      setSelectedShelter(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (shelter) => {
    if (confirm(language === 'pt' ? 'Confirmar aprovação deste abrigo?' : 'Confirm approval for this shelter?')) {
      verifyMutation.mutate({ id: shelter.id, status: 'approved' });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    verifyMutation.mutate({ id: selectedShelter.id, status: 'rejected', reason: rejectionReason });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              {language === 'pt' ? 'Verificação de Abrigos' : 'Shelter Verification'}
            </h1>
            <p className="text-gray-500 mt-1">
              {language === 'pt' ? 'Gerencie as solicitações pendentes de perfis de abrigo.' : 'Manage pending shelter profile verification requests.'}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">
            {pendingShelters?.length || 0} {language === 'pt' ? 'Pendentes' : 'Pending'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : pendingShelters?.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                {language === 'pt' ? 'Tudo Limpo!' : 'All Caught Up!'}
              </h3>
              <p className="text-gray-500 mt-2">
                {language === 'pt' ? 'Não há solicitações de verificação pendentes no momento.' : 'There are no pending verification requests at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingShelters.map((shelter) => (
              <Card key={shelter.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 relative flex-shrink-0">
                      {shelter.cover_photo_url ? (
                        <img src={shelter.cover_photo_url} alt={shelter.shelter_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}
                      {shelter.logo_url && (
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full p-1 shadow-lg">
                          <img src={shelter.logo_url} alt="logo" className="w-full h-full rounded-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{shelter.shelter_name}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {shelter.location_city}</span>
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {shelter.contact_email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {shelter.contact_phone}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {shelter.website_url && (
                            <a href={shelter.website_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-sm text-gray-900 mb-2 uppercase tracking-wider">Description</h4>
                          <p className="text-sm text-gray-600 line-clamp-4">{shelter.description || "No description provided."}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-sm text-gray-900 mb-2 uppercase tracking-wider">Adoption Policy</h4>
                          <p className="text-sm text-gray-600 line-clamp-4">{shelter.adoption_policy || "No policy details provided."}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Requested: {format(new Date(shelter.created_date || new Date()), 'PPP')}
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              setSelectedShelter(shelter);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Recusar' : 'Reject'}
                          </Button>
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(shelter)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Aprovar' : 'Approve'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'pt' ? 'Recusar Verificação' : 'Reject Verification'}</DialogTitle>
              <DialogDescription>
                {language === 'pt' 
                  ? 'Por favor, forneça um motivo para a recusa. Isso será enviado ao proprietário do abrigo.'
                  : 'Please provide a reason for rejection. This will be sent to the shelter owner.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={language === 'pt' ? 'Motivo da recusa...' : 'Reason for rejection...'}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                {language === 'pt' ? 'Confirmar Recusa' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}