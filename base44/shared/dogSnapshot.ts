// Lógica partilhada para snapshot e comparação de dados do dono (DogProfile)
// Usado por syncGuestProfile e checkOwnerDogUpdates

// Campos do DogProfile relevantes para o prontuário do hotel
export const SNAPSHOT_FIELDS = [
  "breed",
  "age",
  "weight",
  "size",
  "gender",
  "color",
  "photo_url",
  "medical_conditions",
  "allergies",
  "behavioral_notes",
  "energy_level",
  "socialization",
  "accustomed_to_being_alone",
  "vet_name",
  "vet_phone",
  "vet_clinic_name",
  "vet_address",
  "vaccination_date",
  "is_vaccinated",
  "is_neutered",
  "feeding_instructions",
  "special_care_notes",
  "microchip_number",
  "emergency_contact_name",
  "emergency_contact_phone",
  "date_of_birth"
];

// Etiquetas amigáveis para cada campo (PT)
export const FIELD_LABELS = {
  breed: "Raça",
  age: "Idade",
  weight: "Peso (kg)",
  size: "Tamanho",
  gender: "Sexo",
  color: "Cor",
  photo_url: "Foto",
  medical_conditions: "Condições médicas",
  allergies: "Alergias",
  behavioral_notes: "Notas comportamentais",
  energy_level: "Nível de energia",
  socialization: "Socialização",
  accustomed_to_being_alone: "Habituado a estar sozinho",
  vet_name: "Veterinário",
  vet_phone: "Telefone do veterinário",
  vet_clinic_name: "Clínica veterinária",
  vet_address: "Endereço do veterinário",
  vaccination_date: "Data de vacinação",
  is_vaccinated: "Vacinado",
  is_neutered: "Esterilizado",
  feeding_instructions: "Instruções de alimentação",
  special_care_notes: "Notas de cuidado especial",
  microchip_number: "Microchip",
  emergency_contact_name: "Contacto de emergência",
  emergency_contact_phone: "Telefone de emergência",
  date_of_birth: "Data de nascimento"
};

// Cria um snapshot limpo dos campos relevantes do DogProfile
export function createOwnerSnapshot(dogProfile) {
  if (!dogProfile) return null;
  const snapshot = {};
  for (const field of SNAPSHOT_FIELDS) {
    if (dogProfile[field] !== undefined && dogProfile[field] !== null) {
      snapshot[field] = dogProfile[field];
    }
  }
  return snapshot;
}

// Compara dois valores (string, number, boolean) — normaliza strings vazias
function valuesEqual(a, b) {
  const norm = (v) => {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "string") return v.trim();
    return v;
  };
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

// Compara snapshot atual com snapshot guardado, retorna lista de alterações
// Cada alteração: { field, label, oldValue, newValue }
export function diffSnapshots(oldSnapshot, currentSnapshot) {
  const changes = [];
  if (!oldSnapshot) oldSnapshot = {};
  if (!currentSnapshot) currentSnapshot = {};

  for (const field of SNAPSHOT_FIELDS) {
    const oldVal = oldSnapshot[field];
    const newVal = currentSnapshot[field];
    if (!valuesEqual(oldVal, newVal)) {
      changes.push({
        field,
        label: FIELD_LABELS[field] || field,
        oldValue: oldVal ?? "",
        newValue: newVal ?? ""
      });
    }
  }
  return changes;
}