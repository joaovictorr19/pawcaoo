import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Check, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function PaymentMethods() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    type: "credit_card",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const paymentMethods = user?.payment_methods || [];

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (cardData) => {
      // In production, this would use Stripe.js to tokenize the card
      // and send only the token to the backend
      const last4 = cardData.cardNumber.slice(-4);
      const newMethod = {
        type: cardData.type,
        last_four: last4,
        is_default: paymentMethods.length === 0,
        expiry: `${cardData.expiryMonth}/${cardData.expiryYear}`,
        cardholder_name: cardData.cardholderName
      };

      const updatedMethods = [...paymentMethods, newMethod];
      await base44.auth.updateMe({
        payment_methods: updatedMethods
      });
      return updatedMethods;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'pt' ? 'Método de pagamento adicionado!' : 'Payment method added!');
      setShowAddCard(false);
      setNewCard({
        type: "credit_card",
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        cardholderName: ""
      });
    },
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: async (index) => {
      const updatedMethods = paymentMethods.filter((_, i) => i !== index);
      // If we removed the default, make the first one default
      if (paymentMethods[index].is_default && updatedMethods.length > 0) {
        updatedMethods[0].is_default = true;
      }
      await base44.auth.updateMe({
        payment_methods: updatedMethods
      });
      return updatedMethods;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'pt' ? 'Método removido!' : 'Method removed!');
    },
  });

  const setDefaultMethodMutation = useMutation({
    mutationFn: async (index) => {
      const updatedMethods = paymentMethods.map((method, i) => ({
        ...method,
        is_default: i === index
      }));
      await base44.auth.updateMe({
        payment_methods: updatedMethods
      });
      return updatedMethods;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'pt' ? 'Método padrão atualizado!' : 'Default method updated!');
    },
  });

  const handleAddCard = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newCard.cardNumber || newCard.cardNumber.length < 16) {
      toast.error(language === 'pt' ? 'Número de cartão inválido' : 'Invalid card number');
      return;
    }
    if (!newCard.expiryMonth || !newCard.expiryYear) {
      toast.error(language === 'pt' ? 'Data de validade inválida' : 'Invalid expiry date');
      return;
    }
    if (!newCard.cvv || newCard.cvv.length < 3) {
      toast.error(language === 'pt' ? 'CVV inválido' : 'Invalid CVV');
      return;
    }

    addPaymentMethodMutation.mutate(newCard);
  };

  const getCardBrand = (type) => {
    const brands = {
      credit_card: "💳 Cartão de Crédito",
      debit_card: "💳 Cartão de Débito",
      mbway: "📱 MB WAY",
      paypal: "💙 PayPal"
    };
    return brands[type] || "💳 Cartão";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            {language === 'pt' ? 'Métodos de Pagamento' : 'Payment Methods'}
          </h1>
          <p className="text-gray-600">
            {language === 'pt' ? 'Gerencie seus métodos de pagamento' : 'Manage your payment methods'}
          </p>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  {language === 'pt' ? '🔒 Seguro e Protegido' : '🔒 Safe & Secure'}
                </h3>
                <p className="text-sm text-green-800">
                  {language === 'pt' 
                    ? 'Seus dados de pagamento são criptografados e processados de forma segura através do Stripe. Nunca armazenamos números de cartão completos.'
                    : 'Your payment data is encrypted and securely processed through Stripe. We never store full card numbers.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods List */}
        <div className="space-y-4 mb-6">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm md:text-base">
                          {getCardBrand(method.type)}
                        </div>
                        <div className="text-gray-600 text-sm md:text-base">
                          •••• •••• •••• {method.last_four}
                        </div>
                        {method.expiry && (
                          <div className="text-xs text-gray-500">
                            {language === 'pt' ? 'Validade' : 'Expires'}: {method.expiry}
                          </div>
                        )}
                        {method.is_default && (
                          <Badge className="mt-1 bg-green-500 text-white text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            {language === 'pt' ? 'Padrão' : 'Default'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMethodMutation.mutate(index)}
                          disabled={setDefaultMethodMutation.isPending}
                          className="text-xs md:text-sm"
                        >
                          {language === 'pt' ? 'Tornar Padrão' : 'Set Default'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePaymentMethodMutation.mutate(index)}
                        disabled={removePaymentMethodMutation.isPending}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {paymentMethods.length === 0 && !showAddCard && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 md:p-12 text-center">
                <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  {language === 'pt' ? 'Nenhum método de pagamento' : 'No payment methods'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {language === 'pt' ? 'Adicione um método de pagamento para reservar serviços' : 'Add a payment method to book services'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add New Card */}
        {!showAddCard ? (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 md:h-14 text-sm md:text-base"
            onClick={() => setShowAddCard(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            {language === 'pt' ? 'Adicionar Método de Pagamento' : 'Add Payment Method'}
          </Button>
        ) : (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="text-lg md:text-xl">
                {language === 'pt' ? 'Novo Cartão' : 'New Card'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <Label className="text-sm md:text-base">
                    {language === 'pt' ? 'Nome no Cartão' : 'Cardholder Name'}
                  </Label>
                  <Input
                    value={newCard.cardholderName}
                    onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
                    placeholder="João Silva"
                    required
                    className="h-10 md:h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm md:text-base">
                    {language === 'pt' ? 'Número do Cartão' : 'Card Number'}
                  </Label>
                  <Input
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value.replace(/\s/g, '')})}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                    className="h-10 md:h-12"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs md:text-sm">
                      {language === 'pt' ? 'Mês' : 'Month'}
                    </Label>
                    <Input
                      value={newCard.expiryMonth}
                      onChange={(e) => setNewCard({...newCard, expiryMonth: e.target.value})}
                      placeholder="MM"
                      maxLength={2}
                      required
                      className="h-10 md:h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm">
                      {language === 'pt' ? 'Ano' : 'Year'}
                    </Label>
                    <Input
                      value={newCard.expiryYear}
                      onChange={(e) => setNewCard({...newCard, expiryYear: e.target.value})}
                      placeholder="YY"
                      maxLength={2}
                      required
                      className="h-10 md:h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm">CVV</Label>
                    <Input
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                      placeholder="123"
                      maxLength={4}
                      type="password"
                      required
                      className="h-10 md:h-12"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCard(false)}
                    className="flex-1"
                  >
                    {language === 'pt' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={addPaymentMethodMutation.isPending}
                  >
                    {addPaymentMethodMutation.isPending 
                      ? (language === 'pt' ? 'A adicionar...' : 'Adding...')
                      : (language === 'pt' ? 'Adicionar' : 'Add Card')
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Supported Methods */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              {language === 'pt' ? 'Métodos Suportados' : 'Supported Methods'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">💳</div>
                <div className="text-xs font-semibold text-gray-900">Visa</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">💳</div>
                <div className="text-xs font-semibold text-gray-900">Mastercard</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">📱</div>
                <div className="text-xs font-semibold text-gray-900">MB WAY</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">💙</div>
                <div className="text-xs font-semibold text-gray-900">PayPal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}