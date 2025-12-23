import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, Copy, Check, Key, ShoppingBag, Calendar, 
  Package, ArrowRight, Shield, Zap, Globe
} from "lucide-react";
import { toast } from "sonner";

const CodeBlock = ({ code, language = "json" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const EndpointCard = ({ method, path, description, requestBody, responseExample }) => {
  const methodColors = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PATCH: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800"
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="py-3 bg-gray-50">
        <div className="flex items-center gap-3">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="text-sm font-mono text-gray-700">{path}</code>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h4>
            <CodeBlock code={JSON.stringify(requestBody, null, 2)} />
          </div>
        )}
        {responseExample && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Example</h4>
            <CodeBlock code={JSON.stringify(responseExample, null, 2)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ApiDocs() {
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Globe className="w-4 h-4" />
            API v1.0
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PawCão Partner API
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            API RESTful para integração com pet shops parceiros. 
            Consulte produtos, agende serviços e gerencie pedidos de forma segura.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 className="font-semibold">Obtenha sua API Key</h4>
                <p className="text-sm text-gray-600">Contacte nossa equipa para receber suas credenciais de acesso.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 className="font-semibold">Autentique suas requisições</h4>
                <p className="text-sm text-gray-600">Inclua o header Authorization em todas as chamadas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 className="font-semibold">Comece a integrar!</h4>
                <p className="text-sm text-gray-600">Use os endpoints abaixo para gerir produtos, pedidos e reservas.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Todas as requisições devem incluir o header de autenticação com sua API key:
            </p>
            <CodeBlock 
              code={`Authorization: Bearer pk_live_xxxxxxxxxxxxx`}
              language="header"
            />
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Segurança</h4>
                  <p className="text-sm text-yellow-700">
                    Nunca exponha sua API key em código client-side. 
                    Use sempre em ambiente servidor seguro.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="products" className="mb-8">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <EndpointCard
              method="GET"
              path="/api/partnerApi/products"
              description="Lista todos os produtos disponíveis"
              responseExample={{
                success: true,
                data: [
                  {
                    id: "prod_123",
                    name: "Ração Premium Dog",
                    description: "Ração super premium para cães adultos",
                    price: 45.99,
                    category: "food",
                    stock: 150,
                    is_active: true
                  }
                ],
                pagination: {
                  total: 100,
                  limit: 50,
                  skip: 0,
                  hasMore: true
                }
              }}
            />
            <EndpointCard
              method="GET"
              path="/api/partnerApi/products/:id"
              description="Obtém detalhes de um produto específico"
              responseExample={{
                success: true,
                data: {
                  id: "prod_123",
                  name: "Ração Premium Dog",
                  description: "Ração super premium para cães adultos",
                  price: 45.99,
                  category: "food",
                  images: ["https://..."],
                  stock: 150
                }
              }}
            />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <EndpointCard
              method="GET"
              path="/api/partnerApi/services"
              description="Lista todos os serviços disponíveis"
              responseExample={{
                success: true,
                data: [
                  {
                    id: "srv_456",
                    name: "Banho e Tosa",
                    description: "Banho completo com tosa higiênica",
                    price: 35.00,
                    duration_minutes: 60,
                    is_active: true
                  }
                ]
              }}
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <EndpointCard
              method="POST"
              path="/api/partnerApi/orders"
              description="Cria um novo pedido"
              requestBody={{
                customer_email: "cliente@email.com",
                customer_name: "João Silva",
                customer_phone: "+351912345678",
                items: [
                  {
                    product_id: "prod_123",
                    product_name: "Ração Premium Dog",
                    quantity: 2,
                    unit_price: 45.99
                  }
                ],
                shipping_address: {
                  street: "Rua das Flores, 123",
                  city: "Lisboa",
                  postal_code: "1000-001",
                  country: "Portugal"
                },
                external_order_id: "LOJA-001234"
              }}
              responseExample={{
                success: true,
                data: {
                  id: "ord_789",
                  order_id: "ORD-1703345678-ABC123",
                  status: "pending",
                  total_amount: 91.98
                },
                message: "Order created successfully"
              }}
            />
            <EndpointCard
              method="GET"
              path="/api/partnerApi/orders"
              description="Lista pedidos do parceiro"
              responseExample={{
                success: true,
                data: [
                  {
                    id: "ord_789",
                    order_id: "ORD-1703345678-ABC123",
                    customer_name: "João Silva",
                    total_amount: 91.98,
                    status: "confirmed",
                    created_date: "2024-12-23T10:30:00Z"
                  }
                ]
              }}
            />
            <EndpointCard
              method="PATCH"
              path="/api/partnerApi/orders/:id"
              description="Atualiza status de um pedido"
              requestBody={{
                status: "shipped",
                tracking_number: "CTT123456789PT"
              }}
              responseExample={{
                success: true,
                data: {
                  id: "ord_789",
                  status: "shipped",
                  tracking_number: "CTT123456789PT"
                },
                message: "Order updated successfully"
              }}
            />
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <EndpointCard
              method="POST"
              path="/api/partnerApi/bookings"
              description="Cria uma reserva de serviço"
              requestBody={{
                service_id: "srv_456",
                service_name: "Banho e Tosa",
                customer_email: "cliente@email.com",
                customer_name: "Maria Santos",
                customer_phone: "+351912345678",
                pet_name: "Rex",
                pet_type: "dog",
                booking_date: "2024-12-28",
                booking_time: "14:00",
                price: 35.00
              }}
              responseExample={{
                success: true,
                data: {
                  id: "bkg_101",
                  status: "pending",
                  booking_date: "2024-12-28",
                  booking_time: "14:00"
                },
                message: "Booking created successfully"
              }}
            />
            <EndpointCard
              method="GET"
              path="/api/partnerApi/bookings"
              description="Lista reservas do parceiro"
              responseExample={{
                success: true,
                data: [
                  {
                    id: "bkg_101",
                    service_name: "Banho e Tosa",
                    customer_name: "Maria Santos",
                    pet_name: "Rex",
                    booking_date: "2024-12-28",
                    booking_time: "14:00",
                    status: "confirmed"
                  }
                ]
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Error Codes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Códigos de Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Código</th>
                    <th className="text-left py-2 px-3">HTTP Status</th>
                    <th className="text-left py-2 px-3">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>UNAUTHORIZED</code></td>
                    <td className="py-2 px-3">401</td>
                    <td className="py-2 px-3">API key inválida ou ausente</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>FORBIDDEN</code></td>
                    <td className="py-2 px-3">403</td>
                    <td className="py-2 px-3">Sem permissão para este recurso</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>NOT_FOUND</code></td>
                    <td className="py-2 px-3">404</td>
                    <td className="py-2 px-3">Recurso não encontrado</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>VALIDATION_ERROR</code></td>
                    <td className="py-2 px-3">400</td>
                    <td className="py-2 px-3">Dados inválidos na requisição</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code>INTERNAL_ERROR</code></td>
                    <td className="py-2 px-3">500</td>
                    <td className="py-2 px-3">Erro interno do servidor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Por padrão, cada API key tem um limite de <strong>60 requisições por minuto</strong>.
              Caso necessite de um limite maior, contacte a nossa equipa.
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Headers de resposta incluem informações sobre o rate limit:
              </p>
              <CodeBlock
                code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1703345678`}
                language="headers"
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>Precisa de ajuda? Contacte-nos em <a href="mailto:api@pawcao.net" className="text-blue-600 hover:underline">api@pawcao.net</a></p>
        </div>
      </div>
    </div>
  );
}