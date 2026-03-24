import React, { memo } from 'react';
import { BadgeCheck, GraduationCap, Dog } from "lucide-react";

// O memo impede o selo de "piscar" em cada atualização de mapa/gps
export const BadgeStatic = memo(({ type }) => {
  const badges = {
    verified: <BadgeCheck size={14} className="text-blue-500 fill-blue-50" />,
    trained: <GraduationCap size={14} className="text-purple-500 fill-purple-50" />,
    pawcao: <Dog size={12} className="text-white" />
  };

  return <div className="transition-all duration-300">{badges[type]}</div>;
});