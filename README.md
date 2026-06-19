# Astronauta Emocional · Test de Estrés Laboral (NOM-035)

Sitio estático con Firebase Auth + Firestore.

## Estructura

```
index.html       → Test (acceso directo, sin login obligatorio)
info.html        → Página informativa + banner de resultado tras enviar el test
auth.html        → Login / Registro (email/password + Google) + recuperar contraseña
dashboard.html   → Monitoreo del usuario (historial + tendencia)
admin.html       → Panel admin (todos los tests + export Excel)
assets/
  css/styles.css
  js/firebase-init.js   ← config Firebase y helpers
  js/questions.js       ← 12 preguntas + escala + scoring
  js/nav.js             ← navbar compartido con estado de sesión
  js/test.js
  js/auth.js
  js/dashboard.js
  js/admin.js
```

## Flujo

1. La home (`/`) es el test directo. Cualquiera con el link puede tomarlo.
2. Al enviar, se guarda en Firestore (`responses`) y redirige a `info.html`
   con el resultado visible.
3. Si el visitante no tiene cuenta, el banner ofrece registrarse para
   activar el monitoreo mensual.
4. Si ya tiene sesión, el banner enlaza a su `dashboard.html`, donde ve
   historial, promedio y tendencia respecto a su test anterior.
5. Si el correo del usuario coincide con un doc en `admins/`, al iniciar
   sesión es redirigido a `admin.html` (lista de todos los tests + export
   Excel con 2 hojas: Resumen y Detalle por respuesta).

## Configurar admins

En Firebase Console → Firestore → crea la colección `admins` y por cada
correo de administrador crea un documento cuyo **ID sea el correo en
minúsculas**, p. ej.:

```
admins/ricardo@astronautaemocional.com
admins/operaciones@astronautaemocional.com
```

El contenido del documento puede ser un campo simple:
```json
{ "email": "ricardo@astronautaemocional.com" }
```

Para revocar el admin, simplemente borra el documento.

## Habilitar proveedores de autenticación

En Firebase Console → Authentication → Sign-in method, activa:
- **Email/Password**
- **Google**

## Reglas de Firestore sugeridas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.token.email.lower()));
    }

    // Cualquiera puede crear una respuesta (incluso anónimos del link).
    // Solo el dueño (userId) o un admin pueden leer.
    match /responses/{id} {
      allow create: if request.resource.data.keys().hasOnly(
                       ['email','name','phone','userId','isAnonymous','answers','score','level','createdAt'])
                    && request.resource.data.answers.size() == 12
                    && request.resource.data.score is int
                    && request.resource.data.score >= 0
                    && request.resource.data.score <= 72;

      allow read: if isAdmin()
                  || (isSignedIn() && resource.data.userId == request.auth.uid)
                  || (isSignedIn() && resource.data.email == request.auth.token.email.lower());

      allow update, delete: if isAdmin();
    }

    // Solo admins pueden leer la lista de admins
    match /admins/{email} {
      allow read: if isSignedIn();   // necesario para que cada usuario verifique su propio rol
      allow write: if isAdmin();
    }
  }
}
```

> El `read` abierto a usuarios autenticados en `admins/{email}` es necesario
> porque el cliente consulta `admins/{miCorreo}` para saber si es admin.
> Si prefieres mayor restricción, mueve esa verificación a Custom Claims.

## Despliegue

Es 100% estático. Cualquier hosting funciona:
- **Firebase Hosting**: `firebase init hosting` apuntando a la carpeta raíz, luego `firebase deploy`.
- **Netlify / Vercel / GitHub Pages / Cloudflare Pages**: arrastrar la carpeta.

## Notas

- Las claves de Firebase son **publishable** (van en el cliente, no son secretas).
- Toda la lógica corre en el navegador con el SDK modular v12 (importado desde gstatic).
- El Excel se genera en el navegador con SheetJS desde CDN.
