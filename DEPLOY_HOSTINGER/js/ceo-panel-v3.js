/**
 * YAvoy v3.1 - Panel CEO Master
 * Módulo JavaScript para gestión centralizada
 * Separado de HTML para mejor mantenimiento
 */

// ============================================
// CATEGORÍAS DEL SISTEMA
// ============================================
const CATEGORIAS_SISTEMA = [
  { id: 'alimentacion', nombre: 'Alimentación', icono: '🍔' },
  { id: 'salud', nombre: 'Salud y Farmacia', icono: '💊' },
  { id: 'bazar', nombre: 'Bazar y Electrónica', icono: '🏪' },
  { id: 'indumentaria', nombre: 'Indumentaria', icono: '👕' },
  { id: 'kiosco', nombre: 'Kiosco', icono: '📰' },
  { id: 'prioridad', nombre: 'Servicios Prioritarios', icono: '⚡' },
  { id: 'otros', nombre: 'Otros Servicios', icono: '🔧' }
];

// ============================================
// DATOS EN MEMORIA
// ============================================
let datosCEO = {
  comercios: [],
  repartidores: [],
  clientes: [],
  pedidos: [],
  categorias: CATEGORIAS_SISTEMA,
  suspension: [],
  solicitudes: {
    tienda: [],
    publicidad: []
  },
  multimedia: [],
  registros: {}
};

let filtrosActivos = {
  multimedia: 'comercios',
  registros: 'comercios'
};

let archivosSistema = [];

// ============================================
// CARGAR DATOS
// ============================================
async function cargarDatosCEO() {
  try {
    const endpoints = [
      { name: 'comercios', url: '/api/comercios' },
      { name: 'repartidores', url: '/api/repartidores' },
      { name: 'clientes', url: '/api/clientes' },
      { name: 'pedidos', url: '/api/pedidos' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          const data = await response.json();
          datosCEO[endpoint.name] = Array.isArray(data) ? data : data[endpoint.name] || [];
          console.log(`✅ ${endpoint.name} cargados:`, datosCEO[endpoint.name].length);
        }
      } catch (error) {
        console.warn(`⚠️ Error cargando ${endpoint.name}:`, error);
        datosCEO[endpoint.name] = [];
      }
    }

    return datosCEO;
  } catch (error) {
    console.error('❌ Error en cargarDatosCEO:', error);
    throw error;
  }
}

// ============================================
// ESTADÍSTICAS
// ============================================
function actualizarEstadisticas() {
  const stats = {
    comercios: datosCEO.comercios.length,
    repartidores: datosCEO.repartidores.length,
    clientes: datosCEO.clientes.length,
    pedidos: datosCEO.pedidos.length,
    solicitudes: datosCEO.solicitudes.tienda.length + datosCEO.solicitudes.publicidad.length,
    suspensiones: datosCEO.suspension.length
  };

  const elementos = {
    'stat-comercios': stats.comercios,
    'stat-repartidores': stats.repartidores,
    'stat-clientes': stats.clientes,
    'stat-pedidos': stats.pedidos,
    'stat-solicitudes': stats.solicitudes,
    'stat-suspensiones': stats.suspensiones
  };

  Object.entries(elementos).forEach(([id, valor]) => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = valor;
  });
}

// ============================================
// COMERCIOS
// ============================================
async function cargarComerciosPanel() {
  try {
    const response = await fetch('/api/comercios');
    const comercios = await response.json();
    datosCEO.comercios = Array.isArray(comercios) ? comercios : [];
    renderizarComerciosPanel();
  } catch (error) {
    console.error('Error cargando comercios:', error);
    mostrarError('No se pudieron cargar los comercios');
  }
}

function renderizarComerciosPanel() {
  const lista = document.getElementById('listaComercios');
  if (!lista) return;

  if (datosCEO.comercios.length === 0) {
    lista.innerHTML = '<p class="ceo-empty-message">No hay comercios registrados</p>';
    return;
  }

  lista.innerHTML = datosCEO.comercios.map(comercio => `
    <div class="ceo-item-card">
      <div class="ceo-item-header">
        <div class="ceo-item-title">🏪 ${comercio.nombre || comercio.id}</div>
        <div class="ceo-item-actions">
          <button class="ceo-btn ceo-btn-edit" onclick="editarComercio('${comercio.id}')">✏️</button>
          <button class="ceo-btn ceo-btn-delete" onclick="eliminarComercio('${comercio.id}')">🗑️</button>
        </div>
      </div>
      <div class="ceo-item-details">
        <span>${comercio.categoria || 'N/A'}</span>
        <span>${comercio.whatsapp ? '📱 ' + comercio.whatsapp : 'Sin contacto'}</span>
        <span class="ceo-badge ${comercio.activo ? 'ceo-badge-success' : 'ceo-badge-danger'}">
          ${comercio.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  `).join('');
}

function editarComercio(id) {
  const comercio = datosCEO.comercios.find(c => c.id === id);
  if (!comercio) return;

  showModal('Editar Comercio', `
    <div class="ceo-form">
      <div class="ceo-form-group">
        <label>Nombre</label>
        <input type="text" value="${comercio.nombre || ''}" id="edit-nombre">
      </div>
      <div class="ceo-form-group">
        <label>WhatsApp</label>
        <input type="tel" value="${comercio.whatsapp || ''}" id="edit-whatsapp">
      </div>
      <div class="ceo-form-group">
        <label>Email</label>
        <input type="email" value="${comercio.email || ''}" id="edit-email">
      </div>
      <button class="ceo-btn ceo-btn-save" onclick="guardarComercioEditado('${id}')">Guardar</button>
    </div>
  `);
}

async function guardarComercioEditado(id) {
  const comercioActualizado = {
    ...datosCEO.comercios.find(c => c.id === id),
    nombre: document.getElementById('edit-nombre').value,
    whatsapp: document.getElementById('edit-whatsapp').value,
    email: document.getElementById('edit-email').value
  };

  try {
    const response = await fetch(`/api/comercios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comercioActualizado)
    });

    if (response.ok) {
      mostrarExito('Comercio actualizado');
      await cargarComerciosPanel();
      cerrarModal();
    }
  } catch (error) {
    mostrarError('Error al guardar');
  }
}

function eliminarComercio(id) {
  if (confirm('¿Eliminar este comercio? No se puede deshacer.')) {
    fetch(`/api/comercios/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          mostrarExito('Comercio eliminado');
          cargarComerciosPanel();
        }
      })
      .catch(err => mostrarError('Error al eliminar'));
  }
}

// ============================================
// REPARTIDORES
// ============================================
async function cargarRepartidoresPanel() {
  try {
    const response = await fetch('/api/repartidores');
    const repartidores = await response.json();
    datosCEO.repartidores = Array.isArray(repartidores) ? repartidores : [];
    renderizarRepartidoresPanel();
  } catch (error) {
    console.error('Error cargando repartidores:', error);
  }
}

function renderizarRepartidoresPanel() {
  const lista = document.getElementById('listaRepartidores');
  if (!lista) return;

  if (datosCEO.repartidores.length === 0) {
    lista.innerHTML = '<p class="ceo-empty-message">No hay repartidores registrados</p>';
    return;
  }

  lista.innerHTML = datosCEO.repartidores.map(rep => `
    <div class="ceo-item-card">
      <div class="ceo-item-header">
        <div class="ceo-item-title">🏍️ ${rep.nombre || rep.id}</div>
      </div>
      <div class="ceo-item-details">
        <span>📱 ${rep.whatsapp || 'N/A'}</span>
        <span>⭐ ${rep.rating || '0'}</span>
        <span>${rep.activo ? 'En línea' : 'Offline'}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// CLIENTES
// ============================================
async function cargarClientesPanel() {
  try {
    const response = await fetch('/api/clientes');
    const clientes = await response.json();
    datosCEO.clientes = Array.isArray(clientes) ? clientes : [];
    renderizarClientesPanel();
  } catch (error) {
    console.error('Error cargando clientes:', error);
  }
}

function renderizarClientesPanel() {
  const lista = document.getElementById('listaClientes');
  if (!lista) return;

  if (datosCEO.clientes.length === 0) {
    lista.innerHTML = '<p class="ceo-empty-message">No hay clientes registrados</p>';
    return;
  }

  lista.innerHTML = datosCEO.clientes.map(cliente => `
    <div class="ceo-item-card">
      <div class="ceo-item-header">
        <div class="ceo-item-title">👤 ${cliente.nombre || cliente.id}</div>
      </div>
      <div class="ceo-item-details">
        <span>📱 ${cliente.whatsapp || 'N/A'}</span>
        <span>📧 ${cliente.email || 'N/A'}</span>
        <span>💳 ${cliente.totalGastado || '$0'}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// UTILIDADES
// ============================================
function showModal(titulo, contenido) {
  const modal = document.getElementById('ceoModal');
  if (modal) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = contenido;
    modal.classList.add('active');
  }
}

function cerrarModal() {
  const modal = document.getElementById('ceoModal');
  if (modal) modal.classList.remove('active');
}

function mostrarExito(mensaje) {
  console.log('✅', mensaje);
  alert('✅ ' + mensaje);
}

function mostrarError(mensaje) {
  console.error('❌', mensaje);
  alert('⚠️ ' + mensaje);
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function inicializarPanelCEO() {
  try {
    console.log('🚀 Inicializando Panel CEO v3.1...');
    await cargarDatosCEO();
    actualizarEstadisticas();
    await cargarComerciosPanel();
    await cargarRepartidoresPanel();
    await cargarClientesPanel();
    console.log('✅ Panel CEO inicializado');
  } catch (error) {
    console.error('❌ Error inicializando:', error);
    mostrarError('Error al cargar el panel');
  }
}

// Inicializar cuando DOM está listo
document.addEventListener('DOMContentLoaded', inicializarPanelCEO);
