import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Award } from "lucide-react";

export default function ServiceList({ services, type }) {
  const isWalker = type === 'walker';
  
  if (!services || services.length === 0) return null;

  return (
    <div className="mb-6 border-t border-gray-200 pt-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {isWalker ? (
          <DollarSign className="w-5 h-5 text-green-600" />
        ) : (
          <Award className="w-5 h-5 text-purple-600" />
        )}
        {isWalker ? 'Services & Pricing' : 'Training Programs & Packages'}
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {services.map((service, idx) => (
          <Card key={idx} className={`border-2 ${isWalker ? 'border-green-200' : 'border-purple-200'} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-lg text-gray-900">{service.service_name}</h4>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>
                    €{service.price}
                  </div>
                  {service.custom_pricing && (
                    <span className="text-xs text-gray-500">starting from</span>
                  )}
                  {!isWalker && <span className="text-xs text-gray-500 block">per session</span>}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{service.description}</p>
              {service.duration_options && service.duration_options.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {service.duration_options.map(duration => (
                    <Badge key={duration} variant="outline" className="text-xs">
                      ⏱️ {duration}
                    </Badge>
                  ))}
                </div>
              )}
              {service.package_options && service.package_options.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Package Options:</p>
                  <div className="space-y-2">
                    {service.package_options.map((pkg, pkgIdx) => (
                      <div key={pkgIdx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{pkg.name} ({pkg.sessions} sessions)</span>
                        <span className={`font-bold ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>€{pkg.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}