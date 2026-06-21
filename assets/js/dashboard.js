import {
  auth, db, onAuthStateChanged,
  collection, query, where, orderBy, getDocs
} from "./firebase-init.js";
import { RESULTS_MAP } from "./questions.js";
import { toast } from "./nav.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "auth.html"; return; }
  document.getElementById("userName").textContent = user.displayName || user.email;

  try {
    // Carga responses del usuario por userId O por email (para que se vean
    // tests hechos anónimamente antes del registro, con el mismo correo).
    const q1 = query(collection(db, "responses"), where("userId", "==", user.uid));
    const q2 = query(collection(db, "responses"), where("email", "==", user.email.toLowerCase()));

    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const seen = new Set();
    const items = [];
    [...s1.docs, ...s2.docs].forEach(d => {
      if (seen.has(d.id)) return; seen.add(d.id);
      const data = d.data();
      items.push({ id: d.id, ...data, createdAt: data.createdAt?.toDate?.() || null });
    });
    items.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    renderStats(items);
    renderHistory(items);
  } catch (err) {
    console.error(err);
    toast("No se pudo cargar tu historial. Revisa tu conexión.", "error");
  }
});

function colorFor(level) {
  return (RESULTS_MAP.find(r => r.level === level) || {}).color || "#64748b";
}

function renderStats(items) {
  const grid = document.getElementById("statsGrid");
  if (!items.length) { grid.innerHTML = ""; return; }
  const last = items[0];
  const prev = items[1];
  const avg = Math.round(items.reduce((a, b) => a + (b.score || 0), 0) / items.length);
  const diff = prev ? last.score - prev.score : null;
  const trend = diff === null ? "—" : diff < 0 ? `↓ ${Math.abs(diff)} pts` : diff > 0 ? `↑ ${diff} pts` : "= sin cambios";
  const trendColor = diff === null ? "text-slate-500" : diff < 0 ? "text-emerald-600" : diff > 0 ? "text-red-600" : "text-slate-500";

  grid.innerHTML = `
    <div class="rounded-2xl border border-slate-200 bg-white p-6">
      <span class="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Último resultado</span>
      <p class="mt-1 text-3xl font-extrabold" style="color:${colorFor(last.level)}">${last.score}<span class="text-base font-normal text-slate-400"> / 72</span></p>
      <p class="text-sm font-semibold" style="color:${colorFor(last.level)}">${last.level}</p>
    </div>
    <div class="rounded-2xl border border-slate-200 bg-white p-6">
      <span class="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Promedio histórico</span>
      <p class="mt-1 text-3xl font-extrabold">${avg}<span class="text-base font-normal text-slate-400"> / 72</span></p>
      <p class="text-sm text-slate-500">${items.length} evaluación${items.length===1?"":"es"}</p>
    </div>
    <div class="rounded-2xl border border-slate-200 bg-white p-6">
      <span class="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Tendencia vs anterior</span>
      <p class="mt-1 text-3xl font-extrabold ${trendColor}">${trend}</p>
      <p class="text-sm text-slate-500">${diff === null ? "Necesitas más de una evaluación" : diff < 0 ? "¡Vas mejorando!" : diff > 0 ? "Atención: subiste de nivel" : "Estable"}</p>
    </div>
  `;
}

function renderHistory(items) {
  const body = document.getElementById("historyBody");
  const empty = document.getElementById("historyEmpty");
  const table = document.getElementById("historyTable");
  document.getElementById("countBadge").textContent = `${items.length} registro${items.length===1?"":"s"}`;

  if (!items.length) { empty.classList.remove("hidden"); table.classList.add("hidden"); return; }

  body.innerHTML = items.map((it, i) => {
    const date = it.createdAt ? it.createdAt.toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" }) : "—";
    const next = items[i+1];
    const diff = next ? it.score - next.score : null;
    const tr = diff === null ? "—" : diff < 0 ? `<span class="text-emerald-600">↓ ${Math.abs(diff)}</span>` : diff > 0 ? `<span class="text-red-600">↑ ${diff}</span>` : `<span class="text-slate-500">=</span>`;
    return `
      <tr>
        <td class="px-4 sm:px-6 py-3 text-slate-700">${date}</td>
        <td class="px-4 sm:px-6 py-3 font-mono font-bold">${it.score}</td>
        <td class="px-4 sm:px-6 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold" style="background:${colorFor(it.level)}1a;color:${colorFor(it.level)}">${it.level}</span></td>
        <td class="px-4 sm:px-6 py-3 font-mono text-sm">${tr}</td>
      </tr>`;
  }).join("");
}
