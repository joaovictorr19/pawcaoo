import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";

export default function DebugWalkTest() {
  const [testResults, setTestResults] = useState({
    user: null,
    booking: null,
    trackingPoints: [],
    errors: [],
  });
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState(null);

  // 1. Test: Fetch current user
  const testCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setTestResults((prev) => ({
        ...prev,
        user,
      }));
      toast.success(`✅ User fetched: ${user?.email}`);
    } catch (err) {
      const msg = `❌ User fetch failed: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({
        ...prev,
        errors: [...prev.errors, msg],
      }));
    } finally {
      setLoading(false);
    }
  };

  // 2. Test: Create a test booking
  const testCreateBooking = async () => {
    if (!testResults.user?.email) {
      toast.error("❌ User not fetched. Run step 1 first.");
      return;
    }

    setLoading(true);
    try {
      const booking = await base44.entities.Booking.create({
        owner_name: testResults.user.full_name || "Test User",
        owner_email: testResults.user.email,
        owner_phone: "+351900000000",
        dog_name: "Test Dog 🐕",
        dog_size: "medium",
        walker_name: "Test Walker",
        walker_email: "walker@test.pt",
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: "14:00",
        duration_hours: 1,
        pickup_method: "walker_pickup",
        pickup_address: "Rua da Teste, Porto, Portugal",
        special_notes: "Debug test walk",
        service_amount: 15,
        platform_fee: 2.25,
        total_amount: 17.25,
        status: "confirmed",
        route_coordinates: [
          { lat: 41.1579, lng: -8.6291, timestamp: new Date().toISOString() },
        ],
      });

      setTestResults((prev) => ({
        ...prev,
        booking,
      }));

      // Initialize tracking points
      setTestResults((prev) => ({
        ...prev,
        trackingPoints: [{ lat: 41.1579, lng: -8.6291, timestamp: new Date().toISOString() }],
      }));

      toast.success(`✅ Booking created: ${booking.id}`);
    } catch (err) {
      const msg = `❌ Booking creation failed: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({
        ...prev,
        errors: [...prev.errors, msg],
      }));
    } finally {
      setLoading(false);
    }
  };

  // 3. Test: Simulate GPS tracking
  const testSimulateTracking = async () => {
    if (!testResults.booking?.id) {
      toast.error("❌ Booking not created. Run step 2 first.");
      return;
    }

    setLoading(true);
    try {
      // Simulate walking in a route (Porto area)
      const routePoints = [
        { lat: 41.1579, lng: -8.6291 }, // Start
        { lat: 41.1585, lng: -8.6300 },
        { lat: 41.1590, lng: -8.6310 },
        { lat: 41.1595, lng: -8.6315 },
        { lat: 41.1600, lng: -8.6320 }, // End
      ];

      const newPoints = [];
      for (const point of routePoints) {
        const checkpoint = await base44.entities.WalkCheckpoint.create({
          booking_id: testResults.booking.id,
          walker_email: testResults.booking.walker_email,
          checkpoint_type: "check_in",
          latitude: point.lat,
          longitude: point.lng,
          timestamp: new Date().toISOString(),
          notes: `Tracking point - lat: ${point.lat}, lng: ${point.lng}`,
        });

        newPoints.push({
          lat: point.lat,
          lng: point.lng,
          timestamp: new Date().toISOString(),
        });

        await new Promise((r) => setTimeout(r, 300)); // Delay for UI
      }

      setTestResults((prev) => ({
        ...prev,
        trackingPoints: newPoints,
      }));

      // Update booking with route
      await base44.entities.Booking.update(testResults.booking.id, {
        route_coordinates: newPoints,
        distance_km: 0.5,
        status: "in_progress",
      });

      setMapData({
        points: newPoints,
        bookingId: testResults.booking.id,
      });

      toast.success(`✅ Tracking simulated: ${newPoints.length} points`);
    } catch (err) {
      const msg = `❌ Tracking simulation failed: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({
        ...prev,
        errors: [...prev.errors, msg],
      }));
    } finally {
      setLoading(false);
    }
  };

  // 4. Test: Complete booking
  const testCompleteBooking = async () => {
    if (!testResults.booking?.id) {
      toast.error("❌ Booking not found. Run step 2 first.");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Booking.update(testResults.booking.id, {
        status: "completed",
        completed_date: new Date().toISOString(),
      });

      toast.success(`✅ Booking completed: ${testResults.booking.id}`);
    } catch (err) {
      const msg = `❌ Booking completion failed: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({
        ...prev,
        errors: [...prev.errors, msg],
      }));
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setTestResults({
      user: null,
      booking: null,
      trackingPoints: [],
      errors: [],
    });
    setMapData(null);
    toast.info("Test reset");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">🧪 Debug Walk Test</h1>
          <p className="text-gray-600">Teste completo do fluxo: Pedido → Mapa → Tracking → Conclusão</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Steps */}
          <div className="space-y-4">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-blue-600" size={20} />
                  Passo 1: Fetch User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={testCurrentUser}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
                >
                  {loading ? "Carregando..." : "Executar"}
                </Button>
                {testResults.user && (
                  <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-bold text-blue-900">✅ Utilizador:</p>
                    <p className="text-blue-700">{testResults.user.email}</p>
                    <p className="text-blue-600 text-xs">{testResults.user.full_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-green-600" size={20} />
                  Passo 2: Create Booking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={testCreateBooking}
                  disabled={loading || !testResults.user}
                  className="w-full bg-green-600 hover:bg-green-700 mb-3"
                >
                  {loading ? "Carregando..." : "Executar"}
                </Button>
                {testResults.booking && (
                  <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-bold text-green-900">✅ Booking ID:</p>
                    <p className="text-green-700 font-mono text-xs break-all">{testResults.booking.id}</p>
                    <p className="text-green-600 text-xs mt-1">Status: {testResults.booking.status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-orange-600" size={20} />
                  Passo 3: Simulate Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={testSimulateTracking}
                  disabled={loading || !testResults.booking}
                  className="w-full bg-orange-600 hover:bg-orange-700 mb-3"
                >
                  {loading ? "Carregando..." : "Executar"}
                </Button>
                {testResults.trackingPoints.length > 0 && (
                  <div className="text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="font-bold text-orange-900">✅ Pontos de tracking:</p>
                    <p className="text-orange-700">{testResults.trackingPoints.length} pontos registados</p>
                    <p className="text-orange-600 text-xs mt-1">
                      Distância: ~0.5 km
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-purple-600" size={20} />
                  Passo 4: Complete Booking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={testCompleteBooking}
                  disabled={loading || !testResults.booking}
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
                >
                  {loading ? "Carregando..." : "Executar"}
                </Button>
              </CardContent>
            </Card>

            <Button
              onClick={resetTest}
              variant="outline"
              className="w-full"
            >
              Reset Teste
            </Button>
          </div>

          {/* Map View */}
          <div className="space-y-4">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                <CardTitle>📍 Mapa de Tracking</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                {mapData?.points && mapData.points.length > 0 ? (
                  <MapContainer
                    center={[mapData.points[0].lat, mapData.points[0].lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polyline
                      positions={mapData.points.map((p) => [p.lat, p.lng])}
                      color="#ff6b35"
                      weight={4}
                    />
                    {mapData.points.map((point, idx) => (
                      <Marker key={idx} position={[point.lat, point.lng]}>
                        <Popup>
                          Ponto {idx + 1} de {mapData.points.length}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500 text-center">Execute o Passo 3 para visualizar o mapa de tracking</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Errors */}
            {testResults.errors.length > 0 && (
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={20} />
                    Erros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        {err}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}