import {
  auth, db, onAuthStateChanged, updateProfile,
  doc, getDoc, setDoc, serverTimestamp
} from "./firebase-init.js";
import { toast } from "./nav.js";

const form = document.getElementById("profileForm");
const saveBtn = document.getElementById("saveBtn");
const hint = document.getElementById("profileHint");

const els = {
  name: document.getElementById("pName"),
  lastName: document.getElementById("pLastName"),
  email: document.getElementById("pEmail"),
  age: document.getElementById("pAge"),
  gender: document.getElementById("pGender"),
  phone: document.getElementById("pPhone"),
  cedula: document.getElementById("pCedula"),
  yearsOfService: document.getElementById("pYearsService"),
};

const params = new URLSearchParams(location.search);
const completeMode = params.get("complete") === "1";
if (completeMode) {
  hint.innerHTML = '<span class="text-emerald-700 font-semibold"><i class="fas fa-circle-info"></i> Completa tus datos personales para finalizar el registro.</span>';
}

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "auth.html"; return; }
  currentUser = user;
  els.email.value = user.email || "";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const p = snap.exists() ? snap.data() : {};

    // Si Google trae displayName y no hay name/lastName en perfil, autocompleta
    let pname = p.name || "";
    let plast = p.lastName || "";
    if ((!pname || !plast) && user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      if (!pname) pname = parts[0] || "";
      if (!plast) plast = parts.slice(1).join(" ") || "";
    }
    els.name.value = pname;
    els.lastName.value = plast;
    els.age.value = p.age || "";
    els.gender.value = p.gender || "";
    els.phone.value = p.phone || "";
    els.cedula.value = p.cedula || "";
    els.yearsOfService.value = p.yearsOfService ?? p.workTime ?? "";
  } catch (err) {
    console.error(err);
    toast("No se pudo cargar tu perfil", "error");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const name = els.name.value.trim();
  const lastName = els.lastName.value.trim();
  const age = els.age.value.trim();
  const gender = els.gender.value;

  if (!name || !lastName || !age || !gender) {
    toast("Completa los campos obligatorios", "error"); return;
  }

  saveBtn.disabled = true;
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  try {
    const fullName = `${name} ${lastName}`.trim();
    if (fullName && fullName !== (currentUser.displayName || "")) {
      try { await updateProfile(currentUser, { displayName: fullName }); } catch (_) {}
    }

    const yrs = els.yearsOfService.value.trim();

    await setDoc(doc(db, "users", currentUser.uid), {
      uid: currentUser.uid,
      email: currentUser.email,
      name,
      lastName,
      age: Number(age),
      gender,
      phone: els.phone.value.trim() || null,
      cedula: els.cedula.value.trim() || null,
      yearsOfService: yrs === "" ? null : Number(yrs),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast("Perfil actualizado", "success");
    setTimeout(() => { location.href = "dashboard.html"; }, 600);
  } catch (err) {
    console.error(err);
    toast("No se pudo guardar. Intenta de nuevo.", "error");
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
});
