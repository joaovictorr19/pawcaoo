import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Clock, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DogSittingServices() {
  const navigate = useNavigate();

  const services = [
    {
      id: "boarding",
      title: "Dog Boarding",
      description: "Your dog stays at the walker's home with 24/7 care and attention",
      icon: HomeIcon,
      color: "from-blue-500 to-blue-600",
      features: [
        "24/7 supervision and care",
        "Home-like environment",
        "Regular walks and playtime",
        "Daily photo updates",
        "Perfect for vacations"
      ]
    },
    {
      id: "house_sitting",
      title: "House Sitting",
      description: "Walker stays at your home to care for your dog in their familiar environment",
      icon: HomeIcon,
      color: "from-purple-500 to-purple-600",
      features: [
        "Dog stays in their home",
        "Home security included",
        "Mail and plant care",
        "Maintains routine",
        "Best for anxious dogs"
      ]
    },
    {
      id: "drop_in_feeding",
      title: "Drop-In Visits",
      description: "Walker visits your home to feed, walk, and check on your dog",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      features: [
        "30-60 minute visits",
        "Feeding and fresh water",
        "Quick walks or playtime",
        "Medication if needed",
        "Great for short trips"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Dog Sitting Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Going on vacation? Need extended care for your furry friend? 
            Our verified walkers offer professional dog sitting services.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {services.map((service) => (
            <Card key={service.id} className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
              <div className={`h-3 bg-gradient-to-r ${service.color}`} />
              <CardHeader className="text-center pt-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                <p className="text-gray-600">{service.description}</p>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <Heart className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full bg-gradient-to-r ${service.color} hover:opacity-90 text-white shadow-lg h-12`}
                  onClick={() => navigate(createPageUrl(`RequestDogSitting?type=${service.id}`))}
                >
                  Request Service
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Our Dog Sitting Services?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ Verified & Trusted Sitters</h4>
                <p className="text-gray-700">All sitters undergo background checks and document verification</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ Secure Payment System</h4>
                <p className="text-gray-700">Payment held in escrow until service is completed</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ 24/7 Communication</h4>
                <p className="text-gray-700">Built-in chat to stay connected with your sitter</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✓ Insurance Coverage</h4>
                <p className="text-gray-700">All services covered by our insurance policy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}