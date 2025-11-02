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

const PLATFORM_FEE_PERCENTAGE = 15;

export default function BookingForm({ walker, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState({
    owner_name: "",
    owner_phone: "",
    dog_name: "",
    dog_size: "",
    walk_date: "",
    walk_time: "",
    duration_hours: 1,
    special_notes: "",
    payment_method: "credit_card",
  });

  const serviceAmount = formData.duration_hours * walker.hourly_rate;
  const platformFee = serviceAmount * (PLATFORM_FEE_PERCENTAGE / 100);
  const totalAmount = serviceAmount + platformFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
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
    >
      <Card className="border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <CardTitle className="text-2xl">Book a Walk with {walker.walker_name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Secure Payment:</strong> Your payment will be held securely until the walk is completed. 
              The walker receives payment only after you confirm the walk is done.
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
                <Label htmlFor="walk_date">Walk Date *</Label>
                <Input
                  id="walk_date"
                  type="date"
                  required
                  value={formData.walk_date}
                  onChange={(e) => setFormData({...formData, walk_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walk_time">Preferred Time *</Label>
                <Select 
                  required
                  value={formData.walk_time}
                  onValueChange={(value) => setFormData({...formData, walk_time: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6am-12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm-6pm)</SelectItem>
                    <SelectItem value="evening">Evening (6pm-10pm)</SelectItem>
                    <SelectItem value="night">Night (10pm-6am)</SelectItem>
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
                placeholder="Any special instructions about your dog? (e.g., medications, behavioral notes, favorite routes...)"
                rows={4}
              />
            </div>

            {/* Payment Breakdown */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="flex justify-between text-gray-700">
                <span>Service Amount (${walker.hourly_rate}/hr × {formData.duration_hours}h)</span>
                <span className="font-semibold">${serviceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                <span className="font-semibold">${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-green-600">${totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * Payment will be held securely and released to the walker after walk completion
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
                disabled={isProcessing}
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