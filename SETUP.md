# Guía de Configuración — Firebase + Firestore

Sigue estos pasos en orden. Tarda unos 10 minutos.

---

## Paso 1 — Crear un proyecto en Firebase

1. Ve a **[https://console.firebase.google.com](https://console.firebase.google.com)** e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Agregar proyecto"** (o "Create a project").
3. Elige un nombre, ej.: `cybersecurity-site`.
4. Desactiva Google Analytics (no lo necesitamos) → **"Crear proyecto"**.
5. Espera que se cree (unos 30 segundos) → **"Continuar"**.

---

## Paso 2 — Registrar una app Web

Dentro de tu proyecto de Firebase:

1. Haz clic en el icono **`</>`** (Web) en la pantalla principal.
2. Pon un nombre, ej.: `Mi web de ciberseguridad`. No marques Firebase Hosting por ahora.
3. Haz clic en **"Registrar app"**.
4. Verás un bloque de código como este — **cópialo, lo usarás en el Paso 5**:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mi-proyecto.firebaseapp.com",
  projectId: "mi-proyecto",
  storageBucket: "mi-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Haz clic en **"Continuar a la consola"**.

> ℹ️ **¿Es seguro que la config esté en el HTML/JS público?**
> Sí. La `apiKey` de Firebase NO es una clave secreta — es un identificador público.
> La seguridad real viene de las **Reglas de Firestore** (Paso 4).

---

## Paso 3 — Activar Firestore

1. En el menú izquierdo de Firebase Console → **"Compilación"** → **"Firestore Database"**.
2. Clic en **"Crear base de datos"**.
3. Selecciona **"Comenzar en modo de producción"** (las reglas del Paso 4 lo controlan todo).
4. Elige la región más cercana a ti:
   - Europa: `europe-west1` (Bélgica)
   - Latinoamérica: `us-central1` (Iowa, más cercana)
5. Haz clic en **"Habilitar"**.

---

## Paso 4 — Configurar las Reglas de Seguridad

Las reglas controlan quién puede leer y escribir. Esta configuración permite:
- ✅ Cualquiera puede **leer** comentarios
- ✅ Cualquiera puede **crear** un comentario (con validación estricta)
- ❌ Nadie puede **editar ni borrar** comentarios

En Firebase Console → **Firestore** → pestaña **"Reglas"**, reemplaza TODO el contenido con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comentarios/{doc} {

      // Lectura pública
      allow read: if true;

      // Solo se permiten documentos con exactamente 3 campos válidos
      allow create: if
        request.resource.data.keys().hasOnly(['nombre', 'mensaje', 'timestamp']) &&
        request.resource.data.nombre  is string &&
        request.resource.data.nombre.size()  >= 2 &&
        request.resource.data.nombre.size()  <= 50 &&
        request.resource.data.mensaje is string &&
        request.resource.data.mensaje.size() >= 10 &&
        request.resource.data.mensaje.size() <= 500 &&
        request.resource.data.timestamp == request.time;

      // Nadie puede editar ni eliminar
      allow update, delete: if false;
    }
  }
}
```

Haz clic en **"Publicar"**.

---

## Paso 5 — Pegar tu configuración en app.js

1. Abre el archivo `app.js` de este proyecto.
2. Busca el bloque `const firebaseConfig = { ... }` (línea ~12).
3. Reemplaza los valores de ejemplo con los que copiaste en el Paso 2.

**Antes:**
```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  ...
};
```

**Después (ejemplo con tus datos reales):**
```js
const firebaseConfig = {
  apiKey: "AIzaSyXxxxxxxxxxxxxxxxxxxxx",
  authDomain: "cybersecurity-site.firebaseapp.com",
  projectId: "cybersecurity-site",
  storageBucket: "cybersecurity-site.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:abcdef123456"
};
```

Guarda el archivo.

---

## Paso 6 — Probar en local

> ⚠️ **Los módulos ES (`type="module"`) no funcionan desde `file://`.**
> Necesitas un servidor local mínimo. Opciones simples:

**Opción A — Python (sin instalar nada extra en macOS/Linux):**
```bash
# Desde la carpeta del proyecto:
python3 -m http.server 8080
```
Luego abre: `http://localhost:8080`

**Opción B — VS Code con Live Server:**
1. Instala la extensión **"Live Server"** en VS Code.
2. Clic derecho en `index.html` → **"Open with Live Server"**.

**Opción C — Node.js (solo como servidor de desarrollo):**
```bash
npx serve .
```

---

## Paso 7 — Desplegar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub (puede ser privado o público).
2. Sube los 3 archivos: `index.html`, `style.css`, `app.js`.

```bash
git init
git add index.html style.css app.js
git commit -m "Primer despliegue"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

3. Ve al repositorio en GitHub → **Settings** → **Pages**.
4. En "Source" selecciona: `Deploy from a branch` → `main` → `/ (root)`.
5. Haz clic en **"Save"**.
6. En unos 2 minutos tu web estará en: `https://TU_USUARIO.github.io/TU_REPO/`

> ℹ️ GitHub Pages sirve los archivos sobre HTTPS, lo que cumple el requisito
> de Firebase para cargar módulos desde `gstatic.com`.

---

## Paso 8 — Desplegar en Netlify (alternativa, aún más fácil)

**Opción A — Drag & Drop (sin cuenta de git):**
1. Ve a **[app.netlify.com](https://app.netlify.com)** e inicia sesión (gratis).
2. Arrastra la carpeta del proyecto completa al área "Sites".
3. Listo. Netlify te da una URL tipo `https://nombre-aleatorio.netlify.app`.

**Opción B — Conectado a GitHub (se actualiza automáticamente):**
1. En Netlify → "Add new site" → "Import an existing project".
2. Conecta tu repositorio de GitHub.
3. No necesitas build command ni publish directory (es HTML estático).
4. Haz clic en "Deploy site".

Para un dominio personalizado, Netlify lo soporta gratis con certificado HTTPS.

---

## Solución de Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Comentarios no cargan | Firebase no configurado | Reemplaza `firebaseConfig` en `app.js` |
| Error `permission-denied` | Reglas de Firestore incorrectas | Revisa el Paso 4 y republica las reglas |
| Error de CORS / módulos | Abrir con `file://` | Usa un servidor local (Paso 6) |
| El aviso amarillo no desaparece | `apiKey` sigue siendo "TU_API_KEY" | Pega tu config real del Paso 2 |
| Comentario no se guarda | Validación fallida en reglas | Verifica que nombre ≥2 chars y mensaje ≥10 chars |

---

## Estructura de archivos

```
tu-proyecto/
├── index.html    ← Página principal
├── style.css     ← Estilos (diseño)
├── app.js        ← Firebase + lógica de comentarios
└── SETUP.md      ← Esta guía
```

---

## Plan gratuito de Firebase (Spark)

El plan gratuito es suficiente para un sitio personal o educativo:

| Recurso | Límite gratuito |
|---------|----------------|
| Lecturas Firestore | 50,000 / día |
| Escrituras Firestore | 20,000 / día |
| Almacenamiento | 1 GB |
| Conexiones simultáneas | 100 |

Para un blog o sitio informativo esto nunca se agota.
