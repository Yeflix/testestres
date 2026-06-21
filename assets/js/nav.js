// ============= Navbar dinámico con estado de sesión, presente en todas las páginas =============
import { auth, onAuthStateChanged, signOut, isAdminEmail } from "./firebase-init.js";

export function mountNav(activePath = "") {
  const nav = document.createElement("nav");
  nav.className = "sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md";
  nav.innerHTML = `
    <div class="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
      <a href="index.html" class="flex min-w-0 items-center gap-2 sm:gap-3">
        <div class="size-7 sm:size-8 shrink-0 rounded-full bg-gradient-to-tr from-slate-900 via-emerald-500 to-teal-400"></div>
        <span class="truncate text-xs sm:text-sm font-bold tracking-tight uppercase">Astronauta Emocional</span>
      </a>
      <div class="flex shrink-0 items-center gap-1.5 sm:gap-4 text-sm">
        <a href="index.html" data-nav="index" class="hidden sm:inline text-slate-600 hover:text-slate-900 font-medium">Test</a>
        <a href="info.html" data-nav="info" class="hidden sm:inline text-slate-600 hover:text-slate-900 font-medium">Información</a>
        <div id="navAuthSlot" class="relative flex items-center gap-1.5 sm:gap-2"></div>
      </div>
    </div>`;
  document.body.prepend(nav);

  const slot = nav.querySelector("#navAuthSlot");
  nav.querySelectorAll(`[data-nav="${activePath}"]`).forEach(a => a.classList.add("text-slate-900", "font-semibold"));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      slot.innerHTML = `
        <a href="auth.html" class="rounded-full border border-slate-200 px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap">Iniciar sesión</a>
      `;
      return;
    }

    const admin = await isAdminEmail(user.email);
    const menuId = "mobileMenu" + Math.random().toString(36).slice(2, 9);

    slot.innerHTML = `
      ${admin ? `<a href="admin.html" class="hidden md:inline rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-bold">ADMIN</a>` : ""}

      <!-- Escritorio: link directo a Mi panel -->
      <a href="dashboard.html" class="hidden sm:inline rounded-full border border-slate-200 px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap">Mi panel</a>

      <!-- Móvil: botón desplegable con todas las opciones -->
      <button id="${menuId}Btn" type="button" class="sm:hidden mobile-nav-trigger rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5">
        Mi panel <i class="fas fa-chevron-down text-[10px] transition-transform duration-200"></i>
      </button>

      <div id="${menuId}" class="mobile-nav-dropdown">
        <a href="dashboard.html" class="${activePath === "" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-user w-4 text-center"></i> Mi panel
        </a>
        <a href="index.html" class="${activePath === "index" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-clipboard-check w-4 text-center"></i> Test
        </a>
        <a href="info.html" class="${activePath === "info" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-info-circle w-4 text-center"></i> Información
        </a>
        ${admin ? `<a href="admin.html" class="text-amber-700 font-bold"><i class="fas fa-shield-alt w-4 text-center"></i> Admin</a>` : ""}
        <div class="my-1 h-px bg-slate-100"></div>
        <button type="button" class="logout-mobile text-red-600">
          <i class="fas fa-sign-out-alt w-4 text-center"></i> Salir
        </button>
      </div>

      <button type="button" class="logout-desktop hidden sm:inline rounded-full bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-800 whitespace-nowrap">Salir</button>
    `;

    // Destaca la opción activa en el menú móvil (dashboard = activePath vacío)
    const menu = slot.querySelector(`#${menuId}`);
    const btn = slot.querySelector(`#${menuId}Btn`);

    function toggleMenu(show) {
      const willShow = show === undefined ? !menu.classList.contains("open") : show;
      menu.classList.toggle("open", willShow);
      btn.classList.toggle("open", willShow);
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", (e) => {
      if (!slot.contains(e.target)) toggleMenu(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleMenu(false);
    });

    // Cerrar menú al hacer clic en cualquier opción del dropdown
    menu.querySelectorAll("a, button").forEach(el => {
      el.addEventListener("click", () => toggleMenu(false));
    });

    // Logout: ambos botones (desktop y móvil)
    slot.querySelectorAll(".logout-desktop, .logout-mobile").forEach(btnLogout => {
      btnLogout.addEventListener("click", async () => {
        await signOut(auth);
        location.href = "index.html";
      });
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
