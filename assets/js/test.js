import { QUESTIONS, SCALE_LABELS, scoreFor } from "./questions.js";
import { auth, db, onAuthStateChanged, addDoc, collection, serverTimestamp, doc, getDoc } from "./firebase-init.js";
import { toast } from "./nav.js";

const form = document.getElementById("stressForm");
const container = document.getElementById("questionsContainer");
const progressBar = document.getElementById("progressBar");
const progressCount = document.getElementById("progressCount");
const emailInput = document.getElementById("userEmail");
const nameInput = document.getElementById("userName");
const phoneInput = document.getElementById("userPhone");
const loggedHint = document.getElementById("loggedHint");
const submitBtn = document.getElementById("submitBtn");

let currentUser = null;

onAuthStateChanged(auth, (u) => {
  currentUser = u;
  if (u) {
    emailInput.value = u.email || "";
    emailInput.readOnly = true;
    if (u.displayName && !nameInput.value) nameInput.value = u.displayName;
    loggedHint.classList.remove("hidden");
  }
});

function render() {
  container.innerHTML = QUESTIONS.map((q, i) => `
    <div class="question-card rounded-2xl border border-slate-200 p-5 transition" data-q="${i}">
      <div class="flex gap-3 items-start mb-4">
        <span class="shrink-0 size-7 rounded-full bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">${String(i+1).padStart(2,"0")}</span>
        <p class="text-base font-medium leading-snug">${q}</p>
      </div>
      <div class="grid grid-cols-6 gap-2">
        ${[1,2,3,4,5,6].map(v => `
          <label class="scale-btn" data-v="${v}" title="${SCALE_LABELS[v-1]}">
            <input type="radio" name="q${i}" value="${v}" />
            <div class="swatch">${v}</div>
          </label>`).join("")}
      </div>
      <div class="flex justify-between mt-2 px-1 font-mono text-[10px] uppercase tracking-tight text-slate-500">
        <span>Nunca</span><span>Muy frecuente</span>
      </div>
    </div>`).join("");

  container.querySelectorAll('input[type=radio]').forEach(r =>
    r.addEventListener("change", updateProgress));
}

function updateProgress() {
  let answered = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (document.querySelector(`input[name="q${i}"]:checked`)) answered++;
  }
  progressCount.textContent = answered;
  progressBar.style.width = `${(answered / QUESTIONS.length) * 100}%`;
}

function readAnswers() {
  const answers = [];
  let missing = -1;
  for (let i = 0; i < QUESTIONS.length; i++) {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    document.querySelector(`[data-q="${i}"]`).classList.remove("error");
    if (!sel) { if (missing === -1) missing = i; answers.push(null); }
    else answers.push(Number(sel.value));
  }
  return { answers, missing };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    toast("Ingresa un correo válido", "error");
    emailInput.focus(); return;
  }
  const { answers, missing } = readAnswers();
  if (missing !== -1) {
    const el = document.querySelector(`[data-q="${missing}"]`);
    el.classList.add("error"); el.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Responde todas las preguntas", "error"); return;
  }
  const result = scoreFor(answers);

  submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  try {
    // Si esta logueado, intenta obtener perfil para enriquecer la respuesta
    let profile = {};
    if (currentUser) {
      try {
        const psnap = await getDoc(doc(db, "users", currentUser.uid));
        if (psnap.exists()) profile = psnap.data() || {};
      } catch (_) {}
    }

    await addDoc(collection(db, "responses"), {
      email,
      name: profile.name || nameInput.value.trim() || null,
      lastName: profile.lastName || null,
      phone: phoneInput.value.trim() || null,
      cedula: profile.cedula || null,
      age: profile.age || null,
      gender: profile.gender || null,
      workTime: profile.workTime || null,
      userId: currentUser?.uid || null,
      isAnonymous: !currentUser,
      answers,
      score: result.sum,
      level: result.level,
      createdAt: serverTimestamp(),
    });
    const params = new URLSearchParams({
      score: result.sum, level: result.level, email,
      from: currentUser ? "user" : "anon",
    });
    location.href = `info.html?${params.toString()}`;
  } catch (err) {
    console.error(err);
    toast("Error al guardar. Verifica tu conexión.", "error");
    submitBtn.disabled = false; submitBtn.innerHTML = 'Ver mi resultado <i class="fas fa-arrow-right ml-1 text-xs"></i>';
  }
});

render();
