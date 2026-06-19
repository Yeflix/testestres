// Navbar dinámico con estado de sesión, presente en todas las páginas
import { auth, onAuthStateChanged, signOut, isAdminEmail } from "./firebase-init.js";

export function mountNav(activePath = "") {
  const nav = document.createElement("nav");
  nav.className = "sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md";
  nav.innerHTML = `
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
      <a href="index.html" class="flex items-center gap-3">
        <div class="size-8 rounded-full bg-gradient-to-tr from-slate-900 via-emerald-500 to-teal-400"></div>
        <span class="text-sm font-bold tracking-tight uppercase">Astronauta Emocional</span>
      </a>
      <div class="flex items-center gap-2 md:gap-4 text-sm">
        <a href="index.html" data-nav="index" class="hidden sm:inline text-slate-600 hover:text-slate-900 font-medium">Test</a>
        <a href="info.html" data-nav="info" class="hidden sm:inline text-slate-600 hover:text-slate-900 font-medium">Información</a>
        <div id="navAuthSlot" class="flex items-center gap-2"></div>
      </div>
    </div>`;
  document.body.prepend(nav);

  const slot = nav.querySelector("#navAuthSlot");
  nav.querySelectorAll(`[data-nav="${activePath}"]`).forEach(a => a.classList.add("text-slate-900", "font-semibold"));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      slot.innerHTML = `
        <a href="auth.html" class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">Iniciar sesión</a>
      `;
      return;
    }
    const admin = await isAdminEmail(user.email);
    slot.innerHTML = `
      ${admin ? `<a href="admin.html" class="hidden md:inline rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-bold">ADMIN</a>` : ""}
      <a href="dashboard.html" class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">Mi panel</a>
      <button id="logoutBtn" class="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800">Salir</button>
    `;
    slot.querySelector("#logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      location.href = "index.html";
    });
  });
}

export function toast(msg, type = "") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3000);
}
