import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, CreditCard, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TimeSlotPicker from "./TimeSlotPicker";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const PLATFORM_FEE_PERCENTAGE = 15;

export default function BookingForm({ walker, trainer, onSubmit, onCancel, isProcessing }) {
  const professional = walker || trainer;
  const professionalType = walker ? 'walker' : 'trainer';
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    owner_name: "",
    owner_phone: "",
    dog_name: "",
    dog_size: "",
    duration_hours: 1,
    special_notes: "",
    payment_method: "credit_card",
  });

  const { data: availability } = useQuery({
    queryKey: ['professionalAvailability', professional.created_by],
    queryFn: () => base44.entities.CalendarAvailability.filter({ 
      professional_email: professional.created_by 
    }),
    enabled: !!professional,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['professionalBookings', professional.id],
    queryFn: async () => {
      if (walker) {
        return await base44.entities.Booking.filter({ walker_id: professional.id });
      } else {
        return await base44.entities.TrainingBooking.filter({ trainer_id: professional.id });
      }
    },
    enabled: !!professional,
    initialData: [],
  });

  const serviceAmount = formData.duration_hours * professional.hourly_rate;
  const platformFee = serviceAmount * (PLATFORM_FEE_PERCENTAGE / 100);
  const totalAmount = serviceAmount + platformFee;

  const handleSlotSelect = (date, slot) => {
    setSelectedDate(date);
    if (slot) {
      setSelectedSlot(`${slot.start_time}-${slot.end_time}`);
    } else {
      setSelectedSlot(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedSlot) {
      alert("Please select a date and time slot");
      return;
    }

    onSubmit({
      ...formData,
      walk_date: format(selectedDate, 'yyyy-MM-dd'),
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      walk_time: selectedSlot,
      session_time: selectedSlot,
      service_amount: serviceAmount,
      platform_fee: platformFee,
      total_amount: totalAmount,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Time Slot Picker */}
      <TimeSlotPicker
        availabilityData={availability}
        bookings={bookings}
        onSlotSelect={handleSlotSelect}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
      />

      {/* Booking Details Form */}
      <Card className="border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <CardTitle className="text-2xl">
            {walker ? `Book a Walk with ${professional.walker_name}` : `Book Training with ${professional.trainer_name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Secure Payment:</strong> Your payment will be held securely until the {walker ? 'walk' : 'session'} is completed. 
              The {professionalType} receives payment only after you confirm completion.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Your Name *</Label>
                <Input
                  id="owner_name"
                  required
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_phone">Your Phone *</Label>
                <Input
                  id="owner_phone"
                  required
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dog_name">Dog's Name *</Label>
                <Input
                  id="dog_name"
                  required
                  value={formData.dog_name}
                  onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                  placeholder="Max"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dog_size">Dog Size *</Label>
                <Select 
                  required
                  value={formData.dog_size}
                  onValueChange={(value) => setFormData({...formData, dog_size: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra_large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duration (hours) *</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({...formData, duration_hours: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select 
                  required
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({...formData, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_notes">Special Notes (Optional)</Label>
              <Textarea
                id="special_notes"
                value={formData.special_notes}
                onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                placeholder="Any special instructions about your dog?"
                rows={4}
              />
            </div>

            {/* Payment Breakdown */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="flex justify-between text-gray-700">
                <span>Service Amount (€{professional.hourly_rate}/hr × {formData.duration_hours}h)</span>
                <span className="font-semibold">€{serviceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                <span className="font-semibold">€{platformFee.toFixed(2)}</span>
              </div>
              {selectedDate && selectedSlot && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Selected Date:</span>
                    <span className="font-semibold">{format(selectedDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Selected Time:</span>
                    <span className="font-semibold">{selectedSlot}</span>
                  </div>
                </div>
              )}
              <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-green-600">€{totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * Payment will be held securely and released after {walker ? 'walk' : 'session'} completion
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !selectedDate || !selectedSlot}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
              >
                {isProcessing ? "Processing..." : "Confirm & Pay"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}