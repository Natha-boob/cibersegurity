// ============================================================
//  app.js — CiberSeguridad · Sistema de comentarios Firebase
// ============================================================

import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc,
         query, orderBy, onSnapshot,
         serverTimestamp, limit }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ============================================================
//  ⚠️  PASO OBLIGATORIO: reemplaza con TU configuración
//  Firebase Console → Tu proyecto → ⚙️ Configuración → Tus apps → Web
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAux_Bya7Lz6LqthBfUuEE0AzRzYyHDl5U",
  authDomain: "cybersecurity-site-997b5.firebaseapp.com",
  projectId: "cybersecurity-site-997b5",
  storageBucket: "cybersecurity-site-997b5.firebasestorage.app",
  messagingSenderId: "313527938285",
  appId: "1:313527938285:web:45dec013a2a548d89830e4"
};
// ============================================================

// Las funciones de UI no necesitan Firebase — se inician siempre
initNavbar();
initSmoothScroll();

if (firebaseConfig.apiKey === "TU_API_KEY") {
  // Config no reemplazada: aviso visible en el panel de comentarios
  const loader = document.getElementById('commentsLoader');
  if (loader) {
    loader.innerHTML = `
      <div class="config-warning">
        ⚠️ <strong>Firebase no está configurado todavía.</strong><br>
        Abre <code>app.js</code> y reemplaza los valores de <code>firebaseConfig</code>
        con los de tu proyecto de Firebase. Consulta el archivo <code>SETUP.md</code>
        para las instrucciones paso a paso.
      </div>`;
  }
} else {
  // Config lista: inicializar Firebase y activar comentarios
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  initForm(db);
  loadComments(db);
}

// ============================================================
//  RATE LIMITING — 1 comentario por minuto por sesión
// ============================================================
const RATE_KEY    = 'cseg_lastComment';
const RATE_MS     = 60_000;           // 1 minuto

function canSubmit() {
  const last = localStorage.getItem(RATE_KEY);
  return !last || (Date.now() - parseInt(last, 10)) > RATE_MS;
}

function recordSubmit() {
  localStorage.setItem(RATE_KEY, Date.now().toString());
}

// ============================================================
//  VALIDACIÓN DEL FORMULARIO
// ============================================================
function validateForm(nombre, mensaje) {
  const errors = {};
  const n = nombre.trim();
  const m = mensaje.trim();

  if (n.length < 2)   errors.nombre  = 'El nombre debe tener al menos 2 caracteres.';
  if (n.length > 50)  errors.nombre  = 'El nombre no puede superar los 50 caracteres.';
  if (m.length < 10)  errors.mensaje = 'El comentario debe tener al menos 10 caracteres.';
  if (m.length > 500) errors.mensaje = 'El comentario no puede superar los 500 caracteres.';

  return errors;
}

// ============================================================
//  RENDERIZADO DE COMENTARIOS
//  Se construye el DOM con createElement + textContent para
//  evitar ataques XSS — NUNCA se usa innerHTML con datos del usuario
// ============================================================
const AVATAR_COLORS = [
  '#7c3aed', '#00b8e6', '#ff3d71', '#00e096',
  '#f59e0b', '#3b82f6', '#ec4899', '#10b981'
];

function avatarColor(name) {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatTime(ts) {
  if (!ts) return 'hace un momento';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();

  if (diff <        60_000) return 'hace un momento';
  if (diff <     3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff <    86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 2_592_000_000) return `hace ${Math.floor(diff / 86_400_000)} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildComment(data) {
  const article = document.createElement('article');
  article.className = 'comment-item';

  // Avatar con color basado en el nombre
  const avatar = document.createElement('div');
  avatar.className = 'comment-avatar';
  avatar.textContent = data.nombre.trim().charAt(0).toUpperCase();
  avatar.style.backgroundColor = avatarColor(data.nombre);

  // Cuerpo del comentario
  const body = document.createElement('div');
  body.className = 'comment-body';

  const header = document.createElement('div');
  header.className = 'comment-header';

  const name = document.createElement('strong');
  name.className = 'comment-name';
  name.textContent = data.nombre;    // textContent → seguro contra XSS

  const time = document.createElement('time');
  time.className = 'comment-time';
  time.textContent = formatTime(data.timestamp);

  const text = document.createElement('p');
  text.className = 'comment-text';
  text.textContent = data.mensaje;   // textContent → seguro contra XSS

  header.append(name, time);
  body.append(header, text);
  article.append(avatar, body);
  return article;
}

// ============================================================
//  CARGAR COMENTARIOS EN TIEMPO REAL (onSnapshot)
// ============================================================
function loadComments(db) {
  const list   = document.getElementById('commentsList');
  const loader = document.getElementById('commentsLoader');
  const empty  = document.getElementById('noComments');
  const badge  = document.getElementById('commentCount');

  const q = query(
    collection(db, 'comentarios'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  // onSnapshot actualiza la lista en tiempo real sin recargar la página
  onSnapshot(q,
    (snapshot) => {
      loader.style.display = 'none';
      list.innerHTML = '';

      if (snapshot.empty) {
        empty.style.display = 'block';
        badge.textContent = '';
        return;
      }

      empty.style.display = 'none';
      const n = snapshot.size;
      badge.textContent = `${n} comentario${n !== 1 ? 's' : ''}`;

      snapshot.forEach(doc => list.appendChild(buildComment(doc.data())));
    },
    (err) => {
      console.error('Firestore error:', err);
      loader.innerHTML = '<p class="error-text">Error al cargar comentarios. Recarga la página.</p>';
    }
  );
}

// ============================================================
//  FORMULARIO DE COMENTARIOS
// ============================================================
function initForm(db) {
  const form         = document.getElementById('commentForm');
  const nombreInput  = document.getElementById('nombreInput');
  const mensajeInput = document.getElementById('mensajeInput');
  const charCount    = document.getElementById('charCount');
  const submitBtn    = document.getElementById('submitBtn');
  const formMessage  = document.getElementById('formMessage');
  const nombreError  = document.getElementById('nombreError');
  const mensajeError = document.getElementById('mensajeError');

  // Contador de caracteres en el textarea
  mensajeInput.addEventListener('input', () => {
    const len = mensajeInput.value.length;
    charCount.textContent = `${len} / 500`;
    charCount.className = 'char-count' + (len > 450 ? ' near-limit' : '');
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const nombre  = nombreInput.value;
    const mensaje = mensajeInput.value;
    const errors  = validateForm(nombre, mensaje);

    if (errors.nombre)  { nombreError.textContent  = errors.nombre;  nombreInput.focus();  return; }
    if (errors.mensaje) { mensajeError.textContent = errors.mensaje; mensajeInput.focus(); return; }

    if (!canSubmit()) {
      showMsg('Espera 1 minuto antes de enviar otro comentario.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'comentarios'), {
        nombre:    nombre.trim(),
        mensaje:   mensaje.trim(),
        timestamp: serverTimestamp()      // hora del servidor, no del cliente
      });

      recordSubmit();
      form.reset();
      charCount.textContent = '0 / 500';
      showMsg('¡Comentario publicado! Gracias por participar.', 'success');

    } catch (err) {
      console.error('Error al guardar:', err);
      showMsg('Error al publicar. Verifica tu conexión e intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  });

  function clearErrors() {
    nombreError.textContent  = '';
    mensajeError.textContent = '';
    formMessage.style.display = 'none';
  }

  function setLoading(on) {
    submitBtn.disabled    = on;
    submitBtn.textContent = on ? 'Publicando...' : 'Publicar comentario';
  }

  function showMsg(text, type) {
    formMessage.textContent  = text;
    formMessage.className    = `form-message ${type}`;
    formMessage.style.display = 'block';
    if (type !== 'error') setTimeout(() => { formMessage.style.display = 'none'; }, 7000);
  }
}

// ============================================================
//  NAVBAR — efecto scroll + menú móvil
// ============================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================================
//  SMOOTH SCROLL — desplazamiento suave con offset del navbar
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('navbar').offsetHeight + 20;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}
