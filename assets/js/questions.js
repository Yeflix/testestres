// Preguntas y lógica de scoring (basado en OMS/OIT — adaptado para Venezuela / LOPCYMAT)
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
    desc: "Es genial ver que estás logrando mantener el equilibrio y protegiendo tu bienestar en el día a día. Estar en este rango demuestra que has construido hábitos sólidos para gestionar tus responsabilidades sin descuidar tu tranquilidad. Para mantenerte en este estado óptimo, te aconsejo que sigas priorizando tus espacios de ocio, reconozcas activamente qué dinámicas te están funcionando y aproveches esta etapa de estabilidad para seguir creciendo personal y profesionalmente. ¡Sigue cuidando esa paz mental, es tu mejor recurso!" },
  { min: 13, max: 36, level: "Estrés leve", color: "#eab308",
    desc: "Es completamente normal que la rutina empiece a acumular pequeñas tensiones, y qué bueno que te des el espacio para notar estas primeras alarmas que te da tu cuerpo. Recuerda que estás a muy buen tiempo de tomar las riendas de la situación antes de que la carga se vuelva pesada. Te aconsejo que hagas una pausa breve para identificar qué tareas o situaciones específicas te están robando la calma y comiences a aplicar técnicas sencillas de gestión del tiempo, como priorizar lo importante sobre lo urgente y regalarte pausas activas de cinco minutos durante el día. ¡Tienes la capacidad de reorganizarte y recuperar tu centro!" },
  { min: 37, max: 48, level: "Estrés moderado", color: "#f97316",
    desc: "Sé que estás haciendo un esfuerzo enorme por cumplir con todo y que la presión empieza a sentirse muy real, pero recuerda que tu bienestar siempre debe ir primero que cualquier obligación. Estás en un punto de resistencia donde tu cuerpo te pide un cambio, y escuchar esa señal es un acto de valentía, no de debilidad. Te aconsejo firmemente que empieces a establecer límites claros, aprendas a decir NO o a negociar plazos de entrega si te sientes desbordado, y dediques al menos diez minutos al día a desconectarte por completo y practicar respiraciones profundas. ¡Vales mucho más que tu productividad, date el permiso de bajar el ritmo!" },
  { min: 49, max: 60, level: "Estrés grave", color: "#ef4444",
    desc: "Lamento mucho que estés pasando por este nivel de desgaste físico y mental; quiero decirte que no estás solo y que es completamente válido sentir que la situación te supera en este momento. Estás experimentando un agotamiento profundo, pero esto no define tu capacidad, sino que es un recordatorio urgente de que necesitas cuidar de ti con compasión. Mi consejo es que bajes la marcha de inmediato, dejes de exigirte perfección y pongas como prioridad innegociable tus horas de sueño y descanso. Te animo de corazón a que busques el apoyo de un profesional de la salud o la psicología para que te acompañe a sanar y a recuperar tus energías de forma segura." },
  { min: 61, max: 72, level: "Estrés muy grave", color: "#991b1b",
    desc: "Por favor, detente un momento, respira y reconoce que tu salud está en una situación de alerta crítica que requiere toda tu atención inmediata. Quiero que sepas que tu vida y tu integridad física y mental son infinitamente más valiosas que cualquier meta, y que pedir ayuda en este instante es el paso más inteligente y fuerte que puedes dar. Te aconsejo con total urgencia que busques atención médica o psicológica prioritaria para contener los síntomas físicos de este colapso, y que comuniques de inmediato tu estado a las personas correspondientes en tu entorno para ajustar tus responsabilidades. Es momento de parar, protegerte y reestructurar tu bienestar; mereces vivir con tranquilidad." }
];

export function scoreFor(answers) {
  const sum = answers.reduce((a, b) => a + (Number(b) || 0), 0);
  const bucket = RESULTS_MAP.find(r => sum >= r.min && sum <= r.max) || RESULTS_MAP[RESULTS_MAP.length - 1];
  return { sum, ...bucket };
}
