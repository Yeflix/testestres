import {
  auth, googleProvider, db,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, sendPasswordResetEmail, updateProfile,
  onAuthStateChanged, isAdminEmail,
  doc, getDoc, setDoc, serverTimestamp
} from "./firebase-init.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabs = document.querySelectorAll(".tab-btn");

function showTab(name) {
  tabs.forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("border-slate-900", on);
    t.classList.toggle("border-transparent", !on);
    t.classList.toggle("text-slate-500", !on);
  });
  loginForm.classList.toggle("hidden", name !== "login");
  registerForm.classList.toggle("hidden", name !== "register");
}
tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

const params = new URLSearchParams(location.search);
if (params.get("tab") === "register") showTab("register");
const prefillEmail = params.get("email");
if (prefillEmail) {
  document.getElementById("loginEmail").value = prefillEmail;
  document.getElementById("regEmail").value = prefillEmail;
}

function toast(msg, type="") {
  const t = document.createElement("div");
  t.className = `toast ${type}`; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.remove(); }, 3500);
}

function isProfileComplete(p) {
  if (!p) return false;
  return Boolean(p.name && p.lastName && p.age && p.gender);
}

async function routeAfterLogin(user) {
  const admin = await isAdminEmail(user.email);
  if (admin) { location.href = "admin.html"; return; }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : null;
    if (!isProfileComplete(profile)) {
      location.href = "profile.html?complete=1";
      return;
    }
  } catch (_) {}
  location.href = "dashboard.html";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      document.getElementById("loginEmail").value.trim(),
      document.getElementById("loginPass").value
    );
    await routeAfterLogin(cred.user);
  } catch (err) { toast(traduce(err), "error"); }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      document.getElementById("regEmail").value.trim(),
      document.getElementById("regPass").value
    );
    const name = document.getElementById("regName").value.trim();
    const lastName = document.getElementById("regLastName").value.trim();
    const age = document.getElementById("regAge").value.trim();
    const gender = document.getElementById("regGender").value;
    const cedula = document.getElementById("regCedula").value.trim();
    const workTime = document.getElementById("regWorkTime").value.trim();

    const fullName = `${name} ${lastName}`.trim();
    if (fullName) await updateProfile(cred.user, { displayName: fullName });

    // Guarda perfil completo en Firestore: users/{uid}
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      name, lastName,
      age: age ? Number(age) : null,
      gender,
      cedula: cedula || null,
      workTime: workTime || null,
      createdAt: serverTimestamp(),
    });

    await routeAfterLogin(cred.user);
  } catch (err) { toast(traduce(err), "error"); }
});

document.getElementById("googleBtn").addEventListener("click", async () => {
  try {
    const cred = await signInWithPopup(auth, googleProvider);

    // Con email/contraseña el perfil (nombre, apellido, edad, sexo, cédula...) se
    // guarda en el formulario de registro. Con Google no había ningún paso
    // equivalente, así que el usuario nunca aparecía en users/{uid} y el cruce de
    // datos del panel admin (admin.js) no tenía nada que mostrar para él.
    // No usamos createdAt aquí: con merge:true se reescribiría en cada login,
    // perdiendo la fecha real de creación de la cuenta.
    const display = (cred.user.displayName || "").trim();
    const [first, ...rest] = display.split(/\s+/).filter(Boolean);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      name: first || "",
      lastName: rest.join(" "),
    }, { merge: true });

    await routeAfterLogin(cred.user);
  } catch (err) { toast(traduce(err), "error"); }
});

document.getElementById("forgotBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) return toast("Escribe tu correo arriba primero", "error");
  try { await sendPasswordResetEmail(auth, email); toast("Te enviamos un correo de recuperación", "success"); }
  catch (err) { toast(traduce(err), "error"); }
});

onAuthStateChanged(auth, async (u) => {
  if (u) await routeAfterLogin(u);
});

function traduce(err) {
  const c = err?.code || "";
  const m = {
    "auth/invalid-credential": "Correo o contraseña incorrectos",
    "auth/invalid-email": "Correo inválido",
    "auth/user-not-found": "No existe una cuenta con ese correo",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
    "auth/popup-closed-by-user": "Ventana cerrada antes de completar el ingreso",
  };
  return m[c] || (err?.message || "Error desconocido");
}
