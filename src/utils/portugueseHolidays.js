/**
 * Feriados nacionais de Portugal
 * Suporta feriados fixos e móveis (Páscoa e derivados)
 */

// Feriados fixos em Portugal
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: "Ano Novo" },
  { month: 1, day: 30, name: "Dia da Liberdade" },
  { month: 2, day: 25, name: "Dia da Liberdade" },
  { month: 4, day: 1, name: "Dia do Trabalhador" },
  { month: 9, day: 5, name: "Implantação da República" },
  { month: 10, day: 1, name: "Dia da Independência" },
  { month: 10, day: 30, name: "Dia do Armistício" },
  { month: 10, day: 5, name: "Proclamação da República" },
  { month: 11, day: 1, name: "Dia de Todos os Santos" },
  { month: 11, day: 25, name: "Dia da Restauração" },
  { month: 11, day: 25, name: "Natal" },
];

// Função para calcular a Páscoa (algoritmo de Computus)
function easterDate(year) {
  let a = year % 19;
  let b = Math.floor(year / 100);
  let c = year % 100;
  let d = Math.floor(b / 4);
  let e = b % 4;
  let f = Math.floor((b + 8) / 25);
  let g = Math.floor((b - f + 1) / 3);
  let h = (19 * a + b - d - g + 15) % 30;
  let i = Math.floor(c / 4);
  let k = c % 4;
  let l = (32 + 2 * e + 2 * i - h - k) % 7;
  let m = Math.floor((a + 11 * h + 22 * l) / 451);
  let month = Math.floor((h + l - 7 * m + 114) / 31);
  let day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Feriados móveis baseados na Páscoa
function getMovableHolidays(year) {
  const easter = easterDate(year);
  const easterTime = easter.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return [
    { date: new Date(easterTime - 2 * oneDayMs), name: "Sexta-feira Santa" },
    { date: new Date(easterTime), name: "Páscoa" },
    { date: new Date(easterTime + oneDayMs), name: "Seginda-feira de Páscoa" },
    { date: new Date(easterTime + 39 * oneDayMs), name: "Dia da Ascensão" },
    { date: new Date(easterTime + 49 * oneDayMs), name: "Pentecostes" },
    { date: new Date(easterTime + 50 * oneDayMs), name: "Corpo de Deus" },
  ];
}

/**
 * Verifica se uma data é feriado em Portugal
 * @param {Date} date - Data a verificar
 * @returns {boolean}
 */
export function isPortugueseHoliday(date) {
  if (!date) return false;

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Verifica feriados fixos
  const isFixedHoliday = FIXED_HOLIDAYS.some(h => h.month === month && h.day === day);
  if (isFixedHoliday) return true;

  // Verifica feriados móveis
  const movableHolidays = getMovableHolidays(year);
  return movableHolidays.some(h => {
    const hDate = new Date(h.date);
    return hDate.getFullYear() === year && hDate.getMonth() === month && hDate.getDate() === day;
  });
}

/**
 * Verifica se uma data é domingo
 * @param {Date} date - Data a verificar
 * @returns {boolean}
 */
export function isSunday(date) {
  if (!date) return false;
  return new Date(date).getDay() === 0;
}

/**
 * Verifica se uma data está bloqueada baseado na política de check-in/out
 * @param {Date} date - Data a verificar
 * @param {string} policy - Política: 'all_days', 'no_sundays', 'no_sundays_holidays'
 * @returns {boolean} true se a data está bloqueada
 */
export function isDateBlocked(date, policy) {
  if (!date || !policy) return false;

  if (policy === "all_days") return false;

  const sunday = isSunday(date);

  if (policy === "no_sundays") {
    return sunday;
  }

  if (policy === "no_sundays_holidays") {
    return sunday || isPortugueseHoliday(date);
  }

  return false;
}

/**
 * Obtém a descrição legível da política
 * @param {string} policy - Código da política
 * @returns {string}
 */
export function getPolicyLabel(policy) {
  const labels = {
    all_days: "Disponível todos os dias",
    no_sundays: "Indisponível aos Domingos",
    no_sundays_holidays: "Indisponível aos Domingos e Feriados",
  };
  return labels[policy] || policy;
}