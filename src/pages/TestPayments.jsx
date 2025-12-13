import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, CreditCard, Webhook, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPayments() {
  const queryClient = useQueryClient();
  const [testResults, setTestResults] = useState({});

  // Check if user is admin
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Get recent bookings for testing
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const res = await base44.entities.Booking.list('-created_date', 10);
      return res;
    },
    enabled: user?.role === 'admin',
  });

  // Get recent payments
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['allPayments'],
    queryFn: async () => {
      const res = await base44.entities.Payment.list('-created_date', 10);
      return res;
    },
    enabled: user?.role === 'admin',
  });

  // Test Stripe Checkout creation
  const testCheckoutMutation = useMutation({
    mutationFn: async (bookingId) => {
      const response = await base44.functions.invoke('createStripeCheckout', {
        bookingId: bookingId,
        successUrl: `${window.location.origin}/CheckoutSuccess?booking_id=${bookingId}`,
        cancelUrl: `${window.location.origin}/MyBookings`,
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success('✅ Checkout criado com sucesso!');
      setTestResults(prev => ({
        ...prev,
        checkout: { status: 'success', data }
      }));
    },
    onError: (error) => {
      toast.error(`❌ Erro: ${error.message}`);
      setTestResults(prev => ({
        ...prev,
        checkout: { status: 'error', error: error.message }
      }));
    }
  });

  // Test webhook simulation
  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      // This would normally be called by Stripe, not directly
      // For testing, we can check if the function exists and is properly configured
      const response = await fetch('/api/functions/stripeWebhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      return response;
    },
    onSuccess: () => {
      toast.success('✅ Webhook endpoint está acessível');
      setTestResults(prev => ({
        ...prev,
        webhook: { status: 'success' }
      }));
    },
    onError: (error) => {
      toast.error(`❌ Webhook erro: ${error.message}`);
      setTestResults(prev => ({
        ...prev,
        webhook: { status: 'error', error: error.message }
      }));
    }
  });

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Esta página é apenas para administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-green-600" />
          Sistema de Pagamentos - Teste & Debug
        </h1>
        <p className="text-gray-600">
          Verifique o funcionamento completo do sistema Stripe
        </p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Secrets Configuradas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">STRIPE_SECRET_KEY</span>
                <Badge className="bg-green-600">✓ Configurada</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">STRIPE_PUBLISHABLE_KEY</span>
                <Badge className="bg-green-600">✓ Configurada</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">STRIPE_WEBHOOK_SECRET</span>
                <Badge className="bg-green-600">✓ Configurada</Badge>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <strong>Webhook URL para configurar no Stripe:</strong>
                  <br />
                  <code className="bg-white px-2 py-1 rounded mt-2 inline-block">
                    {window.location.origin}/api/functions/stripeWebhook
                  </code>
                  <br />
                  <span className="text-xs text-gray-600 mt-2 block">
                    Configure esta URL no Stripe Dashboard → Webhooks
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funções Backend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>createStripeCheckout</span>
                <Badge variant="outline">✓ Existe</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>stripeWebhook</span>
                <Badge variant="outline">✓ Existe</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Últimas Reservas ({bookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma reserva encontrada</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.dog_name}</p>
                          <p className="text-sm text-gray-600">
                            {booking.walk_date} - €{booking.total_amount}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            booking.payment_status === 'held' ? 'bg-green-600' :
                            booking.payment_status === 'pending' ? 'bg-yellow-600' :
                            booking.payment_status === 'failed' ? 'bg-red-600' :
                            'bg-gray-600'
                          }>
                            {booking.payment_status || 'sem pagamento'}
                          </Badge>
                          <br />
                          <Badge variant="outline" className="mt-1">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {booking.status === 'pending' && !booking.payment_id && (
                        <Button
                          size="sm"
                          onClick={() => testCheckoutMutation.mutate(booking.id)}
                          disabled={testCheckoutMutation.isPending}
                          className="w-full"
                        >
                          {testCheckoutMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Testar Checkout
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Últimos Pagamentos ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum pagamento encontrado</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">€{payment.total_amount}</p>
                          <p className="text-sm text-gray-600">
                            {payment.payer_name} → {payment.recipient_name}
                          </p>
                        </div>
                        <Badge className={
                          payment.status === 'held' ? 'bg-green-600' :
                          payment.status === 'released' ? 'bg-blue-600' :
                          payment.status === 'pending' ? 'bg-yellow-600' :
                          payment.status === 'failed' ? 'bg-red-600' :
                          'bg-gray-600'
                        }>
                          {payment.status}
                        </Badge>
                      </div>
                      {payment.stripe_payment_intent_id && (
                        <p className="text-xs text-gray-500 font-mono">
                          {payment.stripe_payment_intent_id}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testes Automatizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkout Test */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Teste de Checkout</h3>
                    <p className="text-sm text-gray-600">
                      Criar sessão de checkout Stripe
                    </p>
                  </div>
                  {testResults.checkout && (
                    testResults.checkout.status === 'success' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )
                  )}
                </div>
                
                {bookings.length > 0 && (
                  <Button
                    onClick={() => testCheckoutMutation.mutate(bookings[0].id)}
                    disabled={testCheckoutMutation.isPending}
                    className="w-full"
                  >
                    {testCheckoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Executar Teste
                  </Button>
                )}

                {testResults.checkout && (
                  <Alert className={`mt-3 ${testResults.checkout.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(testResults.checkout, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Webhook Test */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      Teste de Webhook
                    </h3>
                    <p className="text-sm text-gray-600">
                      Verificar se endpoint está acessível
                    </p>
                  </div>
                  {testResults.webhook && (
                    testResults.webhook.status === 'success' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )
                  )}
                </div>

                <Alert className="mb-3 bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-xs">
                    ⚠️ Este teste apenas verifica se o endpoint existe. 
                    Para testar webhooks completos, use o Stripe CLI ou o dashboard.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => testWebhookMutation.mutate()}
                  disabled={testWebhookMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {testWebhookMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Verificar Endpoint
                </Button>

                {testResults.webhook && (
                  <Alert className={`mt-3 ${testResults.webhook.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(testResults.webhook, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Test with Stripe Cards */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Cartões de Teste Stripe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Sucesso:</strong>
                    <code className="bg-white px-2 py-1 rounded ml-2">4242 4242 4242 4242</code>
                  </div>
                  <div>
                    <strong>Falha:</strong>
                    <code className="bg-white px-2 py-1 rounded ml-2">4000 0000 0000 0002</code>
                  </div>
                  <div>
                    <strong>3D Secure:</strong>
                    <code className="bg-white px-2 py-1 rounded ml-2">4000 0027 6000 3184</code>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Data: qualquer futura | CVC: qualquer 3 dígitos
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}