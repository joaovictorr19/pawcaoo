import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertCircle } from 'lucide-react';

export default function PawGoMaintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Zap className="w-8 h-8 text-orange-600" />
            PawGo
          </h1>
          
          <p className="text-lg font-bold text-gray-700 mb-4">Em Manutenção</p>
          
          <p className="text-gray-600 mb-6">
            Estamos a refazer o PawGo do zero para trazer-te uma experiência ainda melhor. Em breve regressamos!
          </p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>⏱️ Volte em breve</p>
            <p>🔧 Sistema em atualização</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}