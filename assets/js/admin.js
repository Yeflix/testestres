import {
  auth, db, onAuthStateChanged,
  collection, query, orderBy, getDocs, isAdminEmail
} from "./firebase-init.js";
import { QUESTIONS, SCALE_LABELS, RESULTS_MAP } from "./questions.js";

let ALL = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "auth.html"; return; }
  const admin = await isAdminEmail(user.email);
  if (!admin) { alert("No tienes permisos de administrador."); location.href = "dashboard.html"; return; }

  const snap = await getDocs(query(collection(db, "responses"), orderBy("createdAt", "desc")));
  ALL = snap.docs.map(d => {
    const x = d.data();
    return { id: d.id, ...x, createdAt: x.createdAt?.toDate?.() || null };
  });
  renderStats();
  applyFilters();
});

function colorFor(level) { return (RESULTS_MAP.find(r => r.level === level) || {}).color || "#64748b"; }

function renderStats() {
  const total = ALL.length;
  const uniqueEmails = new Set(ALL.map(r => (r.email || "").toLowerCase())).size;
  const avg = total ? Math.round(ALL.reduce((a, b) => a + (b.score || 0), 0) / total) : 0;
  const high = ALL.filter(r => ["Estrés grave", "Estrés muy grave"].includes(r.level)).length;

  document.getElementById("adminStats").innerHTML = [
    ["Tests totales", total, "fa-clipboard-list"],
    ["Personas únicas", uniqueEmails, "fa-users"],
    ["Puntaje promedio", `${avg}/72`, "fa-chart-line"],
    ["Casos graves", high, "fa-triangle-exclamation"],
  ].map(([l, v, ic]) => `
    <div class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-center gap-3">
        <span class="size-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700"><i class="fas ${ic}"></i></span>
        <span class="font-mono text-[10px] text-slate-500 uppercase tracking-widest">${l}</span>
      </div>
      <p class="mt-3 text-2xl font-extrabold">${v}</p>
    </div>`).join("");
}

function applyFilters() {
  const s = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const lvl = document.getElementById("levelFilter").value;
  const type = document.getElementById("typeFilter").value;

  const filtered = ALL.filter(r => {
    if (s && !(`${r.email||""} ${r.name||""}`).toLowerCase().includes(s)) return false;
    if (lvl && r.level !== lvl) return false;
    if (type === "registered" && !r.userId) return false;
    if (type === "anonymous" && r.userId) return false;
    return true;
  });
  renderRows(filtered);
}

["searchInput", "levelFilter", "typeFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", applyFilters);
  document.getElementById(id).addEventListener("change", applyFilters);
});

function renderRows(rows) {
  const tb = document.getElementById("adminTbody");
  const empty = document.getElementById("adminEmpty");
  empty.classList.toggle("hidden", rows.length > 0);

  tb.innerHTML = rows.map((r, i) => {
    const date = r.createdAt ? r.createdAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : "—";
    const typ = r.userId
      ? `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">Registrado</span>`
      : `<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">Anónimo</span>`;
    const answersHTML = (r.answers || []).map((a, idx) => `
        <tr class="border-t border-slate-100">
          <td class="px-3 py-2 text-slate-500 font-mono text-[11px] w-8">${String(idx+1).padStart(2,"0")}</td>
          <td class="px-3 py-2">${QUESTIONS[idx] || ""}</td>
          <td class="px-3 py-2 font-mono font-bold">${a ?? "—"}</td>
          <td class="px-3 py-2 text-slate-500">${a ? SCALE_LABELS[a-1] : ""}</td>
        </tr>`).join("");
    return `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3">
          <button data-toggle="${i}" class="text-slate-400 hover:text-slate-900"><i class="fas fa-chevron-right transition-transform"></i></button>
        </td>
        <td class="px-4 py-3 text-slate-700 whitespace-nowrap">${date}</td>
        <td class="px-4 py-3">${r.name || "<span class='text-slate-400'>—</span>"}</td>
        <td class="px-4 py-3 font-mono text-xs">${r.email || ""}</td>
        <td class="px-4 py-3 text-slate-600">${r.phone || "<span class='text-slate-300'>—</span>"}</td>
        <td class="px-4 py-3 font-mono font-bold">${r.score}/72</td>
        <td class="px-4 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold" style="background:${colorFor(r.level)}1a;color:${colorFor(r.level)}">${r.level}</span></td>
        <td class="px-4 py-3">${typ}</td>
      </tr>
      <tr id="details-${i}" class="hidden bg-slate-50/60">
        <td colspan="8" class="px-8 py-4">
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr><th class="text-left px-3 py-2">#</th><th class="text-left px-3 py-2">Pregunta</th><th class="text-left px-3 py-2">Valor</th><th class="text-left px-3 py-2">Escala</th></tr>
              </thead>
              <tbody>${answersHTML}</tbody>
            </table>
          </div>
        </td>
      </tr>`;
  }).join("");

  tb.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.toggle;
      const det = document.getElementById(`details-${i}`);
      det.classList.toggle("hidden");
      btn.querySelector("i").classList.toggle("rotate-90");
    });
  });
}

// ============ EXPORT EXCEL ============
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!ALL.length) return alert("No hay datos para exportar.");

  // Hoja 1: Resumen completo (incluye datos personales + preguntas seleccionadas)
  const summary = ALL.map(r => {
    const row = {
      Fecha: r.createdAt ? r.createdAt.toLocaleString("es-VE") : "",
      Nombre: r.name || "",
      Apellido: r.lastName || "",
      Correo: r.email || "",
      Teléfono: r.phone || "",
      Cédula: r.cedula || "",
      Edad: r.age || "",
      Sexo: r.gender || "",
      "Tiempo laborando": r.workTime || "",
      Puntaje: r.score,
      Nivel: r.level,
    };
    QUESTIONS.forEach((q, idx) => {
      const v = r.answers?.[idx];
      row[`P${idx+1}. ${q}`] = v ? `${v} - ${SCALE_LABELS[v-1]}` : "";
    });
    return row;
  });

  // Hoja 2: Detalle vertical (una fila por respuesta) - para análisis pivote
  const detailLong = [];
  ALL.forEach(r => {
    const fecha = r.createdAt ? r.createdAt.toLocaleString("es-VE") : "";
    QUESTIONS.forEach((q, idx) => {
      const v = r.answers?.[idx];
      detailLong.push({
        Fecha: fecha,
        Correo: r.email || "",
        Nombre: `${r.name || ""} ${r.lastName || ""}`.trim(),
        "N° Pregunta": idx + 1,
        Pregunta: q,
        "Valor (1-6)": v ?? "",
        "Respuesta seleccionada": v ? SCALE_LABELS[v-1] : "",
      });
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Respuestas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailLong), "Detalle por pregunta");

  const stamp = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `tests-estres-${stamp}.xlsx`);
});
