import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";

export default function DebugPawGo() {
  const [testResults, setTestResults] = useState({
    user: null,
    walkers: [],
    emergencyWalk: null,
    errors: [],
  });
  const [loading, setLoading] = useState(false);

  // 1. Fetch current user
  const testUser = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setTestResults((prev) => ({ ...prev, user }));
      toast.success(`✅ User: ${user?.email}`);
    } catch (err) {
      const msg = `❌ User fetch: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({ ...prev, errors: [...prev.errors, msg] }));
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch available walkers
  const testFetchWalkers = async () => {
    setLoading(true);
    try {
      const walkers = await base44.entities.WalkerProfile.filter(
        { is_active: true },
        "-rating",
        10
      );
      setTestResults((prev) => ({ ...prev, walkers: walkers || [] }));
      toast.success(`✅ Walkers found: ${walkers?.length || 0}`);
    } catch (err) {
      const msg = `❌ Walkers fetch: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({ ...prev, errors: [...prev.errors, msg] }));
    } finally {
      setLoading(false);
    }
  };

  // 3. Create emergency walk request
  const testCreateEmergencyWalk = async () => {
    if (!testResults.user?.email) {
      toast.error("❌ User not loaded. Run step 1 first.");
      return;
    }

    setLoading(true);
    try {
      const emergencyWalk = await base44.entities.EmergencyWalk.create({
        owner_name: testResults.user.full_name || "Test Owner",
        owner_phone: "+351900000000",
        owner_email: testResults.user.email,
        location: "Rua da Teste, Porto, Portugal",
        needed_time: "now",
        duration_hours: 1,
        dog_name: "Test Dog",
        dog_size: "medium",
        dog_breed: "Mixed",
        total_dogs: 1,
        offered_amount: 25,
        special_notes: "Debug PawGo test - Urgent walk needed",
        status: "available",
        urgency_level: "urgent",
      });

      setTestResults((prev) => ({ ...prev, emergencyWalk }));
      toast.success(`✅ Emergency walk created: ${emergencyWalk?.id}`);
    } catch (err) {
      const msg = `❌ Emergency walk creation: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({ ...prev, errors: [...prev.errors, msg] }));
    } finally {
      setLoading(false);
    }
  };

  // 4. Accept emergency walk as walker (simulate)
  const testAcceptEmergencyWalk = async () => {
    if (!testResults.emergencyWalk?.id) {
      toast.error("❌ Emergency walk not created. Run step 3 first.");
      return;
    }

    setLoading(true);
    try {
      // Simulate walker acceptance
      const walkerEmail = testResults.walkers?.[0]?.created_by || "walker@test.pt";
      const walkerName = testResults.walkers?.[0]?.walker_name || "Test Walker";

      await base44.entities.EmergencyWalk.update(testResults.emergencyWalk.id, {
        status: "accepted",
        accepted_by_walker: walkerEmail,
        walker_name: walkerName,
      });

      setTestResults((prev) => ({
        ...prev,
        emergencyWalk: { ...prev.emergencyWalk, status: "accepted", accepted_by_walker: walkerEmail },
      }));

      toast.success(`✅ Emergency walk accepted by ${walkerName}`);
    } catch (err) {
      const msg = `❌ Emergency walk acceptance: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({ ...prev, errors: [...prev.errors, msg] }));
    } finally {
      setLoading(false);
    }
  };

  // 5. Complete emergency walk
  const testCompleteEmergencyWalk = async () => {
    if (!testResults.emergencyWalk?.id) {
      toast.error("❌ Emergency walk not created. Run step 3 first.");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.EmergencyWalk.update(testResults.emergencyWalk.id, {
        status: "completed",
        completed_date: new Date().toISOString(),
      });

      setTestResults((prev) => ({
        ...prev,
        emergencyWalk: { ...prev.emergencyWalk, status: "completed" },
      }));

      toast.success(`✅ Emergency walk completed`);
    } catch (err) {
      const msg = `❌ Emergency walk completion: ${err.message}`;
      toast.error(msg);
      setTestResults((prev) => ({ ...prev, errors: [...prev.errors, msg] }));
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setTestResults({
      user: null,
      walkers: [],
      emergencyWalk: null,
      errors: [],
    });
    toast.info("Test reset");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">⚡ Debug PawGo</h1>
          <p className="text-gray-600">Teste completo do fluxo de pedidos de emergência</p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-blue-600" size={20} />
                Passo 1: Fetch Current User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testUser}
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

          {/* Step 2 */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-green-600" size={20} />
                Passo 2: Fetch Available Walkers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testFetchWalkers}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 mb-3"
              >
                {loading ? "Carregando..." : "Executar"}
              </Button>
              {testResults.walkers.length > 0 && (
                <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="font-bold text-green-900">✅ Passeadores encontrados:</p>
                  <div className="space-y-2 mt-2">
                    {testResults.walkers.slice(0, 3).map((w) => (
                      <div key={w.id} className="text-green-700 text-xs">
                        <p className="font-semibold">{w.walker_name}</p>
                        <p className="text-green-600">{w.location} • €{w.hourly_rate}/h • ⭐ {w.rating}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-green-600 text-xs mt-3">Total: {testResults.walkers.length} passeadores</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-orange-600" size={20} />
                Passo 3: Create Emergency Walk (PawGo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testCreateEmergencyWalk}
                disabled={loading || !testResults.user}
                className="w-full bg-orange-600 hover:bg-orange-700 mb-3"
              >
                {loading ? "Carregando..." : "Executar"}
              </Button>
              {testResults.emergencyWalk && (
                <div className="text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="font-bold text-orange-900">✅ Pedido de Emergência:</p>
                  <p className="text-orange-700 font-mono text-xs break-all mt-1">{testResults.emergencyWalk.id}</p>
                  <p className="text-orange-600 text-xs mt-2">
                    Status: <span className="font-bold">{testResults.emergencyWalk.status}</span>
                  </p>
                  <p className="text-orange-600 text-xs mt-1">
                    Valor oferecido: €{testResults.emergencyWalk.offered_amount}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-purple-600" size={20} />
                Passo 4: Accept Emergency Walk (Simular Walker)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testAcceptEmergencyWalk}
                disabled={loading || !testResults.emergencyWalk}
                className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
              >
                {loading ? "Carregando..." : "Executar"}
              </Button>
              {testResults.emergencyWalk?.status === "accepted" && (
                <div className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="font-bold text-purple-900">✅ Aceite por:</p>
                  <p className="text-purple-700">{testResults.emergencyWalk.walker_name}</p>
                  <p className="text-purple-600 text-xs mt-1">Email: {testResults.emergencyWalk.accepted_by_walker}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 5 */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                Passo 5: Complete Emergency Walk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testCompleteEmergencyWalk}
                disabled={loading || !testResults.emergencyWalk}
                className="w-full bg-green-600 hover:bg-green-700 mb-3"
              >
                {loading ? "Carregando..." : "Executar"}
              </Button>
            </CardContent>
          </Card>

          {/* Errors */}
          {testResults.errors.length > 0 && (
            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  Erros Encontrados
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

          {/* Reset */}
          <Button
            onClick={resetTest}
            variant="outline"
            className="w-full"
          >
            Reset Teste
          </Button>
        </div>
      </div>
    </div>
  );
}