import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

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
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalAmount = formData.duration_hours * walker.hourly_rate;

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
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Amount
                </Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
                  <span className="text-2xl font-bold text-green-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
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
                {isProcessing ? "Processing..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}