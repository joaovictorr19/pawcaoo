
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Store, Calendar, DollarSign, Package, TrendingUp,
  Clock, User, PawPrint, CheckCircle, X, AlertCircle,
  Bell, Phone, MapPin, Pill, MessageCircle, Send,
  Shield, RefreshCw, Camera, Image as ImageIcon,
  CalendarClock, FileText, Megaphone // Added Megaphone
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentModalBooking, setCurrentModalBooking] = useState(null);

  // NEW: Service and Announcement modals
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [showServicesListModal, setShowServicesListModal] = useState(false);
  const [showAnnouncementsListModal, setShowAnnouncementsListModal] = useState(false);

  // NEW: Edit modals
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Form states for Schedule Modal
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");

  // Form states for Notes Modal
  const [serviceNotes, setServiceNotes] = useState("");

  // Form states for Photos Modal
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);

  // NEW: Service form
  const [newService, setNewService] = useState({
    service_name: "",
    service_type: "bath",
    description: "",
    duration_minutes: 60,
    base_price: "",
    price_by_size: { small: "", medium: "", large: "", extra_large: "" },
    includes: [],
    is_emergency: false,
    emergency_surcharge: "",
    available_days: [],
    image_url: ""
  });

  // NEW: Announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    promotion_type: "discount",
    discount_percentage: "",
    target_subscription_tier: ["free", "basic", "premium", "vip"],
    start_date: "",
    end_date: "",
    image_url: "",
    is_featured: false
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['myCompany'],
    queryFn: async () => {
      if (!user?.email) return null;

      // Try multiple filters to find the company
      const byEmail = await base44.entities.PartnerCompany.filter({
        company_email: user.email
      });

      if (byEmail.length > 0) return byEmail[0];

      // Try by created_by as fallback
      const byCreator = await base44.entities.PartnerCompany.filter({
        created_by: user.email
      });

      if (byCreator.length > 0) return byCreator[0];

      return null;
    },
    enabled: !!user,
  });

  const { data: services } = useQuery({
    queryKey: ['myServices'],
    queryFn: () => base44.entities.PartnerService.filter({
      partner_company_email: user?.email
    }),
    enabled: !!user,
    initialData: [],
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['companyBookings'],
    queryFn: () => base44.entities.ServiceBooking.filter({
      partner_company_email: user?.email
    }, '-booking_date'),
    enabled: !!user && !!company,
    initialData: [],
  });

  const { data: conversations } = useQuery({
    queryKey: ['companyConversations'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allConvos = await base44.entities.ChatConversation.list('-last_message_date');
      return allConvos.filter(c =>
        c.participants?.some(p => p.email === user?.email)
      );
    },
    enabled: !!user,
    initialData: [],
  });

  // NEW: Query for partner's own services (by partner_id)
  const { data: myServices = [] } = useQuery({
    queryKey: ['myPartnerServices', company?.id],
    queryFn: () => base44.entities.PartnerService.filter({
      partner_id: company?.id
    }),
    enabled: !!company,
  });

  // NEW: Query for partner's own announcements
  const { data: myAnnouncements = [] } = useQuery({
    queryKey: ['myAnnouncements', company?.id],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({
      company_id: company?.id
    }),
    enabled: !!company,
  });


  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status, additionalData }) => {
      const updateData = {
        status,
        confirmed_date: status === 'confirmed' ? new Date().toISOString() : undefined,
        ...additionalData
      };

      await base44.entities.ServiceBooking.update(bookingId, updateData);

      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const statusMessages = {
          confirmed: language === 'pt' ? 'confirmado' : 'confirmed',
          cancelled: language === 'pt' ? 'cancelado' : 'cancelled',
          completed: language === 'pt' ? 'concluído' : 'completed',
          in_progress: language === 'pt' ? 'em progresso' : 'in progress'
        };

        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: language === 'pt' ? `Agendamento ${statusMessages[status]}` : `Booking ${statusMessages[status]}`,
          message: language === 'pt'
            ? `Seu agendamento de ${booking.service_name} para ${booking.dog_name} foi ${statusMessages[status]}.`
            : `Your ${booking.service_name} booking for ${booking.dog_name} has been ${statusMessages[status]}.`,
          type: "booking",
          related_id: bookingId,
          priority: "high"
        });
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBookings'] });
      toast.success(language === 'pt' ? "Agendamento atualizado!" : "Booking updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar");
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, type }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { url: file_url, type };
    },
    onSuccess: (data) => {
      if (data.type === 'before') {
        setBeforePhotos(prev => [...prev, data.url]);
      } else {
        setAfterPhotos(prev => [...prev, data.url]);
      }
      toast.success(language === 'pt' ? 'Foto carregada!' : 'Photo uploaded!');
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao carregar foto' : 'Failed to upload photo'));
    }
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (bookingId) => {
      const checkInDateTime = pickupDate && pickupTime ? `${pickupDate}T${pickupTime}` : undefined;
      const checkOutDateTime = dropoffDate && dropoffTime ? `${dropoffDate}T${dropoffTime}` : undefined;

      const updateData = {
        check_in_time: checkInDateTime,
        check_out_time: checkOutDateTime
      };

      await base44.entities.ServiceBooking.update(bookingId, updateData);

      // Notify owner
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && (checkInDateTime || checkOutDateTime)) {
        let message = '';
        if (checkInDateTime && checkOutDateTime) {
            message = language === 'pt'
                ? `Recolha: ${format(new Date(checkInDateTime), "dd/MM/yyyy 'às' HH:mm")}\nEntrega: ${format(new Date(checkOutDateTime), "dd/MM/yyyy 'at' HH:mm")}`
                : `Pickup: ${format(new Date(checkInDateTime), "MM/dd/yyyy 'at' HH:mm")}\nDropoff: ${format(new Date(checkOutDateTime), "MM/dd/yyyy 'at' HH:mm")}`;
        } else if (checkInDateTime) {
            message = language === 'pt'
                ? `Recolha agendada para ${format(new Date(checkInDateTime), "dd/MM/yyyy 'às' HH:mm")}.`
                : `Pickup scheduled for ${format(new Date(checkInDateTime), "MM/dd/yyyy 'at' HH:mm")}.`;
        } else if (checkOutDateTime) {
            message = language === 'pt'
                ? `Entrega agendada para ${format(new Date(checkOutDateTime), "dd/MM/yyyy 'às' HH:mm")}.`
                : `Dropoff scheduled for ${format(new Date(checkOutDateTime), "MM/dd/yyyy 'at' HH:mm")}.`;
        }


        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: language === 'pt' ? '📅 Horários Agendados' : '📅 Schedule Set',
          message: message,
          type: "booking",
          related_id: bookingId,
          priority: "normal"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBookings'] });
      setShowScheduleModal(false);
      toast.success(language === 'pt' ? 'Horários salvos!' : 'Schedule saved!');
      setPickupDate("");
      setPickupTime("");
      setDropoffDate("");
      setDropoffTime("");
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao salvar horários' : 'Failed to save schedule'));
    }
  });

  const savePhotosMutation = useMutation({
    mutationFn: async (bookingId) => {
      const updateData = {
        before_photos: beforePhotos,
        after_photos: afterPhotos
      };

      await base44.entities.ServiceBooking.update(bookingId, updateData);

      // Notify owner
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && (beforePhotos.length > 0 || afterPhotos.length > 0)) {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: language === 'pt' ? '📸 Fotos do Serviço' : '📸 Service Photos',
          message: language === 'pt'
            ? `${company.company_name} adicionou fotos do serviço de ${booking.service_name}`
            : `${company.company_name} added photos of ${booking.service_name} service`,
          type: "booking",
          related_id: bookingId,
          priority: "normal"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBookings'] });
      setShowPhotosModal(false);
      toast.success(language === 'pt' ? 'Fotos salvas!' : 'Photos saved!');
      setBeforePhotos([]);
      setAfterPhotos([]);
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao salvar fotos' : 'Failed to save photos'));
    }
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (bookingId) => {
      await base44.entities.ServiceBooking.update(bookingId, {
        service_notes: serviceNotes
      });

      // Notify owner
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && serviceNotes) {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: language === 'pt' ? '📝 Notas do Serviço' : '📝 Service Notes',
          message: language === 'pt'
            ? `${company.company_name} adicionou notas sobre o serviço`
            : `${company.company_name} added notes about the service`,
          type: "booking",
          related_id: bookingId,
          priority: "normal"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBookings'] });
      setShowNotesModal(false);
      toast.success(language === 'pt' ? 'Notas salvas!' : 'Notes saved!');
      setServiceNotes("");
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao salvar notas' : 'Failed to save notes'));
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ownerEmail, ownerName, bookingId }) => {
      let conversation = conversations.find(c =>
        c.participants?.some(p => p.email === ownerEmail)
      );

      if (!conversation) {
        conversation = await base44.entities.ChatConversation.create({
          conversation_type: 'one_on_one',
          participants: [
            {
              email: user.email,
              name: company.company_name,
              photo_url: company.logo_url,
              role: 'company',
              last_read_at: new Date().toISOString()
            },
            {
              email: ownerEmail,
              name: ownerName,
              role: 'owner',
              last_read_at: new Date().toISOString()
            }
          ],
          last_message: messageText,
          last_message_sender: user.email,
          last_message_date: new Date().toISOString()
        });
      }

      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: company.company_name,
        sender_photo_url: company.logo_url,
        message: messageText,
        message_type: 'text'
      });

      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: messageText,
        last_message_sender: user.email,
        last_message_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        recipient_email: ownerEmail,
        title: `${company.company_name} enviou uma mensagem`,
        message: messageText.substring(0, 100),
        type: "message",
        related_id: conversation.id,
        action_url: `Messages?conversation_id=${conversation.id}`,
        priority: "normal"
      });

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyConversations'] });
      toast.success(language === 'pt' ? "Mensagem enviada!" : "Message sent!");
      setMessageText("");
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  });

  // NEW: Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData) => {
      // Convert string values to numbers
      const processedData = {
        ...serviceData,
        base_price: parseFloat(serviceData.base_price) || 0,
        duration_minutes: parseInt(serviceData.duration_minutes) || 60,
        emergency_surcharge: parseFloat(serviceData.emergency_surcharge) || 0,
        price_by_size: {
          small: parseFloat(serviceData.price_by_size.small) || 0,
          medium: parseFloat(serviceData.price_by_size.medium) || 0,
          large: parseFloat(serviceData.price_by_size.large) || 0,
          extra_large: parseFloat(serviceData.price_by_size.extra_large) || 0
        }
      };

      return await base44.entities.PartnerService.create({
        ...processedData,
        partner_id: company.id,
        partner_name: company.company_name,
        partner_company_email: company.company_email,
        moderation_status: 'pending',
        is_active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPartnerServices'] });
      toast.success(language === 'pt' ? 'Serviço criado! Aguardando aprovação.' : 'Service created! Awaiting approval.');
      setShowCreateServiceModal(false);
      setNewService({
        service_name: "",
        service_type: "bath",
        description: "",
        duration_minutes: 60,
        base_price: "",
        price_by_size: { small: "", medium: "", large: "", extra_large: "" },
        includes: [],
        is_emergency: false,
        emergency_surcharge: "",
        available_days: [],
        image_url: ""
      });
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao criar serviço' : 'Failed to create service'));
    }
  });

  // NEW: Create Announcement Mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData) => {
      // Convert string values to numbers
      const processedData = {
        ...announcementData,
        discount_percentage: parseInt(announcementData.discount_percentage) || 0
      };

      return await base44.entities.CompanyAnnouncement.create({
        ...processedData,
        company_id: company.id,
        company_name: company.company_name,
        company_email: company.company_email,
        moderation_status: 'pending',
        is_active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAnnouncements'] });
      toast.success(language === 'pt' ? 'Anúncio criado! Aguardando aprovação.' : 'Announcement created! Awaiting approval.');
      setShowCreateAnnouncementModal(false);
      setNewAnnouncement({
        title: "",
        message: "",
        promotion_type: "discount",
        discount_percentage: "",
        target_subscription_tier: ["free", "basic", "premium", "vip"],
        start_date: "",
        end_date: "",
        image_url: "",
        is_featured: false
      });
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao criar anúncio' : 'Failed to create announcement'));
    }
  });

  // NEW: Update Service Mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, serviceData }) => {
      const service = myServices.find(s => s.id === serviceId);

      // Convert string values to numbers
      const processedData = {
        ...serviceData,
        base_price: parseFloat(serviceData.base_price) || 0,
        duration_minutes: parseInt(serviceData.duration_minutes) || 60,
        emergency_surcharge: parseFloat(serviceData.emergency_surcharge) || 0,
        price_by_size: {
          small: parseFloat(serviceData.price_by_size.small) || 0,
          medium: parseFloat(serviceData.price_by_size.medium) || 0,
          large: parseFloat(serviceData.price_by_size.large) || 0,
          extra_large: parseFloat(serviceData.price_by_size.extra_large) || 0
        }
      };

      // If service was approved, resubmit for moderation
      if (service.moderation_status === 'approved') {
        processedData.moderation_status = 'pending';
        processedData.rejection_reason = null;

        // Notify admin about the update
        await base44.entities.Notification.create({
          recipient_email: 'admin@pawcao.com', // You can make this dynamic
          title: language === 'pt' ? 'Serviço Atualizado - Requer Aprovação' : 'Service Updated - Requires Approval',
          message: `${company.company_name} atualizou o serviço "${serviceData.service_name}". Necessita nova aprovação.`,
          type: "system",
          related_id: serviceId,
          priority: "normal"
        });
      } else if (service.moderation_status === 'rejected') {
        // If resubmitting after rejection, set to pending
        processedData.moderation_status = 'pending';
        processedData.rejection_reason = null;
      }

      return await base44.entities.PartnerService.update(serviceId, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPartnerServices'] });
      toast.success(language === 'pt' ? 'Serviço atualizado! Aguardando nova aprovação.' : 'Service updated! Awaiting new approval.');
      setShowEditServiceModal(false);
      setEditingService(null);
      // Reset newService state to prevent carry-over if creating a new one next
      setNewService({
        service_name: "",
        service_type: "bath",
        description: "",
        duration_minutes: 60,
        base_price: "",
        price_by_size: { small: "", medium: "", large: "", extra_large: "" },
        includes: [],
        is_emergency: false,
        emergency_surcharge: "",
        available_days: [],
        image_url: ""
      });
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao atualizar serviço' : 'Failed to update service'));
    }
  });

  // NEW: Update Announcement Mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ announcementId, announcementData }) => {
      const announcement = myAnnouncements.find(a => a.id === announcementId);

      // Convert string values to numbers
      const processedData = {
        ...announcementData,
        discount_percentage: parseInt(announcementData.discount_percentage) || 0
      };

      // If announcement was approved, resubmit for moderation
      if (announcement.moderation_status === 'approved') {
        processedData.moderation_status = 'pending';
        processedData.is_active = false;
        processedData.moderation_notes = null;

        // Notify admin about the update
        await base44.entities.Notification.create({
          recipient_email: 'admin@pawcao.com',
          title: language === 'pt' ? 'Anúncio Atualizado - Requer Aprovação' : 'Announcement Updated - Requires Approval',
          message: `${company.company_name} atualizou o anúncio "${announcementData.title}". Necessita nova aprovação.`,
          type: "system",
          related_id: announcementId,
          priority: "normal"
        });
      } else if (announcement.moderation_status === 'rejected') {
        // If resubmitting after rejection, set to pending
        processedData.moderation_status = 'pending';
        processedData.moderation_notes = null;
        processedData.is_active = false;
      }

      return await base44.entities.CompanyAnnouncement.update(announcementId, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAnnouncements'] });
      toast.success(language === 'pt' ? 'Anúncio atualizado! Aguardando nova aprovação.' : 'Announcement updated! Awaiting new approval.');
      setShowEditAnnouncementModal(false);
      setEditingAnnouncement(null);
      // Reset newAnnouncement state to prevent carry-over if creating a new one next
      setNewAnnouncement({
        title: "",
        message: "",
        promotion_type: "discount",
        discount_percentage: "",
        target_subscription_tier: ["free", "basic", "premium", "vip"],
        start_date: "",
        end_date: "",
        image_url: "",
        is_featured: false
      });
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao atualizar anúncio' : 'Failed to update announcement'));
    }
  });


  // NEW: Upload Service Image Mutation
  const uploadServiceImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      setNewService({ ...newService, image_url: url });
      toast.success(language === 'pt' ? 'Imagem carregada!' : 'Image uploaded!');
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao carregar imagem do serviço' : 'Failed to upload service image'));
    }
  });

  // NEW: Upload Announcement Image Mutation
  const uploadAnnouncementImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      setNewAnnouncement({ ...newAnnouncement, image_url: url });
      toast.success(language === 'pt' ? 'Imagem carregada!' : 'Image uploaded!');
    },
    onError: (error) => {
      toast.error(error.message || (language === 'pt' ? 'Erro ao carregar imagem do anúncio' : 'Failed to upload announcement image'));
    }
  });

  const toggleInclude = (item) => {
    const includes = newService.includes || [];
    setNewService({
      ...newService,
      includes: includes.includes(item)
        ? includes.filter(i => i !== item)
        : [...includes, item]
    });
  };

  const toggleDay = (day) => {
    const days = newService.available_days || [];
    setNewService({
      ...newService,
      available_days: days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day]
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate({ file, type });
    }
  };

  const openScheduleModal = (booking) => {
    setCurrentModalBooking(booking);
    setPickupDate(booking.check_in_time ? booking.check_in_time.split('T')[0] : "");
    setPickupTime(booking.check_in_time ? booking.check_in_time.split('T')[1]?.substring(0, 5) : ""); // Ensure HH:mm format
    setDropoffDate(booking.check_out_time ? booking.check_out_time.split('T')[0] : "");
    setDropoffTime(booking.check_out_time ? booking.check_out_time.split('T')[1]?.substring(0, 5) : ""); // Ensure HH:mm format
    setShowScheduleModal(true);
  };

  const openPhotosModal = (booking) => {
    setCurrentModalBooking(booking);
    setBeforePhotos(booking.before_photos || []);
    setAfterPhotos(booking.after_photos || []);
    setShowPhotosModal(true);
  };

  const openNotesModal = (booking) => {
    setCurrentModalBooking(booking);
    setServiceNotes(booking.service_notes || "");
    setShowNotesModal(true);
  };

  // NEW: Function to open edit service modal
  const openEditServiceModal = (service) => {
    setEditingService(service);
    setNewService({
      service_name: service.service_name || "",
      service_type: service.service_type || "bath",
      description: service.description || "",
      duration_minutes: service.duration_minutes || 60,
      base_price: service.base_price?.toString() || "",
      price_by_size: {
        small: service.price_by_size?.small?.toString() || "",
        medium: service.price_by_size?.medium?.toString() || "",
        large: service.price_by_size?.large?.toString() || "",
        extra_large: service.price_by_size?.extra_large?.toString() || ""
      },
      includes: service.includes || [],
      is_emergency: service.is_emergency || false,
      emergency_surcharge: service.emergency_surcharge?.toString() || "",
      available_days: service.available_days || [],
      image_url: service.image_url || ""
    });
    setShowEditServiceModal(true);
  };

  // NEW: Function to open edit announcement modal
  const openEditAnnouncementModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title || "",
      message: announcement.message || "",
      promotion_type: announcement.promotion_type || "discount",
      discount_percentage: announcement.discount_percentage?.toString() || "",
      target_subscription_tier: announcement.target_subscription_tier || ["free", "basic", "premium", "vip"],
      start_date: announcement.start_date || "",
      end_date: announcement.end_date || "",
      image_url: announcement.image_url || "",
      is_featured: announcement.is_featured || false
    });
    setShowEditAnnouncementModal(true);
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.pending;
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'pt' ? 'Carregando...' : 'Loading...'}
            </h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-2xl border-0 shadow-2xl">
          <CardContent className="p-12">
            <div className="text-center mb-6">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'pt' ? 'Empresa Não Encontrada' : 'Company Not Found'}
              </h2>
              <p className="text-gray-600 mb-4">
                {language === 'pt'
                  ? 'Não encontramos uma empresa associada à sua conta.'
                  : 'We could not find a company associated with your account.'}
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="mb-2 text-blue-800 hover:bg-blue-100"
              >
                {showDebug ? '▼' : '▶'} {language === 'pt' ? 'Informações de Debug' : 'Debug Info'}
              </Button>

              {showDebug && (
                <div className="text-sm space-y-2 mt-2">
                  <div>
                    <strong className="text-gray-700">Email do usuário:</strong>
                    <code className="ml-2 bg-white px-2 py-1 rounded text-gray-900">{user?.email || 'N/A'}</code>
                  </div>
                  <div>
                    <strong className="text-gray-700">Tipo de conta:</strong>
                    <code className="ml-2 bg-white px-2 py-1 rounded text-gray-900">{user?.account_type || 'não definido'}</code>
                  </div>
                  <div>
                    <strong className="text-gray-700">Role:</strong>
                    <code className="ml-2 bg-white px-2 py-1 rounded text-gray-900">{user?.role || 'user'}</code>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">
                  {language === 'pt' ? '✅ Soluções:' : '✅ Solutions:'}
                </h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>
                    {language === 'pt'
                      ? 'Verifique se criou a empresa com o email correto:'
                      : 'Check if you created the company with the correct email:'}{' '}
                    <code className="bg-white px-2 py-1 rounded text-gray-900">{user?.email || 'N/A'}</code>
                  </li>
                  <li>
                    {language === 'pt'
                      ? 'A empresa deve ser criada através do painel de Admin (Dashboard → Dados → PartnerCompany)'
                      : 'The company must be created through Admin panel (Dashboard → Data → PartnerCompany)'}
                  </li>
                  <li>
                    {language === 'pt'
                      ? 'Ao criar, use este email no campo "company_email" e "created_by"'
                      : 'When creating, use this email in the "company_email" and "created_by" fields'}
                  </li>
                </ol>
              </div>

              {user?.role === 'admin' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Ir para Admin Dashboard' : 'Go to Admin Dashboard'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'pt' ? 'Recarregar Página' : 'Reload Page'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 truncate">
                {language === 'pt' ? 'Painel de Parceiro' : 'Partner Dashboard'}
              </h1>
              <p className="text-sm md:text-lg text-gray-600 font-medium truncate">
                {company.company_name}
              </p>
            </div>
            {stats.pending > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse flex-shrink-0 text-xs md:text-sm px-2 md:px-3 py-1">
                <Bell className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {stats.pending} {language === 'pt' ? 'novos' : 'new'}
              </Badge>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: AlertCircle, value: stats.pending, label: language === 'pt' ? "Pendentes" : "Pending", color: "from-yellow-500 to-orange-500" },
              { icon: CheckCircle, value: stats.confirmed, label: language === 'pt' ? "Confirmados" : "Confirmed", color: "from-blue-500 to-cyan-500" },
              { icon: CheckCircle, value: stats.completed, label: language === 'pt' ? "Completos" : "Completed", color: "from-green-500 to-emerald-500" },
              { icon: DollarSign, value: `€${stats.revenue.toFixed(0)}`, label: language === 'pt' ? "Receita" : "Revenue", color: "from-purple-500 to-pink-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* NEW: Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Button
            onClick={() => setShowCreateServiceModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-16 font-semibold"
          >
            <Package className="w-5 h-5 mr-2" />
            {language === 'pt' ? 'Criar Serviço' : 'Create Service'}
          </Button>
          <Button
            onClick={() => setShowCreateAnnouncementModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-16 font-semibold"
          >
            <Megaphone className="w-5 h-5 mr-2" />
            {language === 'pt' ? 'Criar Anúncio' : 'Create Ad'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowServicesListModal(true)}
            className="border-blue-300 text-blue-600 h-16 font-semibold"
          >
            <Package className="w-5 h-5 mr-2" />
            {language === 'pt' ? 'Meus Serviços' : 'My Services'}
            <Badge className="ml-2 bg-blue-100 text-blue-600">{myServices.length}</Badge>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAnnouncementsListModal(true)}
            className="border-purple-300 text-purple-600 h-16 font-semibold"
          >
            <Megaphone className="w-5 h-5 mr-2" />
            {language === 'pt' ? 'Meus Anúncios' : 'My Ads'}
            <Badge className="ml-2 bg-purple-100 text-purple-600">{myAnnouncements.length}</Badge>
          </Button>
        </div>

        {/* Bookings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 bg-white shadow-lg rounded-xl p-1 md:p-2 gap-1">
            <TabsTrigger value="pending" className="rounded-lg text-xs md:text-sm">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Pendentes' : 'Pending'}</span>
              <span className="sm:hidden">({stats.pending})</span>
              {stats.pending > 0 && <Badge className="ml-1 md:ml-2 bg-red-500 text-white text-[10px] px-1">
                {stats.pending}
              </Badge>}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Confirmados' : 'Confirmed'}</span>
              <span className="sm:hidden">({stats.confirmed})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-lg text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Em Progresso' : 'Progress'}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Completos' : 'Done'}</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-xs md:text-sm">
              {language === 'pt' ? 'Todos' : 'All'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 md:h-64 rounded-2xl" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 md:p-12 text-center">
                  <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Nenhum agendamento' : 'No bookings'}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    {activeTab === 'pending'
                      ? (language === 'pt' ? 'Sem pedidos pendentes' : 'No pending requests')
                      : (language === 'pt' ? 'Nenhum agendamento nesta categoria' : 'No bookings in this category')
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-2 shadow-lg ${
                    booking.is_emergency ? 'border-red-300 bg-red-50' :
                    booking.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-lg md:text-xl truncate">
                              {booking.service_name}
                            </CardTitle>
                            {booking.is_emergency && (
                              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                                EMERGÊNCIA
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(booking.booking_date).toLocaleDateString()} • {booking.booking_time}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl md:text-2xl font-bold text-green-600">
                            €{booking.total_amount?.toFixed(2)}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            {booking.duration_minutes}min
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-6">
                      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
                        {/* Pet Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <PawPrint className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Pet' : 'Pet'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                                {booking.dog_name}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600 truncate">
                                {booking.dog_breed} • {booking.dog_size} • {booking.dog_weight}kg
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Cliente' : 'Client'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                                {booking.owner_name}
                              </p>
                              <a href={`tel:${booking.owner_phone}`} className="text-xs md:text-sm text-blue-600 hover:underline truncate block">
                                {booking.owner_phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Booking Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Agendado para' : 'Scheduled for'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900">
                                {format(new Date(booking.booking_date), "dd/MM/yyyy")}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600">
                                {booking.booking_time} • {booking.duration_minutes}min
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Reservado em' : 'Booked on'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900">
                                {format(new Date(booking.created_date), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Special Notes */}
                      {booking.special_requests && (
                        <div className="bg-white border-2 border-blue-200 rounded-lg p-3 md:p-4 mb-4">
                          <p className="text-xs md:text-sm font-semibold text-blue-900 mb-1">
                            {language === 'pt' ? 'Pedidos Especiais:' : 'Special Requests:'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-700">{booking.special_requests}</p>
                        </div>
                      )}

                      {booking.symptoms && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 md:p-4 mb-4">
                          <p className="text-xs md:text-sm font-semibold text-orange-900 mb-1 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            {language === 'pt' ? 'Sintomas:' : 'Symptoms:'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-700">{booking.symptoms}</p>
                        </div>
                      )}

                      {/* Quick Message Section */}
                      {selectedBooking?.id === booking.id ? (
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            {language === 'pt' ? 'Enviar Mensagem para Cliente' : 'Send Message to Client'}
                          </h4>
                          <Textarea
                            placeholder={language === 'pt' ? "Digite sua mensagem..." : "Type your message..."}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={3}
                            className="mb-3"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (messageText.trim()) {
                                  sendMessageMutation.mutate({
                                    ownerEmail: booking.owner_email,
                                    ownerName: booking.owner_name,
                                    bookingId: booking.id
                                  });
                                }
                              }}
                              disabled={sendMessageMutation.isPending || !messageText.trim()}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {language === 'pt' ? 'Enviar' : 'Send'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(null);
                                setMessageText("");
                              }}
                            >
                              {language === 'pt' ? 'Cancelar' : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full mb-4 border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {language === 'pt' ? 'Enviar Mensagem ao Cliente' : 'Message Client'}
                        </Button>
                      )}

                      {/* Additional Actions Section */}
                      {(booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed') && (
                          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 md:gap-3 justify-between mt-4">
                              <Button
                                  variant="outline"
                                  className="flex-1 min-w-0 md:min-w-[150px] border-blue-300 text-blue-600 hover:bg-blue-50 h-10 md:h-12 text-xs md:text-sm"
                                  onClick={() => openScheduleModal(booking)}
                              >
                                  <CalendarClock className="w-4 h-4 mr-2" />
                                  {language === 'pt' ? 'Horários' : 'Schedule'}
                              </Button>
                              <Button
                                  variant="outline"
                                  className="flex-1 min-w-0 md:min-w-[150px] border-purple-300 text-purple-600 hover:bg-purple-50 h-10 md:h-12 text-xs md:text-sm"
                                  onClick={() => openPhotosModal(booking)}
                              >
                                  <Camera className="w-4 h-4 mr-2" />
                                  {language === 'pt' ? 'Fotos' : 'Photos'}
                              </Button>
                              <Button
                                  variant="outline"
                                  className="flex-1 min-w-0 md:min-w-[150px] border-green-300 text-green-600 hover:bg-green-50 h-10 md:h-12 text-xs md:text-sm"
                                  onClick={() => openNotesModal(booking)}
                              >
                                  <FileText className="w-4 h-4 mr-2" />
                                  {language === 'pt' ? 'Notas' : 'Notes'}
                              </Button>
                          </div>
                      )}

                      {/* Status-specific Actions */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({
                              bookingId: booking.id,
                              status: 'confirmed'
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Confirmar' : 'Confirm'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateBookingMutation.mutate({
                              bookingId: booking.id,
                              status: 'cancelled'
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Recusar' : 'Decline'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({
                              bookingId: booking.id,
                              status: 'in_progress'
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Iniciar Serviço' : 'Start Service'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'in_progress' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({
                              bookingId: booking.id,
                              status: 'completed'
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Marcar como Completo' : 'Mark Complete'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 md:p-4 mt-4">
                          <p className="text-green-700 font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                            {language === 'pt' ? 'Serviço concluído!' : 'Service completed!'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Services Management Card */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  {language === 'pt' ? 'Seus Serviços' : 'Your Services'}
                </h3>
                <p className="text-sm md:text-base text-white/90">
                  {language === 'pt'
                    ? `${services.length} ${services.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`
                    : `${services.length} ${services.length === 1 ? 'service listed' : 'services listed'}`
                  }
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 font-bold shadow-xl h-10 md:h-12 text-sm md:text-base"
                onClick={() => navigate('/messages')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {language === 'pt' ? 'Ver Mensagens' : 'View Messages'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" />
              {language === 'pt' ? 'Agendar Recolha/Entrega' : 'Schedule Pickup/Dropoff'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Recolha do Animal' : 'Pickup'}</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Entrega do Animal' : 'Dropoff'}</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dropoffDate}
                  onChange={(e) => setDropoffDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={dropoffTime}
                  onChange={(e) => setDropoffTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              onClick={() => saveScheduleMutation.mutate(currentModalBooking?.id)}
              disabled={saveScheduleMutation.isPending || (pickupDate === "" && pickupTime === "" && dropoffDate === "" && dropoffTime === "")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saveScheduleMutation.isPending ? (language === 'pt' ? 'Salvando...' : 'Saving...') : (language === 'pt' ? 'Salvar Horários' : 'Save Schedule')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photos Modal */}
      <Dialog open={showPhotosModal} onOpenChange={setShowPhotosModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              {language === 'pt' ? 'Fotos do Serviço' : 'Service Photos'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="before_photos_upload" className="mb-2 block">{language === 'pt' ? 'Fotos Antes' : 'Before Photos'}</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {beforePhotos.map((url, idx) => (
                  <img key={idx} src={url} alt={`Before ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>
              <Input
                id="before_photos_upload" // Added ID for label association
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'before')}
                disabled={uploadPhotoMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="after_photos_upload" className="mb-2 block">{language === 'pt' ? 'Fotos Depois' : 'After Photos'}</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {afterPhotos.map((url, idx) => (
                  <img key={idx} src={url} alt={`After ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>
              <Input
                id="after_photos_upload" // Added ID for label association
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'after')}
                disabled={uploadPhotoMutation.isPending}
              />
            </div>
            <Button
              onClick={() => savePhotosMutation.mutate(currentModalBooking?.id)}
              disabled={savePhotosMutation.isPending || (beforePhotos.length === 0 && afterPhotos.length === 0 && (currentModalBooking?.before_photos?.length || 0) === 0 && (currentModalBooking?.after_photos?.length || 0) === 0)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {savePhotosMutation.isPending ? (language === 'pt' ? 'Salvando...' : 'Saving...') : (language === 'pt' ? 'Salvar Fotos' : 'Save Photos')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              {language === 'pt' ? 'Notas do Serviço' : 'Service Notes'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder={language === 'pt' ? "Adicione observações sobre o serviço..." : "Add observations about the service..."}
              rows={6}
            />
            <Button
              onClick={() => saveNotesMutation.mutate(currentModalBooking?.id)}
              disabled={saveNotesMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {saveNotesMutation.isPending ? (language === 'pt' ? 'Salvando...' : 'Saving...') : (language === 'pt' ? 'Salvar Notas' : 'Save Notes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Create Service Modal */}
      <Dialog open={showCreateServiceModal} onOpenChange={setShowCreateServiceModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-blue-600" />
              {language === 'pt' ? 'Criar Novo Serviço' : 'Create New Service'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Nome do Serviço' : 'Service Name'} *</Label>
                <Input
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                  placeholder={language === 'pt' ? "Banho Completo" : "Complete Bath"}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Tipo de Serviço' : 'Service Type'} *</Label>
                <Select
                  value={newService.service_type}
                  onValueChange={(value) => setNewService({ ...newService, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bath">🛁 Banho</SelectItem>
                    <SelectItem value="grooming">✂️ Grooming</SelectItem>
                    <SelectItem value="veterinary">🏥 Veterinário</SelectItem>
                    <SelectItem value="vaccination">💉 Vacinação</SelectItem>
                    <SelectItem value="checkup">🩺 Check-up</SelectItem>
                    <SelectItem value="emergency">🚨 Emergência</SelectItem>
                    <SelectItem value="daycare">🏠 Daycare</SelectItem>
                    <SelectItem value="boarding">🛏️ Alojamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Descrição' : 'Description'}</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                rows={3}
                placeholder={language === 'pt' ? "Descreva o serviço..." : "Describe the service..."}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Duração (minutos)' : 'Duration (minutes)'}</Label>
                <Input
                  type="number"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Preço Base (€)' : 'Base Price (€)'} *</Label>
                <Input
                  type="text"
                  value={newService.base_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                    setNewService({ ...newService, base_price: value });
                  }}
                  placeholder="25.00"
                />
                <p className="text-xs text-gray-500">{language === 'pt' ? 'Digite apenas números (ex: 25 ou 25.50)' : 'Enter numbers only (ex: 25 or 25.50)'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'O que está incluído?' : 'What\'s included?'}</Label>
              <div className="flex flex-wrap gap-2">
                {['Shampoo', 'Condicionador', 'Secagem', 'Corte de Unhas', 'Limpeza de Ouvidos', 'Escovagem'].map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newService.includes?.includes(item)}
                      onCheckedChange={() => toggleInclude(item)}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <Checkbox
                checked={newService.is_emergency}
                onCheckedChange={(checked) => setNewService({ ...newService, is_emergency: checked })}
              />
              <div className="flex-1">
                <Label className="text-orange-900">
                  🚨 {language === 'pt' ? 'Serviço de Emergência 24/7' : 'Emergency Service 24/7'}
                </Label>
                {newService.is_emergency && (
                  <Input
                    type="text"
                    value={newService.emergency_surcharge}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      setNewService({ ...newService, emergency_surcharge: value });
                    }}
                    placeholder={language === 'pt' ? "Taxa adicional (€)" : "Additional fee (€)"}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Imagem do Serviço' : 'Service Image'}</Label>
              {newService.image_url && (
                <img src={newService.image_url} className="w-full h-32 object-cover rounded-lg mb-2" alt="Service preview" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadServiceImageMutation.mutate(file);
                }}
                disabled={uploadServiceImageMutation.isPending}
              />
            </div>

            <Button
              onClick={() => {
                if (!newService.service_name || !newService.base_price) {
                  toast.error(language === 'pt' ? 'Preencha o nome e preço do serviço!' : 'Fill in service name and price!');
                  return;
                }
                createServiceMutation.mutate(newService);
              }}
              disabled={createServiceMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            >
              {createServiceMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'pt' ? 'Criando...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'pt' ? 'Criar Serviço' : 'Create Service'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Create Announcement Modal */}
      <Dialog open={showCreateAnnouncementModal} onOpenChange={setShowCreateAnnouncementModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Megaphone className="w-6 h-6 text-purple-600" />
              {language === 'pt' ? 'Criar Novo Anúncio' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Título' : 'Title'} *</Label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder={language === 'pt' ? "Super Desconto de Verão!" : "Summer Super Discount!"}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Mensagem' : 'Message'} *</Label>
              <Textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                rows={4}
                placeholder={language === 'pt' ? "Descreva a promoção..." : "Describe the promotion..."}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Tipo de Promoção' : 'Promotion Type'}</Label>
                <Select
                  value={newAnnouncement.promotion_type}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, promotion_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">🏷️ Desconto</SelectItem>
                    <SelectItem value="flash_sale">⚡ Flash Sale</SelectItem>
                    <SelectItem value="new_product">🆕 Novo Produto</SelectItem>
                    <SelectItem value="points_bonus">⭐ Bónus Pontos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Desconto (%)' : 'Discount (%)'}</Label>
                <Input
                  type="text"
                  value={newAnnouncement.discount_percentage}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setNewAnnouncement({ ...newAnnouncement, discount_percentage: value });
                  }}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Data Início' : 'Start Date'} *</Label>
                <Input
                  type="date"
                  value={newAnnouncement.start_date}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Data Fim' : 'End Date'} *</Label>
                <Input
                  type="date"
                  value={newAnnouncement.end_date}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Imagem da Promoção' : 'Promotion Image'}</Label>
              {newAnnouncement.image_url && (
                <img src={newAnnouncement.image_url} className="w-full h-48 object-cover rounded-lg mb-2" alt="Announcement preview" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAnnouncementImageMutation.mutate(file);
                }}
                disabled={uploadAnnouncementImageMutation.isPending}
              />
            </div>

            <Button
              onClick={() => {
                if (!newAnnouncement.title || !newAnnouncement.start_date || !newAnnouncement.end_date) {
                  toast.error(language === 'pt' ? 'Preencha todos os campos obrigatórios!' : 'Fill in all required fields!');
                  return;
                }
                createAnnouncementMutation.mutate(newAnnouncement);
              }}
              disabled={createAnnouncementMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-bold"
            >
              {createAnnouncementMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'pt' ? 'Criando...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'pt' ? 'Criar Anúncio' : 'Create Announcement'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Services List Modal */}
      <Dialog open={showServicesListModal} onOpenChange={setShowServicesListModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-blue-600" />
              {language === 'pt' ? 'Meus Serviços' : 'My Services'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myServices.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{language === 'pt' ? 'Nenhum serviço criado' : 'No services created'}</p>
              </div>
            ) : (
              myServices.map(service => (
                <Card key={service.id} className={`border-2 ${
                  service.moderation_status === 'approved' ? 'border-green-300 bg-green-50' :
                  service.moderation_status === 'rejected' ? 'border-red-300 bg-red-50' :
                  'border-yellow-300 bg-yellow-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-lg">{service.service_name}</h3>
                          {service.is_emergency && (
                            <Badge className="bg-orange-500 text-white">24/7</Badge>
                          )}
                          <Badge className={
                            service.moderation_status === 'approved' ? 'bg-green-600 text-white' :
                            service.moderation_status === 'rejected' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }>
                            {service.moderation_status === 'approved' ? '✓ Aprovado' :
                             service.moderation_status === 'rejected' ? '✗ Rejeitado' :
                             '⏳ Pendente Aprovação'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-2xl font-bold text-blue-600">€{service.base_price}</div>
                          <div className="text-sm text-gray-600">{service.duration_minutes}min</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditServiceModal(service)}
                        className="border-blue-300 text-blue-600"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'pt' ? 'Editar' : 'Edit'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{service.description}</p>
                    {service.rejection_reason && (
                      <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>{language === 'pt' ? 'Motivo da rejeição:' : 'Rejection reason:'}</strong> {service.rejection_reason}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {language === 'pt' ? 'Edite o serviço e reenvie para aprovação.' : 'Edit the service and resubmit for approval.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Announcements List Modal */}
      <Dialog open={showAnnouncementsListModal} onOpenChange={setShowAnnouncementsListModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Megaphone className="w-6 h-6 text-purple-600" />
              {language === 'pt' ? 'Meus Anúncios' : 'My Announcements'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{language === 'pt' ? 'Nenhum anúncio criado' : 'No announcements created'}</p>
              </div>
            ) : (
              myAnnouncements.map(announcement => (
                <Card key={announcement.id} className={`border-2 ${
                  announcement.moderation_status === 'approved' ? 'border-green-300 bg-green-50' :
                  announcement.moderation_status === 'rejected' ? 'border-red-300 bg-red-50' :
                  'border-yellow-300 bg-yellow-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {announcement.image_url && (
                        <img src={announcement.image_url} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" alt="Announcement" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-lg">{announcement.title}</h3>
                          {announcement.discount_percentage > 0 && (
                            <Badge className="bg-red-500 text-white">-{announcement.discount_percentage}%</Badge>
                          )}
                          <Badge className={
                            announcement.moderation_status === 'approved' ? 'bg-green-600 text-white' :
                            announcement.moderation_status === 'rejected' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }>
                            {announcement.moderation_status === 'approved' ? '✓ Aprovado' :
                             announcement.moderation_status === 'rejected' ? '✗ Rejeitado' :
                             '⏳ Pendente Aprovação'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{announcement.message}</p>
                        <div className="flex gap-3 text-xs text-gray-600 mt-2 flex-wrap">
                          <span>📅 {announcement.start_date} → {announcement.end_date}</span>
                          <span>👁️ {announcement.views_count || 0} views</span>
                          <span>🖱️ {announcement.clicks_count || 0} clicks</span>
                        </div>
                        {announcement.moderation_notes && (
                          <div className="mt-3 bg-blue-100 border border-blue-300 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>{language === 'pt' ? 'Notas do Admin:' : 'Admin Notes:'}</strong> {announcement.moderation_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditAnnouncementModal(announcement)}
                        className="border-purple-300 text-purple-600 flex-shrink-0"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'pt' ? 'Editar' : 'Edit'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Edit Service Modal */}
      <Dialog open={showEditServiceModal} onOpenChange={setShowEditServiceModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-blue-600" />
              {language === 'pt' ? 'Editar Serviço' : 'Edit Service'}
            </DialogTitle>
            {editingService?.moderation_status === 'approved' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-yellow-800">
                  ⚠️ {language === 'pt'
                    ? 'Este serviço já está aprovado. Ao editar, será necessário nova aprovação do admin.'
                    : 'This service is already approved. After editing, it will require new admin approval.'}
                </p>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as Create Service Modal */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Nome do Serviço' : 'Service Name'} *</Label>
                <Input
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                  placeholder={language === 'pt' ? "Banho Completo" : "Complete Bath"}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Tipo de Serviço' : 'Service Type'} *</Label>
                <Select
                  value={newService.service_type}
                  onValueChange={(value) => setNewService({ ...newService, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bath">🛁 Banho</SelectItem>
                    <SelectItem value="grooming">✂️ Grooming</SelectItem>
                    <SelectItem value="veterinary">🏥 Veterinário</SelectItem>
                    <SelectItem value="vaccination">💉 Vacinação</SelectItem>
                    <SelectItem value="checkup">🩺 Check-up</SelectItem>
                    <SelectItem value="emergency">🚨 Emergência</SelectItem>
                    <SelectItem value="daycare">🏠 Daycare</SelectItem>
                    <SelectItem value="boarding">🛏️ Alojamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Descrição' : 'Description'}</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                rows={3}
                placeholder={language === 'pt' ? "Descreva o serviço..." : "Describe the service..."}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Duração (minutos)' : 'Duration (minutes)'}</Label>
                <Input
                  type="number"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Preço Base (€)' : 'Base Price (€)'} *</Label>
                <Input
                  type="text"
                  value={newService.base_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                    setNewService({ ...newService, base_price: value });
                  }}
                  placeholder="25.00"
                />
                <p className="text-xs text-gray-500">{language === 'pt' ? 'Digite apenas números (ex: 25 ou 25.50)' : 'Enter numbers only (ex: 25 or 25.50)'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Preços por Tamanho (€)' : 'Prices by Size (€)'}</Label>
              <p className="text-xs text-gray-600 mb-2">{language === 'pt' ? 'Opcional - se deixar vazio, usará o preço base' : 'Optional - if left empty, will use base price'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['small', 'medium', 'large', 'extra_large'].map(size => (
                  <div key={size}>
                    <Label className="text-xs capitalize">{size.replace('_', ' ')}</Label>
                    <Input
                      type="text"
                      value={newService.price_by_size[size]}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                        setNewService({
                          ...newService,
                          price_by_size: { ...newService.price_by_size, [size]: value }
                        });
                      }}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'O que está incluído?' : 'What\'s included?'}</Label>
              <div className="flex flex-wrap gap-2">
                {['Shampoo', 'Condicionador', 'Secagem', 'Corte de Unhas', 'Limpeza de Ouvidos', 'Escovagem'].map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newService.includes?.includes(item)}
                      onCheckedChange={() => toggleInclude(item)}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <Checkbox
                checked={newService.is_emergency}
                onCheckedChange={(checked) => setNewService({ ...newService, is_emergency: checked })}
              />
              <div className="flex-1">
                <Label className="text-orange-900">
                  🚨 {language === 'pt' ? 'Serviço de Emergência 24/7' : 'Emergency Service 24/7'}
                </Label>
                {newService.is_emergency && (
                  <Input
                    type="text"
                    value={newService.emergency_surcharge}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      setNewService({ ...newService, emergency_surcharge: value });
                    }}
                    placeholder={language === 'pt' ? "Taxa adicional (€)" : "Additional fee (€)"}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Imagem do Serviço' : 'Service Image'}</Label>
              {newService.image_url && (
                <img src={newService.image_url} className="w-full h-32 object-cover rounded-lg mb-2" alt="Service" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadServiceImageMutation.mutate(file);
                }}
                disabled={uploadServiceImageMutation.isPending}
              />
            </div>

            <Button
              onClick={() => {
                if (!newService.service_name || !newService.base_price) {
                  toast.error(language === 'pt' ? 'Preencha o nome e preço do serviço!' : 'Fill in service name and price!');
                  return;
                }
                updateServiceMutation.mutate({
                  serviceId: editingService.id,
                  serviceData: newService
                });
              }}
              disabled={updateServiceMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            >
              {updateServiceMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'pt' ? 'Atualizando...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'pt' ? 'Atualizar Serviço' : 'Update Service'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Edit Announcement Modal */}
      <Dialog open={showEditAnnouncementModal} onOpenChange={setShowEditAnnouncementModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Megaphone className="w-6 h-6 text-purple-600" />
              {language === 'pt' ? 'Editar Anúncio' : 'Edit Announcement'}
            </DialogTitle>
            {editingAnnouncement?.moderation_status === 'approved' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-yellow-800">
                  ⚠️ {language === 'pt'
                    ? 'Este anúncio já está aprovado. Ao editar, será necessário nova aprovação do admin.'
                    : 'This announcement is already approved. After editing, it will require new admin approval.'}
                </p>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as Create Announcement Modal */}
            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Título' : 'Title'} *</Label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder={language === 'pt' ? "Super Desconto de Verão!" : "Summer Super Discount!"}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Mensagem' : 'Message'} *</Label>
              <Textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                rows={4}
                placeholder={language === 'pt' ? "Descreva a promoção..." : "Describe the promotion..."}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Tipo de Promoção' : 'Promotion Type'}</Label>
                <Select
                  value={newAnnouncement.promotion_type}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, promotion_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">🏷️ Desconto</SelectItem>
                    <SelectItem value="flash_sale">⚡ Flash Sale</SelectItem>
                    <SelectItem value="new_product">🆕 Novo Produto</SelectItem>
                    <SelectItem value="points_bonus">⭐ Bónus Pontos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Desconto (%)' : 'Discount (%)'}</Label>
                <Input
                  type="text"
                  value={newAnnouncement.discount_percentage}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setNewAnnouncement({ ...newAnnouncement, discount_percentage: value });
                  }}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Data Início' : 'Start Date'} *</Label>
                <Input
                  type="date"
                  value={newAnnouncement.start_date}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'pt' ? 'Data Fim' : 'End Date'} *</Label>
                <Input
                  type="date"
                  value={newAnnouncement.end_date}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'pt' ? 'Imagem da Promoção' : 'Promotion Image'}</Label>
              {newAnnouncement.image_url && (
                <img src={newAnnouncement.image_url} className="w-full h-48 object-cover rounded-lg mb-2" alt="Announcement" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAnnouncementImageMutation.mutate(file);
                }}
                disabled={uploadAnnouncementImageMutation.isPending}
              />
            </div>

            <Button
              onClick={() => {
                if (!newAnnouncement.title || !newAnnouncement.start_date || !newAnnouncement.end_date) {
                  toast.error(language === 'pt' ? 'Preencha todos os campos obrigatórios!' : 'Fill in all required fields!');
                  return;
                }
                updateAnnouncementMutation.mutate({
                  announcementId: editingAnnouncement.id,
                  announcementData: newAnnouncement
                });
              }}
              disabled={updateAnnouncementMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-bold"
            >
              {updateAnnouncementMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'pt' ? 'Atualizando...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'pt' ? 'Atualizar Anúncio' : 'Update Announcement'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
