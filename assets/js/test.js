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
const yearsInput = document.getElementById("userYearsService");
const loggedHint = document.getElementById("loggedHint");
const submitBtn = document.getElementById("submitBtn");

let currentUser = null;

onAuthStateChanged(auth, async (u) => {
  currentUser = u;
  if (u) {
    emailInput.value = u.email || "";
    emailInput.readOnly = true;
    if (u.displayName && !nameInput.value) nameInput.value = u.displayName;
    loggedHint.classList.remove("hidden");
    // Prellenar desde perfil si existe
    try {
      const psnap = await getDoc(doc(db, "users", u.uid));
      if (psnap.exists()) {
        const p = psnap.data() || {};
        if (p.phone && !phoneInput.value) phoneInput.value = p.phone;
        if ((p.yearsOfService ?? p.workTime) && !yearsInput.value) {
          yearsInput.value = p.yearsOfService ?? p.workTime;
        }
        const full = [p.name, p.lastName].filter(Boolean).join(" ").trim();
        if (full && !nameInput.value) nameInput.value = full;
      }
    } catch (_) {}
  }
});

function render() {
  container.innerHTML = QUESTIONS.map((q, i) => `
    <div class="question-card rounded-2xl border border-slate-200 p-4 sm:p-5 transition" data-q="${i}">
      <div class="flex gap-3 items-start mb-3 sm:mb-4">
        <span class="shrink-0 size-7 rounded-full bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">${String(i+1).padStart(2,"0")}</span>
        <p class="text-sm sm:text-base font-medium leading-snug">${q}</p>
      </div>
      <div class="grid grid-cols-6 gap-1.5 sm:gap-2">
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
  const yearsRaw = yearsInput.value.trim();
  if (yearsRaw === "" || isNaN(Number(yearsRaw)) || Number(yearsRaw) < 0) {
    toast("Indica tus años de servicio", "error");
    yearsInput.focus(); return;
  }
  const yearsOfService = Number(yearsRaw);

  const { answers, missing } = readAnswers();
  if (missing !== -1) {
    const el = document.querySelector(`[data-q="${missing}"]`);
    el.classList.add("error"); el.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Responde todas las preguntas", "error"); return;
  }
  const result = scoreFor(answers);

  submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  try {
    let profile = {};
    if (currentUser) {
      try {
        const psnap = await getDoc(doc(db, "users", currentUser.uid));
        if (psnap.exists()) profile = psnap.data() || {};
      } catch (_) {}
    }

    await addDoc(collection(db, "responses"), {
      email,
      name: profile.name ? `${profile.name} ${profile.lastName || ""}`.trim() : (nameInput.value.trim() || null),
      phone: phoneInput.value.trim() || profile.phone || null,
      yearsOfService,
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
