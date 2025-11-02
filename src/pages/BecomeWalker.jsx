import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dog, Upload, DollarSign, Shield, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BecomeWalker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({
    photo: false,
    id: false,
    background: false,
    address: false
  });
  
  const [formData, setFormData] = useState({
    walker_name: "",
    photo_url: "",
    bio: "",
    location: "",
    hourly_rate: "",
    experience_years: "",
    phone: "",
    dog_sizes: [],
    availability: [],
    id_document_url: "",
    background_check_url: "",
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  const createWalkerMutation = useMutation({
    mutationFn: (data) => base44.entities.WalkerProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      navigate(createPageUrl('Home'));
    },
  });

  const handleFileUpload = async (e, fieldName, uploadingKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setUploading(prev => ({ ...prev, [uploadingKey]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createWalkerMutation.mutateAsync({
      ...formData,
      hourly_rate: parseFloat(formData.hourly_rate),
      experience_years: parseFloat(formData.experience_years),
      verification_status: "pending"
    });
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dog className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Become a Walker</h1>
          <p className="text-gray-600 text-lg">Start earning by walking dogs in your neighborhood</p>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Safety & Trust:</strong> All walkers must submit official documents for verification. 
            This protects dog owners and builds trust in our community. Your documents will be reviewed within 24-48 hours.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-2xl">Create Your Walker Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo *</Label>
                <div className="flex items-center gap-4">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="w-32 h-32 rounded-xl object-cover border-4 border-green-100"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-200">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo_url', 'photo')}
                      disabled={uploading.photo}
                      className="cursor-pointer"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {uploading.photo ? "Uploading..." : "Upload a friendly photo of yourself"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="walker_name">Your Name *</Label>
                  <Input
                    id="walker_name"
                    required
                    value={formData.walker_name}
                    onChange={(e) => setFormData({...formData, walker_name: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Brooklyn, NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    placeholder="25"
                  />
                  <p className="text-xs text-gray-500">Note: Platform takes 15% commission</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                    placeholder="3"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell potential clients about your experience with dogs, your approach to dog walking, and why you love dogs..."
                  rows={5}
                />
              </div>

              {/* Dog Sizes & Availability */}
              <div className="space-y-3">
                <Label>Dog Sizes You Can Handle *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                    { value: "extra_large", label: "Extra Large" },
                  ].map(size => (
                    <div key={size.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size.value}`}
                        checked={formData.dog_sizes.includes(size.value)}
                        onCheckedChange={() => toggleArrayItem('dog_sizes', size.value)}
                      />
                      <label htmlFor={`size-${size.value}`} className="text-sm font-medium cursor-pointer">
                        {size.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Your Availability *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "morning", label: "Morning" },
                    { value: "afternoon", label: "Afternoon" },
                    { value: "evening", label: "Evening" },
                    { value: "night", label: "Night" },
                  ].map(time => (
                    <div key={time.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`time-${time.value}`}
                        checked={formData.availability.includes(time.value)}
                        onCheckedChange={() => toggleArrayItem('availability', time.value)}
                      />
                      <label htmlFor={`time-${time.value}`} className="text-sm font-medium cursor-pointer">
                        {time.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Documents */}
              <div className="border-t-2 border-green-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Verification Documents *</h3>
                </div>
                <p className="text-gray-600 mb-6">Upload official documents to verify your identity and ensure safety</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="id_document">Government-Issued ID * (Driver's License, Passport, etc.)</Label>
                    <Input
                      id="id_document"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                      disabled={uploading.id}
                      required
                    />
                    {formData.id_document_url && <p className="text-sm text-green-600">✓ Document uploaded</p>}
                    {uploading.id && <p className="text-sm text-gray-500">Uploading...</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background_check">Background Check Document</Label>
                    <Input
                      id="background_check"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'background_check_url', 'background')}
                      disabled={uploading.background}
                    />
                    {formData.background_check_url && <p className="text-sm text-green-600">✓ Document uploaded</p>}
                    {uploading.background && <p className="text-sm text-gray-500">Uploading...</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof_of_address">Proof of Address * (Utility bill, lease agreement, etc.)</Label>
                    <Input
                      id="proof_of_address"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                      disabled={uploading.address}
                      required
                    />
                    {formData.proof_of_address_url && <p className="text-sm text-green-600">✓ Document uploaded</p>}
                    {uploading.address && <p className="text-sm text-gray-500">Uploading...</p>}
                  </div>
                </div>
              </div>

              {/* Banking Info */}
              <div className="border-t-2 border-green-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Payment Information *</h3>
                </div>
                <p className="text-gray-600 mb-6">Where you'll receive your earnings (minus 15% platform fee)</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bank_account_holder">Account Holder Name *</Label>
                    <Input
                      id="bank_account_holder"
                      required
                      value={formData.bank_account_holder}
                      onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Bank Account Number *</Label>
                    <Input
                      id="bank_account_number"
                      required
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_routing_number">Routing Number *</Label>
                    <Input
                      id="bank_routing_number"
                      required
                      value={formData.bank_routing_number}
                      onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                      placeholder="021000021"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createWalkerMutation.isPending || Object.values(uploading).some(v => v)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                >
                  {createWalkerMutation.isPending ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}