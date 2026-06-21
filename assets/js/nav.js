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

  // Marca como activo cualquier elemento [data-nav] que coincida con la página actual.
  // Se llama tras crear el nav Y cada vez que se vuelve a pintar #navAuthSlot, porque
  // los links de "Mi panel"/"Admin" viven ahí y se generan después (de forma async).
  function highlightActive() {
    nav.querySelectorAll("[data-nav]").forEach(a => a.classList.remove("text-slate-900", "font-semibold"));
    nav.querySelectorAll(`[data-nav="${activePath}"]`).forEach(a => a.classList.add("text-slate-900", "font-semibold"));
  }
  highlightActive();

  // Helpers del menú móvil. Operan sobre lo que haya AHORA en el DOM (no sobre una
  // referencia capturada), así no importa cuántas veces se vuelva a renderizar el slot.
  function getMenuEls() {
    return {
      menu: slot.querySelector(".mobile-nav-dropdown"),
      btn: slot.querySelector(".mobile-nav-trigger"),
    };
  }
  function toggleMenu(show) {
    const { menu, btn } = getMenuEls();
    if (!menu) return;
    const willShow = show === undefined ? !menu.classList.contains("open") : show;
    menu.classList.toggle("open", willShow);
    btn?.classList.toggle("open", willShow);
  }

  // Listeners GLOBALES: se registran una sola vez por página (aquí, fuera de
  // onAuthStateChanged). Antes se registraban dentro del callback de auth, que puede
  // disparar más de una vez por carga (p. ej. al sincronizar sesión entre pestañas),
  // acumulando listeners en `document` sin límite y rompiendo el menú con el tiempo.
  document.addEventListener("click", (e) => {
    if (!slot.contains(e.target)) toggleMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleMenu(false);
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      slot.innerHTML = `
        <a href="auth.html" class="rounded-full border border-slate-200 px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap">Iniciar sesión</a>
      `;
      return;
    }

    const admin = await isAdminEmail(user.email);

    slot.innerHTML = `
      ${admin ? `<a href="admin.html" data-nav="admin" class="hidden md:inline rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-bold">ADMIN</a>` : ""}

      <!-- Escritorio: link directo a Mi panel -->
      <a href="dashboard.html" data-nav="dashboard" class="hidden sm:inline rounded-full border border-slate-200 px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap">Mi panel</a>

      <!-- Móvil: botón desplegable con todas las opciones -->
      <button type="button" class="sm:hidden mobile-nav-trigger rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5">
        Mi panel <i class="fas fa-chevron-down text-[10px] transition-transform duration-200"></i>
      </button>

      <div class="mobile-nav-dropdown">
        <a href="dashboard.html" class="${activePath === "dashboard" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-user w-4 text-center"></i> Mi panel
        </a>
        <a href="index.html" class="${activePath === "index" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-clipboard-check w-4 text-center"></i> Test
        </a>
        <a href="info.html" class="${activePath === "info" ? "text-slate-900 font-semibold" : ""}">
          <i class="fas fa-info-circle w-4 text-center"></i> Información
        </a>
        ${admin ? `<a href="admin.html" class="${activePath === "admin" ? "text-slate-900 font-semibold" : "text-amber-700 font-bold"}"><i class="fas fa-shield-alt w-4 text-center"></i> Admin</a>` : ""}
        <div class="my-1 h-px bg-slate-100"></div>
        <button type="button" class="logout-mobile text-red-600">
          <i class="fas fa-sign-out-alt w-4 text-center"></i> Salir
        </button>
      </div>

      <button type="button" class="logout-desktop hidden sm:inline rounded-full bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-slate-800 whitespace-nowrap">Salir</button>
    `;

    highlightActive();

    const { menu, btn } = getMenuEls();

    // Estos listeners SÍ se pueden reatachar en cada render: van sobre elementos que
    // se acaban de crear con innerHTML, así que no hay listeners viejos acumulándose
    // (el nodo anterior, con su listener, se descarta junto con el HTML reemplazado).
    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    menu?.querySelectorAll("a, button").forEach(el => {
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
