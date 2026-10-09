// Arreglo que almacena todas las tareas creadas durante la sesion
let tareas = [];

// Clave bajo la cual se guarda el arreglo en localStorage
const STORAGE_KEY = 'tareas-universitarias';

// Filtro que determina que tareas se muestran: 'todas', 'pendientes' o 'completadas'
let filtroActivo = 'todas';

// Referencias a los elementos del HTML que se usan mas adelante
const form          = document.querySelector('#form-tarea');
const inputTitulo   = document.querySelector('#titulo');
const inputCurso    = document.querySelector('#curso');
const inputFecha    = document.querySelector('#fechaEntrega');
const divAlertas    = document.querySelector('#alertas');
const listaTareas   = document.querySelector('#lista-tareas');
const botonesFiltro = document.querySelectorAll('.btn-filtro');

// Serializa el arreglo de tareas y lo escribe en localStorage
function guardarEnStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

// Lee el contenido de localStorage y reconstruye el arreglo de tareas
function cargarDeStorage() {
  const datos = localStorage.getItem(STORAGE_KEY);
  tareas = datos ? JSON.parse(datos) : [];
}

// Devuelve el subconjunto de tareas que corresponde al filtro activo
function obtenerTareasFiltradas() {
  if (filtroActivo === 'pendientes')  return tareas.filter(t => !t.completada);
  if (filtroActivo === 'completadas') return tareas.filter(t => t.completada);
  return tareas;
}

// Acumula los totales de tareas segun su estado
function contarTareas() {
  return tareas.reduce(
    (acc, t) => {
      acc.total++;
      t.completada ? acc.completadas++ : acc.pendientes++;
      return acc;
    },
    { total: 0, completadas: 0, pendientes: 0 }
  );
}

// Retorna la tarea cuyo id coincide con el valor recibido
function encontrarTarea(id) {
  return tareas.find(t => t.id === id);
}

// Transforma una fecha ISO al formato dd/mm/aaaa
function formatearFecha(fechaISO) {
  return new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Crea un div de alerta con el mensaje y el estilo segun su tipo
function mostrarAlerta(mensaje, tipo = 'error') {
  const div = document.createElement('div');
  div.className = `alerta alerta-${tipo}`;
  div.textContent = mensaje;
  divAlertas.appendChild(div);

  // La alerta se retira del DOM despues de 3 segundos
  setTimeout(() => div.remove(), 3000);
}

// Vacia el contenedor de alertas
function limpiarAlertas() {
  divAlertas.innerHTML = '';
}

// Comprueba las reglas del formulario y acumula los mensajes de error
function validarFormulario(titulo, curso, fecha) {
  limpiarAlertas();
  let errores = 0;

  // El titulo no puede quedar vacio
  if (!titulo) {
    mostrarAlerta('El titulo no puede estar vacio.');
    errores++;
  }

  // El curso no puede quedar vacio
  if (!curso) {
    mostrarAlerta('El curso no puede estar vacio.');
    errores++;
  }

  // La fecha debe existir y ser posterior a hoy
  if (!fecha) {
    mostrarAlerta('Debes elegir una fecha de entrega.');
    errores++;
  } else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaIngresada = new Date(fecha + 'T00:00:00');

    if (fechaIngresada <= hoy) {
      mostrarAlerta('La fecha debe ser posterior a hoy.');
      errores++;
    }
  }

  return errores === 0;
}

// Reconstruye la lista de tareas en el DOM segun el filtro activo
function renderizarTareas() {
  listaTareas.innerHTML = '';

  const visibles = obtenerTareasFiltradas();

  // Cuando no hay tareas se muestra un mensaje en su lugar
  if (visibles.length === 0) {
    const li = document.createElement('li');
    li.className = 'vacio';
    li.textContent = 'No hay tareas para mostrar.';
    listaTareas.appendChild(li);
  } else {
    // Cada tarea se convierte en un <li> con su informacion y botones
    visibles.forEach(tarea => {
      const li = document.createElement('li');
      // La clase 'completada' es la que produce el tachado desde el CSS
      li.className = 'tarea' + (tarea.completada ? ' completada' : '');
      li.dataset.id = tarea.id;

      li.innerHTML = `
        <div>
          <div class="tarea-titulo">${tarea.titulo}</div>
          <div class="tarea-meta">${tarea.curso} · Entrega: ${formatearFecha(tarea.fechaEntrega)}</div>
        </div>
        <div class="tarea-acciones">
          <button class="btn-completar" data-accion="completar">
            ${tarea.completada ? 'Reabrir' : 'Completar'}
          </button>
          <button class="btn-eliminar" data-accion="eliminar">Eliminar</button>
        </div>
      `;

      listaTareas.appendChild(li);
    });
  }
}

// Se dispara cuando se envia el formulario
form.addEventListener('submit', (e) => {
  // Anula el comportamiento por defecto del submit
  e.preventDefault();

  // Valores normalizados de los campos
  const titulo = inputTitulo.value.trim();
  const curso  = inputCurso.value.trim();
  const fecha  = inputFecha.value;

  // Si la validacion falla, se detiene el flujo
  if (!validarFormulario(titulo, curso, fecha)) return;

  // Objeto que representa la nueva tarea
  const nuevaTarea = {
    id: Date.now(),
    titulo,
    curso,
    fechaEntrega: fecha,
    completada: false
  };

  tareas.push(nuevaTarea);

  guardarEnStorage();
  renderizarTareas();

  form.reset();
  mostrarAlerta('Tarea agregada correctamente.', 'ok');
});

// Delegacion de eventos: un solo listener atiende los clics de toda la lista
listaTareas.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;

  const li = boton.closest('.tarea');
  const id = Number(li.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === 'completar') {
    alternarCompletada(id);
  } else if (accion === 'eliminar') {
    eliminarTarea(id);
  }
});

// Invierte el estado completada de la tarea indicada
function alternarCompletada(id) {
  const tarea = encontrarTarea(id);
  if (!tarea) return;

  tarea.completada = !tarea.completada;

  guardarEnStorage();
  renderizarTareas();
}

// Remueve del arreglo la tarea cuyo id coincide con el recibido
function eliminarTarea(id) {
  tareas = tareas.filter(t => t.id !== id);

  guardarEnStorage();
  renderizarTareas();
}

// Cada boton de filtro actualiza el estado y vuelve a pintar la lista
botonesFiltro.forEach(boton => {
  boton.addEventListener('click', () => {
    botonesFiltro.forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');

    filtroActivo = boton.dataset.filtro;
    renderizarTareas();
  });
});

// Al cargar el documento se recuperan las tareas y se dibujan
document.addEventListener('DOMContentLoaded', () => {
  cargarDeStorage();
  renderizarTareas();
});
