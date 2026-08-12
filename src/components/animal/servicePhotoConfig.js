// Configuração das fotos categorizadas por tipo de serviço
export const SERVICE_PHOTO_TABS = [
  {
    key: 'grooming',
    label: 'Banho & Tosquia',
    icon: '✂️',
    description: 'Ajuda o profissional a avaliar a pelagem e o estado do pêlo antes do banho/tosquia.',
    categories: [
      { key: 'full_body', label: 'Corpo Completo', hint: 'Foto de frente e de lado' },
      { key: 'head_face', label: 'Focinho/Cabeça', hint: 'Detalhe do focinho e olhos' },
      { key: 'coat_condition', label: 'Pelagem', hint: 'Estado do pêlo em close' },
      { key: 'problem_areas', label: 'Áreas Problemáticas', hint: 'Nós, zonas emaranhadas, pele' },
    ],
  },
  {
    key: 'hotel',
    label: 'Hotel/Creche',
    icon: '🏨',
    description: 'Para o hotel conhecer o animal antes da estadia.',
    categories: [
      { key: 'general_state', label: 'Estado Geral', hint: 'Foto do animal saudável' },
      { key: 'space_company', label: 'Espaço/Companhia', hint: 'Animal com outros cães ou no espaço' },
    ],
  },
  {
    key: 'walk',
    label: 'Passeio',
    icon: '🐾',
    description: 'Para o passeador identificar o animal no local de encontro.',
    categories: [
      { key: 'portrait', label: 'Retrato', hint: 'Foto clara do focinho' },
      { key: 'body_movement', label: 'Corpo em movimento', hint: 'Animal a caminhar/brincar' },
    ],
  },
  {
    key: 'training',
    label: 'Treino',
    icon: '🎓',
    description: 'Para o treinador avaliar postura e comportamento.',
    categories: [
      { key: 'portrait', label: 'Retrato', hint: 'Foto atenta do animal' },
      { key: 'behavior', label: 'Comportamento', hint: 'Animal em contexto de treino' },
    ],
  },
];

export const getServiceCategories = (serviceKey) =>
  SERVICE_PHOTO_TABS.find((s) => s.key === serviceKey)?.categories || [];

export const emptyServicePhotos = () => {
  const obj = {};
  SERVICE_PHOTO_TABS.forEach((s) => {
    obj[s.key] = {};
    s.categories.forEach((c) => {
      obj[s.key][c.key] = [];
    });
  });
  return obj;
};

export const countServicePhotos = (servicePhotos) => {
  if (!servicePhotos) return 0;
  let total = 0;
  Object.values(servicePhotos).forEach((cats) => {
    if (!cats || typeof cats !== 'object') return;
    Object.values(cats).forEach((arr) => {
      if (Array.isArray(arr)) total += arr.length;
    });
  });
  return total;
};

export const countServicePhotosByType = (servicePhotos, serviceKey) => {
  const cats = servicePhotos?.[serviceKey];
  if (!cats || typeof cats !== 'object') return 0;
  return Object.values(cats).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
};