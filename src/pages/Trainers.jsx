
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Award, Star } from "lucide-react";
import { motion } from "framer-motion";
import TrainerCard from "../components/trainers/TrainerCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trainers() {
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterMethodology, setFilterMethodology] = useState("all"); // NEW
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterSuccessRate, setFilterSuccessRate] = useState("all"); // NEW

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
  });

  const { data: allReviews } = useQuery({
    queryKey: ['allTrainerReviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
  });

  // Calculate average ratings for each trainer
  const trainersWithRatings = trainers.map(trainer => {
    const trainerReviews = allReviews.filter(r => r.trainer_id === trainer.id);
    const averageRating = trainerReviews.length > 0
      ? trainerReviews.reduce((sum, r) => sum + r.rating, 0) / trainerReviews.length
      : trainer.rating || 0; // Fallback to trainer.rating or 0 if no reviews exist
    return {
      ...trainer,
      average_rating: averageRating,
      review_count: trainerReviews.length
    };
  });

  const filteredTrainers = trainersWithRatings.filter(trainer => {
    const matchesLocation = !searchLocation ||
      trainer.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSpecialty = filterSpecialty === "all" ||
      trainer.training_specialties?.includes(filterSpecialty);
    const matchesMethodology = filterMethodology === "all" ||
      trainer.training_methodologies?.some(m => m.methodology_name === filterMethodology); // NEW
    const matchesMethod = filterMethod === "all" ||
      trainer.consultation_options?.includes(filterMethod);
    const matchesRating = filterRating === "all" ||
      (filterRating === "4+" && trainer.average_rating >= 4) ||
      (filterRating === "4.5+" && trainer.average_rating >= 4.5) ||
      (filterRating === "5" && trainer.average_rating === 5);
    const matchesSuccessRate = filterSuccessRate === "all" ||
      (filterSuccessRate === "90+" && trainer.success_rate >= 90) ||
      (filterSuccessRate === "95+" && trainer.success_rate >= 95) ||
      (filterSuccessRate === "98+" && trainer.success_rate >= 98); // NEW

    return matchesLocation && matchesSpecialty && matchesMethodology && matchesMethod && matchesRating && matchesSuccessRate; // Updated return
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Award className="w-12 h-12" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Find Professional Dog Trainers
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-purple-50 mb-8">
              Certified trainers for obedience, behavior, and specialized training
            </p>
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-4 md:p-6"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Location */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Enter your location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:ring-purple-500"
                />
              </div>

              {/* Training Specialty */}
              <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Training Specialty" /> {/* Changed placeholder */}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem> {/* Changed text */}
                  <SelectItem value="basic_obedience">Basic Obedience</SelectItem>
                  <SelectItem value="advanced_obedience">Advanced Obedience</SelectItem> {/* NEW */}
                  <SelectItem value="behavior_modification">Behavior Modification</SelectItem>
                  <SelectItem value="puppy_training">Puppy Training</SelectItem>
                  <SelectItem value="aggression">Aggression Issues</SelectItem>
                  <SelectItem value="anxiety">Anxiety & Fear</SelectItem>
                  <SelectItem value="socialization">Socialization</SelectItem>
                  <SelectItem value="service_dog">Service Dog</SelectItem> {/* NEW */}
                  <SelectItem value="agility">Agility Training</SelectItem> {/* NEW */}
                </SelectContent>
              </Select>

              {/* Training Methodology - NEW */}
              <Select value={filterMethodology} onValueChange={setFilterMethodology}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Training Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methodologies</SelectItem>
                  <SelectItem value="positive_reinforcement">Positive Reinforcement</SelectItem>
                  <SelectItem value="clicker_training">Clicker Training</SelectItem>
                  <SelectItem value="model_rival">Model-Rival</SelectItem>
                  <SelectItem value="relationship_based">Relationship-Based</SelectItem>
                  <SelectItem value="science_based">Science-Based</SelectItem>
                  <SelectItem value="balanced_training">Balanced Training</SelectItem>
                </SelectContent>
              </Select>

              {/* Consultation Method */}
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Consultation Type" /> {/* Changed placeholder */}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              {/* Success Rate - NEW */}
              <Select value={filterSuccessRate} onValueChange={setFilterSuccessRate}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Success Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Success Rates</SelectItem>
                  <SelectItem value="90+">90%+ Success</SelectItem>
                  <SelectItem value="95+">95%+ Success</SelectItem>
                  <SelectItem value="98+">98%+ Success</SelectItem>
                </SelectContent>
              </Select>

              {/* Rating */}
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4+">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      4.0+
                    </div>
                  </SelectItem>
                  <SelectItem value="4.5+">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      4.5+
                    </div>
                  </SelectItem>
                  <SelectItem value="5">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      5.0 Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trainers List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Available Trainers</h2>
            <p className="text-gray-600 mt-1">
              {filteredTrainers.length} certified trainers found
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                <Skeleton className="w-full h-64 rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trainers found</h3>
            <p className="text-gray-600">Try adjusting your filters or search in a different area</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map((trainer, index) => (
              <motion.div
                key={trainer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <TrainerCard trainer={trainer} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white border-t border-gray-200 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose PawCão Certified Trainers?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Certified Professionals</h3>
              <p className="text-gray-600 text-sm">All trainers have verified certifications</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proven Methods</h3>
              <p className="text-gray-600 text-sm">Positive reinforcement techniques</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Options</h3>
              <p className="text-gray-600 text-sm">In-person or online sessions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Satisfaction Guaranteed</h3>
              <p className="text-gray-600 text-sm">Money-back guarantee on packages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
