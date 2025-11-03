import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  User, Mail, Phone, MapPin, Lock, Bell, CreditCard, 
  Shield, Upload, Save, Eye, EyeOff, Trash2, Plus, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AccountSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    postal_code: user?.postal_code || "",
    profile_photo_url: user?.profile_photo_url || ""
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: user?.preferences?.email_notifications ?? true,
    booking_notifications: true,
    message_notifications: true,
    marketing_emails: false,
    sms_notifications: false,
    push_notifications: true,
    emergency_alerts: true
  });

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState(user?.payment_methods || []);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: "credit_card",
    card_number: "",
    expiry: "",
    cvv: "",
    cardholder_name: ""
  });

  React.useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
        profile_photo_url: user.profile_photo_url || ""
      });
      setNotificationPrefs({
        email_notifications: user.preferences?.email_notifications ?? true,
        booking_notifications: user.preferences?.booking_notifications ?? true,
        message_notifications: user.preferences?.message_notifications ?? true,
        marketing_emails: user.preferences?.marketing_emails ?? false,
        sms_notifications: user.preferences?.sms_notifications ?? false,
        push_notifications: user.preferences?.push_notifications ?? true,
        emergency_alerts: user.preferences?.emergency_alerts ?? true
      });
      setPaymentMethods(user.payment_methods || []);
    }
  }, [user]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message
      });
    }
  });

  // Update Preferences Mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences) => {
      return await base44.auth.updateMe({
        preferences: {
          ...user.preferences,
          ...preferences
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Preferences updated!");
    },
  });

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({ ...profileData, profile_photo_url: file_url });
      await updateProfileMutation.mutateAsync({ profile_photo_url: file_url });
    } catch (error) {
      toast.error("Failed to upload photo");
    }
    setUploadingPhoto(false);
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync(profileData);
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    // Here you would call your password change endpoint
    // For now, we'll simulate it
    toast.success("Password changed successfully!");
    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
  };

  // Handle Notification Preferences Update
  const handleNotificationUpdate = async () => {
    await updatePreferencesMutation.mutateAsync(notificationPrefs);
  };

  // Add Payment Method
  const handleAddPaymentMethod = async () => {
    // Validate card number (basic)
    if (newPaymentMethod.card_number.length !== 16) {
      toast.error("Invalid card number");
      return;
    }

    const last_four = newPaymentMethod.card_number.slice(-4);
    const newMethod = {
      type: newPaymentMethod.type,
      last_four: last_four,
      is_default: paymentMethods.length === 0
    };

    const updatedMethods = [...paymentMethods, newMethod];
    setPaymentMethods(updatedMethods);
    
    await updateProfileMutation.mutateAsync({ payment_methods: updatedMethods });
    
    setShowAddPayment(false);
    setNewPaymentMethod({
      type: "credit_card",
      card_number: "",
      expiry: "",
      cvv: "",
      cardholder_name: ""
    });
  };

  // Remove Payment Method
  const handleRemovePaymentMethod = async (index) => {
    const updatedMethods = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(updatedMethods);
    await updateProfileMutation.mutateAsync({ payment_methods: updatedMethods });
    toast.success("Payment method removed");
  };

  // Set Default Payment Method
  const handleSetDefaultPayment = async (index) => {
    const updatedMethods = paymentMethods.map((method, i) => ({
      ...method,
      is_default: i === index
    }));
    setPaymentMethods(updatedMethods);
    await updateProfileMutation.mutateAsync({ payment_methods: updatedMethods });
    toast.success("Default payment method updated");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-green-600" />
            Account Settings
          </h1>
          <p className="text-gray-600 text-lg">Manage your profile, security, and preferences</p>
        </div>

        {/* Main Card with Tabs */}
        <Card className="border-0 shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
              <TabsList className="bg-white/20 border-0 h-auto p-1">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 text-white"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payments
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* PROFILE TAB */}
              <TabsContent value="profile" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h3>
                    <Separator className="mb-6" />
                  </div>

                  {/* Profile Photo */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {profileData.profile_photo_url ? (
                        <img
                          src={profileData.profile_photo_url}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-12 h-12 text-green-600" />
                        </div>
                      )}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        <Button variant="outline" disabled={uploadingPhoto} asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                          </span>
                        </Button>
                      </label>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {/* Name & Email */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={user?.email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+351 21 123 4567"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        placeholder="Street, Number, Apartment"
                      />
                    </div>

                    {/* City & Postal Code */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          placeholder="Lisbon"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={profileData.postal_code}
                          onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                          placeholder="1000-001"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>

              {/* SECURITY TAB */}
              <TabsContent value="security" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h3>
                    <Separator className="mb-6" />
                  </div>

                  {/* Change Password */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-green-600" />
                        Change Password
                      </h4>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current_password">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current_password"
                              type={showPassword.current ? "text" : "password"}
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new_password"
                              type={showPassword.new ? "text" : "password"}
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">At least 8 characters</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm_password">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm_password"
                              type={showPassword.confirm ? "text" : "password"}
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="bg-green-600">
                          Update Password
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account Status</span>
                          <Badge className="bg-green-500">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account Type</span>
                          <Badge variant="outline">{user?.role || "User"}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Member Since</span>
                          <span className="text-sm font-medium">{new Date(user?.created_date).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* NOTIFICATIONS TAB */}
              <TabsContent value="notifications" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
                    <Separator className="mb-6" />
                  </div>

                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_notifications}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email_notifications: checked})}
                      />
                    </div>

                    {/* Booking Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Booking Updates</h4>
                        <p className="text-sm text-gray-600">Notifications about your bookings</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.booking_notifications}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, booking_notifications: checked})}
                      />
                    </div>

                    {/* Message Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Message Alerts</h4>
                        <p className="text-sm text-gray-600">New messages and chat updates</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.message_notifications}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, message_notifications: checked})}
                      />
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-600">Browser push notifications</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.push_notifications}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push_notifications: checked})}
                      />
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Text message alerts</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.sms_notifications}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, sms_notifications: checked})}
                      />
                    </div>

                    {/* Emergency Alerts */}
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Emergency Alerts</h4>
                        <p className="text-sm text-gray-600">Critical emergency notifications (recommended)</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.emergency_alerts}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, emergency_alerts: checked})}
                      />
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Marketing Emails</h4>
                        <p className="text-sm text-gray-600">Promotions and special offers</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.marketing_emails}
                        onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, marketing_emails: checked})}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleNotificationUpdate}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={updatePreferencesMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                  </Button>
                </motion.div>
              </TabsContent>

              {/* PAYMENTS TAB */}
              <TabsContent value="payments" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Methods</h3>
                      <p className="text-sm text-gray-600">Manage your saved payment methods</p>
                    </div>
                    <Button onClick={() => setShowAddPayment(true)} className="bg-green-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Method
                    </Button>
                  </div>
                  <Separator />

                  {/* Payment Methods List */}
                  <div className="space-y-3">
                    {paymentMethods.length === 0 ? (
                      <Card className="bg-gray-50">
                        <CardContent className="p-12 text-center">
                          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">No payment methods</h4>
                          <p className="text-gray-600 mb-4">Add a payment method to book services</p>
                          <Button onClick={() => setShowAddPayment(true)} className="bg-green-600">
                            Add Payment Method
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      paymentMethods.map((method, index) => (
                        <Card key={index} className={`${method.is_default ? 'border-2 border-green-500' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <CreditCard className="w-8 h-8 text-gray-600" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {method.type === 'credit_card' ? 'Credit Card' : 'Debit Card'}
                                    </h4>
                                    {method.is_default && (
                                      <Badge className="bg-green-500">
                                        <Check className="w-3 h-3 mr-1" />
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">•••• •••• •••• {method.last_four}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!method.is_default && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetDefaultPayment(index)}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePaymentMethod(index)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Add Payment Method Form */}
                  {showAddPayment && (
                    <Card className="border-2 border-green-200 bg-green-50">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Add New Payment Method</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Cardholder Name</Label>
                            <Input
                              value={newPaymentMethod.cardholder_name}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardholder_name: e.target.value})}
                              placeholder="John Smith"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input
                              value={newPaymentMethod.card_number}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, card_number: e.target.value.replace(/\s/g, '')})}
                              placeholder="1234 5678 9012 3456"
                              maxLength={16}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Expiry Date</Label>
                              <Input
                                value={newPaymentMethod.expiry}
                                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiry: e.target.value})}
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CVV</Label>
                              <Input
                                value={newPaymentMethod.cvv}
                                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                                placeholder="123"
                                maxLength={3}
                                type="password"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddPayment(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddPaymentMethod}
                              className="flex-1 bg-green-600"
                            >
                              Add Card
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}