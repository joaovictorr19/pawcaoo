import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Upload, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BecomeTrainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({
    photo: false,
    id: false,
    background: false,
    address: false,
    certificates: {}
  });
  
  const [formData, setFormData] = useState({
    trainer_name: "",
    photo_url: "",
    bio: "",
    location: "",
    hourly_rate: "",
    experience_years: "",
    phone: "",
    training_specialties: [],
    dog_sizes: [],
    consultation_options: [],
    availability: [],
    languages: [],
    certifications: [],
    id_document_url: "",
    background_check_url: "",
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  const createTrainerMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainerProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      navigate(createPageUrl('Trainers'));
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

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: "", issuing_organization: "", year: "", certificate_url: "" }]
    });
  };

  const updateCertification = (index, field, value) => {
    const updated = [...formData.certifications];
    updated[index][field] = value;
    setFormData({ ...formData, certifications: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTrainerMutation.mutateAsync({
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Become a Certified Trainer</h1>
          <p className="text-gray-600 text-lg">Join our network of professional dog trainers</p>
        </div>

        <Alert className="mb-6 border-purple-200 bg-purple-50">
          <Shield className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Professional Standards:</strong> All trainers must submit certifications and documents for verification. 
            This ensures quality training for all dogs on our platform.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
            <CardTitle className="text-2xl">Create Your Trainer Profile</CardTitle>
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
                      className="w-32 h-32 rounded-xl object-cover border-4 border-purple-100"
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
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {uploading.photo ? "Uploading..." : "Upload a professional photo"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trainer_name">Your Name *</Label>
                  <Input
                    id="trainer_name"
                    required
                    value={formData.trainer_name}
                    onChange={(e) => setFormData({...formData, trainer_name: e.target.value})}
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
                    placeholder="+351 21 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Lisbon, Portugal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (€) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience *</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    required
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio *</Label>
                <Textarea
                  id="bio"
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Describe your training philosophy, methods, and what makes you unique..."
                  rows={5}
                />
              </div>

              {/* Training Specialties */}
              <div className="space-y-3">
                <Label>Training Specialties *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: "basic_obedience", label: "Basic Obedience" },
                    { value: "behavior_modification", label: "Behavior Modification" },
                    { value: "puppy_training", label: "Puppy Training" },
                    { value: "aggression", label: "Aggression" },
                    { value: "anxiety", label: "Anxiety & Fear" },
                    { value: "socialization", label: "Socialization" },
                  ].map(specialty => (
                    <div key={specialty.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty.value}`}
                        checked={formData.training_specialties.includes(specialty.value)}
                        onCheckedChange={() => toggleArrayItem('training_specialties', specialty.value)}
                      />
                      <label htmlFor={`specialty-${specialty.value}`} className="text-sm font-medium cursor-pointer">
                        {specialty.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Options */}
              <div className="space-y-3">
                <Label>Consultation Methods *</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "in_person", label: "In-Person" },
                    { value: "online", label: "Online" },
                    { value: "hybrid", label: "Hybrid" },
                  ].map(method => (
                    <div key={method.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method-${method.value}`}
                        checked={formData.consultation_options.includes(method.value)}
                        onCheckedChange={() => toggleArrayItem('consultation_options', method.value)}
                      />
                      <label htmlFor={`method-${method.value}`} className="text-sm font-medium cursor-pointer">
                        {method.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="border-t-2 border-purple-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="w-6 h-6 text-purple-600" />
                    Professional Certifications
                  </h3>
                  <Button type="button" variant="outline" onClick={addCertification}>
                    Add Certification
                  </Button>
                </div>
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="bg-purple-50 rounded-lg p-4 mb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Certification Name"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Issuing Organization"
                        value={cert.issuing_organization}
                        onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Year"
                        value={cert.year}
                        onChange={(e) => updateCertification(index, 'year', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Verification Documents */}
              <div className="border-t-2 border-purple-100 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Verification Documents *
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Government ID *</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                      disabled={uploading.id}
                      required
                    />
                    {formData.id_document_url && <p className="text-sm text-green-600">✓ Uploaded</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Proof of Address *</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                      disabled={uploading.address}
                      required
                    />
                    {formData.proof_of_address_url && <p className="text-sm text-green-600">✓ Uploaded</p>}
                  </div>
                </div>
              </div>

              {/* Banking Info */}
              <div className="border-t-2 border-purple-100 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Information *</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Account Holder Name *</Label>
                    <Input
                      required
                      value={formData.bank_account_holder}
                      onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Account Number *</Label>
                    <Input
                      required
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Routing Number *</Label>
                    <Input
                      required
                      value={formData.bank_routing_number}
                      onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Trainers'))}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTrainerMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  {createTrainerMutation.isPending ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}