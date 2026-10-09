// Arreglo para las tareas
let tareas = [];

// Clave del arreglo en localStorage
const STORAGE_KEY = 'tareas-universitarias';

// Filtro de tareas que se muestra: 'todas', 'pendientes' o 'completadas'
let filtroActivo = 'todas';

// Referencias de elementos que se ingresan
const form          = document.querySelector('#form-tarea');
const inputTitulo   = document.querySelector('#titulo');
const inputCurso    = document.querySelector('#curso');
const inputFecha    = document.querySelector('#fechaEntrega');
const divAlertas    = document.querySelector('#alertas');
const listaTareas   = document.querySelector('#lista-tareas');
const botonesFiltro = document.querySelectorAll('.btn-filtro');

// Se arreglo se escribe en localStorage
function guardarEnStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

// Lee el contenido de localStorage y reconstruye el arreglo de tareas
function cargarDeStorage() {
  tareas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Muestra la alerta y tipo de error
function mostrarAlerta(mensaje, tipo = 'error') {
  divAlertas.innerHTML = '';
  const div = document.createElement('div');
  div.className = `alerta alerta-${tipo}`;
  div.textContent = mensaje;
  divAlertas.appendChild(div);

  // La alerta se borra en 3s
  setTimeout(() => div.remove(), 3000);
}

// Reconstruye la lista de tareas 
function renderizarTareas() {
  // Muestra el subconjunto de tareas
  const visibles = tareas.filter(t => {
    if (filtroActivo === 'pendientes')  return !t.completada;
    if (filtroActivo === 'completadas') return t.completada;
    return true;
  });

  // Si no hay tareas se muestra un mensaje 
  if (visibles.length === 0) {
    listaTareas.innerHTML = '<li class="vacio">No hay tareas para mostrar.</li>';
  } else {
    // Cada tarea se cvuelve un <li> con ""map""
    listaTareas.innerHTML = visibles.map(t => `
      <li class="tarea${t.completada ? ' completada' : ''}" data-id="${t.id}">
        <div>
          <div class="tarea-titulo">${t.titulo}</div>
          <div class="tarea-meta">${t.curso} · Entrega: ${t.fechaEntrega}</div>
        </div>
        <div class="tarea-acciones">
          <button class="btn-completar" data-accion="completar">${t.completada ? 'Reabrir' : 'Completar'}</button>
          <button class="btn-eliminar" data-accion="eliminar">Eliminar</button>
        </div>
      </li>
    `).join('');
  }

  // Acumula los totales de tareas (reduce)
  const { total, completadas } = tareas.reduce(
    (acc, t) => {
      acc.total++;
      if (t.completada) acc.completadas++;
      return acc;
    },
    { total: 0, completadas: 0 }
  );
  console.log(`Total: ${total} · Completadas: ${completadas}`);
}

// Se dispara cuando se envia el formulario
form.addEventListener('submit', (e) => {
  // Anula el comportamiento por defecto del submit
  e.preventDefault();

  // Valores normalizados
  const titulo = inputTitulo.value.trim();
  const curso  = inputCurso.value.trim();
  const fecha  = inputFecha.value;

  // Comprueba las reglas del formulario
  if (!titulo) return mostrarAlerta('El titulo no puede estar vacio.');
  if (!curso)  return mostrarAlerta('El curso no puede estar vacio.');
  if (!fecha)  return mostrarAlerta('Debes elegir una fecha de entrega.');

  // Verifica la fecha
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (new Date(fecha + 'T00:00:00') <= hoy)
    return mostrarAlerta('La fecha debe ser posterior a hoy.');

  // Objeto de la nueva tarea
  tareas.push({ id: Date.now(), titulo, curso, fechaEntrega: fecha, completada: false });

  guardarEnStorage();
  renderizarTareas();
  form.reset();
  mostrarAlerta('Tarea agregada correctamente.', 'ok');
});

// Eventos: un solo ""listener"" atiende los clics de la lista
listaTareas.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.closest('.tarea').dataset.id);
  const accion = boton.dataset.accion;

  if (accion === 'completar') {
    // Cambia a tare completada
    const t = tareas.find(t => t.id === id);
    if (t) t.completada = !t.completada;
  } else {
    // Remueve la tarea cuando el id coincide con el ingresado (filter)
    tareas = tareas.filter(t => t.id !== id);
  }

  guardarEnStorage();
  renderizarTareas();
});

// Cada boton de filtro actualiza el estado y vuelve a cambiar
botonesFiltro.forEach(b => {
  b.addEventListener('click', () => {
    botonesFiltro.forEach(x => x.classList.remove('activo'));
    b.classList.add('activo');
    filtroActivo = b.dataset.filtro;
    renderizarTareas();
  });
});

// Al cargar el documento se recuperan las tareas y se dibujan
document.addEventListener('DOMContentLoaded', () => {
  cargarDeStorage();
  renderizarTareas();
});
