// Preguntas y lógica de scoring (NOM-035 / IMSS)
export const QUESTIONS = [
  "Imposibilidad de conciliar el sueño",
  "Jaquecas y dolores de cabeza",
  "Indigestiones o molestias gastrointestinales",
  "Sensación de cansancio extremo o agotamiento",
  "Tendencia de comer, beber o fumar más de lo habitual",
  "Disminución del interés sexual",
  "Respiración entrecortada o sensación de ahogo",
  "Disminución del apetito",
  "Temblores musculares (tics nerviosos o parpadeos)",
  "Pinchazos o sensaciones dolorosas en distintas partes del cuerpo",
  "Tentaciones fuertes de no levantarse por la mañana",
  "Tendencias a sudar o palpitaciones"
];

export const SCALE_LABELS = [
  "Nunca", "Casi nunca", "Pocas veces",
  "Algunas veces", "Relativamente frecuente", "Muy frecuente"
];

export const RESULTS_MAP = [
  { min: 0, max: 12, level: "Sin estrés", color: "#10b981",
    desc: "No existe síntoma alguno de estrés. No estás expuesto a factores de riesgo psicosocial significativos. ¡Cuida tu bienestar!" },
  { min: 13, max: 36, level: "Estrés leve", color: "#eab308",
    desc: "Fase de alarma: presentas algunos síntomas. Identifica los factores que lo causan para ocuparte de ellos de manera preventiva." },
  { min: 37, max: 48, level: "Estrés moderado", color: "#f97316",
    desc: "Más signos de estrés laboral. Haz conciencia y actúa: los síntomas podrían agotar tu resistencia." },
  { min: 49, max: 60, level: "Estrés grave", color: "#ef4444",
    desc: "Fase de agotamiento de recursos fisiológicos: desgaste físico y mental con consecuencias serias para tu salud." },
  { min: 61, max: 72, level: "Estrés muy grave", color: "#991b1b",
    desc: "Es primordial buscar ayuda médica. Implementa cambios de raíz y considera acompañamiento profesional." }
];

export function scoreFor(answers) {
  const sum = answers.reduce((a, b) => a + (Number(b) || 0), 0);
  const bucket = RESULTS_MAP.find(r => sum >= r.min && sum <= r.max) || RESULTS_MAP[RESULTS_MAP.length - 1];
  return { sum, ...bucket };
}
