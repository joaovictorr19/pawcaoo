import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Zap } from "lucide-react";
import { motion } from "framer-motion";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date'),
    initialData: [],
  });

  const filteredWalkers = walkers.filter(walker => {
    const matchesLocation = !searchLocation || 
      walker.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || 
      walker.dog_sizes?.includes(filterSize);
    const matchesTime = filterTime === "all" || 
      walker.availability?.includes(filterTime);
    
    return matchesLocation && matchesSize && matchesTime;
  });

  const filteredEmergencyWalks = emergencyWalks.filter(walk => {
    const matchesLocation = !searchLocation || 
      walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || walk.dog_size === filterSize;
    
    return matchesLocation && matchesSize;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find the Perfect Dog Walker
            </h1>
            <p className="text-xl md:text-2xl text-green-50 mb-8">
              Trusted, experienced walkers in your neighborhood
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Enter your location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:ring-green-500"
                />
              </div>
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="md:w-48 h-12 border-gray-200">
                  <SelectValue placeholder="Dog Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra_large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger className="md:w-48 h-12 border-gray-200">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results Section with Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="walkers" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-8 h-14 bg-white shadow-lg rounded-xl border-2 border-green-100">
            <TabsTrigger 
              value="walkers" 
              className="text-base font-semibold data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Walkers
            </TabsTrigger>
            <TabsTrigger 
              value="emergency" 
              className="text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Emergency Walks
            </TabsTrigger>
          </TabsList>

          {/* Regular Walkers Tab */}
          <TabsContent value="walkers">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Available Walkers</h2>
                <p className="text-gray-600 mt-1">
                  {filteredWalkers.length} walkers found
                </p>
              </div>
            </div>

            {loadingWalkers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredWalkers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No walkers found</h3>
                <p className="text-gray-600">Try adjusting your filters or search in a different area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWalkers.map((walker, index) => (
                  <motion.div
                    key={walker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <WalkerCard walker={walker} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Emergency Walks Tab */}
          <TabsContent value="emergency">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-orange-500" />
                  Dogs Needing Urgent Walks
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredEmergencyWalks.length} dogs need help now
                </p>
              </div>
            </div>

            {loadingEmergency ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredEmergencyWalks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No emergency walks at the moment</h3>
                <p className="text-gray-600">Check back soon or browse regular walkers</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmergencyWalks.map((walk, index) => (
                  <motion.div
                    key={walk.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <EmergencyDogCard walk={walk} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}