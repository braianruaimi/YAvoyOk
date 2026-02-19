// js/forms.js
import { storeDataForSync } from './db.js';

const categoriaACarpeta = {
  empresas: 'servicios-otros',
  mayoristas: 'servicios-otros',
  indumentaria: 'servicios-indumentaria',
  bazar: 'servicios-bazar',
  kiosco: 'servicios-kiosco',
  restaurante: 'servicios-alimentacion',
  farmacia: 'servicios-salud',
  otros: 'servicios-otros',
};

function validateAndGetData(form, fieldsConfig) {
  let valid = true;
  const data = {};

  form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('input, select, textarea').forEach((inp) => inp.classList.remove('input-error'));

  const setError = (field, msg) => {
    const err = form.querySelector(`.error[data-for="${field}"]`);
    if (err) err.textContent = msg;
    valid = false;
  };

  for (const fieldName in fieldsConfig) {
    const config = fieldsConfig[fieldName];
    const input = document.getElementById(config.id);
    if (!input) continue;

    const value = input.type === 'file' ? input.files : input.value.trim();
    let fieldValid = true;

    if (config.required && ((input.type === 'file' && !value.length) || (input.type !== 'file' && !value))) {
      setError(config.id, config.error);
      fieldValid = false;
    } else if (config.minLength && value.length < config.minLength) {
      setError(config.id, config.error);
      fieldValid = false;
    } else if (input.type === 'email' && !input.checkValidity()) {
      setError(config.id, config.error);
      fieldValid = false;
    }

    if (!fieldValid) {
      input.classList.add('input-error');
      valid = false;
    } else {
      data[fieldName] = input.value;
    }
  }

  return valid ? data : null;
}

async function handleComercioForm(form) {
  const fields = {
    nombre: { id: 'comercioNombre', required: true, minLength: 3, error: 'El nombre debe tener al menos 3 caracteres.' },
    categoria: { id: 'comercioCategoria', required: true, error: 'Selecciona una categoría.' },
    whatsapp: { id: 'comercioWhatsapp', required: true, minLength: 8, error: 'Introduce un número válido.' },
    email: { id: 'comercioEmail', required: true, error: 'Introduce un correo válido.' },
  };

  const data = validateAndGetData(form, fields);
  if (!data) return;

  const successEl = document.getElementById('comercioSuccess');
  const fechaISO = new Date().toISOString();
  const carpeta = categoriaACarpeta[data.categoria] || 'servicios-otros';
  const nombreLimpio = data.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const filename = `comercio_${nombreLimpio}_${fechaISO.replace(/:/g, '-').replace(/\./g, '-')}.json`;

  const comercioPayload = {
    carpeta,
    filename,
    data: {
      ...data,
      nombre: nombreLimpio,
      fecha: fechaISO,
      registradoEn: new Date().toISOString(),
      carpeta: carpeta,
    },
  };

  // Guardar en localStorage como respaldo visual inmediato
  const comercios = JSON.parse(localStorage.getItem('comerciosYAvoy') || '[]');
  comercios.push(comercioPayload.data);
  localStorage.setItem('comerciosYAvoy', JSON.stringify(comercios));

  // Enviar al servidor o preparar para sincronización
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      storeDataForSync(comercioPayload)
        .then(() => {
          return sw.sync.register('sync-new-commerce');
        })
        .then(() => {
          if (successEl) {
            successEl.textContent = '✅ Comercio guardado. Se sincronizará en segundo plano.';
            successEl.style.display = 'block';
          }
        })
        .catch((err) => {
          console.error('Error al registrar la sincronización:', err);
          sendToServer(comercioPayload, successEl); // Fallback a envío directo
        });
    });
  } else {
    // Fallback para navegadores sin soporte de Background Sync
    sendToServer(comercioPayload, successEl);
  }

  form.reset();
  setTimeout(() => {
    if (successEl) successEl.style.display = 'none';
  }, 5000);
}

async function sendToServer(payload, successEl) {
  try {
    const apiBase = `${location.protocol}//${location.hostname}:5501`;
    const response = await fetch(`${apiBase}/api/guardar-comercio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (response.ok && result.success) {
      if (successEl) {
        successEl.textContent = `¡Comercio registrado en ${payload.carpeta}! Te contactaremos pronto.`;
        successEl.style.display = 'block';
      }
    } else {
      throw new Error(result.error || 'Error al guardar');
    }
  } catch (error) {
    if (successEl) {
      successEl.textContent = '⚠️ Error de conexión. Intenta de nuevo más tarde.';
      successEl.style.display = 'block';
    }
  }
}

function handleRepartidorForm(form) {
    const fields = {
        nombre: { id: 'repartidorNombre', required: true, minLength: 3, error: 'El nombre debe tener al menos 3 caracteres.' },
        email: { id: 'repartidorEmail', required: true, error: 'Introduce un correo válido.' },
        telefono: { id: 'repartidorTelefono', required: true, minLength: 8, error: 'Introduce un teléfono válido.' },
        dni: { id: 'repartidorDni', required: true, minLength: 7, error: 'Introduce un DNI válido.' },
        experiencia: { id: 'repartidorExperiencia', required: false },
    };

    const data = validateAndGetData(form, fields);
    if (!data) return;

    const repartidor = { ...data, fecha: new Date().toISOString() };
    const repartidores = JSON.parse(localStorage.getItem('repartidoresYAvoy') || '[]');
    repartidores.push(repartidor);
    localStorage.setItem('repartidoresYAvoy', JSON.stringify(repartidores));

    alert('¡Pre-registro completado! Te contactaremos pronto.');
    form.reset();

    const formVehiculo = document.getElementById('form-vehiculo');
    if (formVehiculo) formVehiculo.style.display = 'block';
}

function handleVehiculoForm(form) {
    const fields = {
        marca: { id: 'vehMarca', required: true, minLength: 2, error: 'Introduce la marca.' },
        modelo: { id: 'vehModelo', required: true, minLength: 2, error: 'Introduce el modelo.' },
        dominio: { id: 'vehDominio', required: true, minLength: 6, error: 'Introduce el dominio.' },
        numMotor: { id: 'vehNumMotor', required: true, minLength: 5, error: 'Introduce el número de motor.' },
        numChasis: { id: 'vehNumChasis', required: true, minLength: 5, error: 'Introduce el número de chasis.' },
        licFrente: { id: 'licFrente', required: true, error: 'Adjunta foto del frente.' },
        licDorso: { id: 'licDorso', required: true, error: 'Adjunta foto del dorso.' },
    };

    const data = validateAndGetData(form, fields);
    if (!data) return;

    const vehiculo = { ...data, fecha: new Date().toISOString() };
    localStorage.setItem('vehiculoYAvoy', JSON.stringify(vehiculo));

    alert('¡Datos del vehículo guardados! Proceso completo.');
    form.reset();

    const modalRepartidor = document.getElementById('modal-repartidor');
    if (modalRepartidor) {
        modalRepartidor.style.display = 'none';
        modalRepartidor.setAttribute('aria-hidden', 'true');
        document.getElementById('form-vehiculo').style.display = 'none';
    }
}

function handleContactForm(form) {
    const fields = {
        nombre: { id: 'contactoNombre', required: true, minLength: 3, error: 'El nombre debe tener al menos 3 caracteres.' },
        email: { id: 'contactoEmail', required: true, error: 'Introduce un correo válido.' },
        mensaje: { id: 'contactoMensaje', required: true, minLength: 10, error: 'Al menos 10 caracteres.' },
    };

    const data = validateAndGetData(form, fields);
    if (!data) return;

    alert('Mensaje enviado correctamente. ¡Gracias!');
    form.reset();
}

export function initForms() {
  const comercioForm = document.getElementById('comercioForm');
  if (comercioForm) {
    comercioForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleComercioForm(comercioForm);
    });
  }

  const formRepartidor = document.getElementById('form-registro-repartidor');
  if (formRepartidor) {
    formRepartidor.addEventListener('submit', (e) => {
        e.preventDefault();
        handleRepartidorForm(formRepartidor);
    });
  }

  // Formulario de repartidor en página de inicio
  const formRepartidorInicio = document.getElementById('formRegistrarRepartidorInicio');
  if (formRepartidorInicio) {
    formRepartidorInicio.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btnSubmit = document.getElementById('btnEnviarSolicitud');
      const mensajeError = document.getElementById('mensajeError');
      mensajeError.style.display = 'none';
      
      // Obtener valores del formulario
      const nombre = document.getElementById('repNombreInicio').value.trim();
      const telefono = document.getElementById('repTelefonoInicio').value.trim();
      const email = document.getElementById('repEmailInicio').value.trim();
      const dni = document.getElementById('repDniInicio').value.trim();
      const vehiculo = document.getElementById('repVehiculoInicio').value;
      const aceptaTerminos = document.getElementById('repAceptaTerminos').checked;

      // Validaciones
      if (!nombre || !telefono || !email || !dni || !vehiculo) {
        mensajeError.textContent = '❌ Por favor completa todos los campos obligatorios';
        mensajeError.style.display = 'block';
        return;
      }

      if (!aceptaTerminos) {
        mensajeError.textContent = '❌ Debes aceptar los términos y condiciones para continuar';
        mensajeError.style.display = 'block';
        return;
      }

      // Validar archivos de DNI
      const dniFrente = document.getElementById('repDniFrente').files[0];
      const dniDorso = document.getElementById('repDniDorso').files[0];

      if (!dniFrente || !dniDorso) {
        mensajeError.textContent = '❌ Debes subir ambas fotos del DNI (frente y dorso)';
        mensajeError.style.display = 'block';
        return;
      }

      // Validar archivos de cédula si es moto o auto
      let cedulaFrente = null;
      let cedulaDorso = null;
      
      if (vehiculo === 'moto' || vehiculo === 'auto') {
        cedulaFrente = document.getElementById('repCedulaFrente').files[0];
        cedulaDorso = document.getElementById('repCedulaDorso').files[0];
        
        if (!cedulaFrente || !cedulaDorso) {
          mensajeError.textContent = '❌ Debes subir ambas fotos de la cédula del vehículo (frente y dorso)';
          mensajeError.style.display = 'block';
          return;
        }
      }

      // Convertir imágenes a base64
      btnSubmit.disabled = true;
      btnSubmit.textContent = '⏳ Procesando imágenes...';

      try {
        const dniFrente64 = await convertirImagenBase64(dniFrente);
        const dniDorso64 = await convertirImagenBase64(dniDorso);
        
        let cedulaFrente64 = null;
        let cedulaDorso64 = null;
        
        if (cedulaFrente && cedulaDorso) {
          cedulaFrente64 = await convertirImagenBase64(cedulaFrente);
          cedulaDorso64 = await convertirImagenBase64(cedulaDorso);
        }

        btnSubmit.textContent = '📤 Enviando solicitud...';

        // Preparar datos para enviar
        const datosCompletos = {
          nombre,
          telefono,
          email,
          dni,
          vehiculo,
          documentos: {
            dniFrente: dniFrente64,
            dniDorso: dniDorso64,
            cedulaFrente: cedulaFrente64,
            cedulaDorso: cedulaDorso64
          },
          aceptaTerminos: true,
          fechaSolicitud: new Date().toISOString()
        };

        const response = await fetch('/api/repartidores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosCompletos)
        });

        const data = await response.json();

        if (data.success) {
          // Enviar email de verificación
          await enviarEmailVerificacion(email, nombre, data.repartidor.id);
          
          // Mostrar modal de verificación con el ID
          const mostrarModal = window.mostrarModalVerificacion;
          if (mostrarModal && data.repartidor.id) {
            mostrarModal(data.repartidor.id);
          } else {
            alert(`✅ ¡Registro exitoso! Tu ID es: ${data.repartidor.id}\n\nRevisa tu email para verificar tu cuenta.`);
            const cerrarModal = window.cerrarModalRepartidor;
            if (cerrarModal) cerrarModal();
          }
          formRepartidorInicio.reset();
          
          // Limpiar previsualizaciones
          document.getElementById('previsualizacionDniFrente').innerHTML = '';
          document.getElementById('previsualizacionDniDorso').innerHTML = '';
          document.getElementById('previsualizacionCedulaFrente').innerHTML = '';
          document.getElementById('previsualizacionCedulaDorso').innerHTML = '';
        } else {
          mensajeError.textContent = '❌ Error: ' + data.error;
          mensajeError.style.display = 'block';
        }
      } catch (error) {
        mensajeError.textContent = '❌ Error al registrar repartidor: ' + error.message;
        mensajeError.style.display = 'block';
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '📤 Enviar Solicitud de Registro';
      }
    });
  }

  // Función auxiliar para convertir imagen a base64
  async function convertirImagenBase64(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });
  }

  // Función para enviar email de verificación
  async function enviarEmailVerificacion(email, nombre, idRepartidor) {
    try {
      const response = await fetch('/api/enviar-verificacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre, idRepartidor })
      });
      
      if (response.ok) {
        console.log('✅ Email de verificación enviado');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo enviar el email de verificación:', error);
    }
  }

  // Formulario de comercio en página de inicio
  const formComercioInicio = document.getElementById('formRegistrarComercioInicio');
  if (formComercioInicio) {
    formComercioInicio.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nombrePropietario = document.getElementById('comercioNombrePropietario').value.trim();
      const nombreComercio = document.getElementById('comercioNombreNegocio').value.trim();
      const email = document.getElementById('comercioEmailContacto').value.trim();
      const telefono = document.getElementById('comercioTelefonoContacto').value.trim();
      const categoria = document.getElementById('comercioCategoriaInicio')?.value || 'otros';

      if (!nombrePropietario || !nombreComercio || !email || !telefono) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      const fechaISO = new Date().toISOString();
      const carpeta = categoriaACarpeta[categoria] || 'servicios-otros';
      const nombreLimpio = nombreComercio.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const filename = `comercio_${nombreLimpio}_${fechaISO.replace(/:/g, '-').replace(/\./g, '-')}.json`;

      const payload = {
        carpeta,
        filename,
        data: {
          nombrePropietario,
          nombreComercio,
          email,
          telefono,
          categoria,
          timestamp: fechaISO
        }
      };

      try {
        const response = await fetch('/api/guardar-comercio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          // Mostrar modal de verificación con el ID
          const mostrarModal = window.mostrarModalVerificacionComercio;
          if (mostrarModal && result.comercio && result.comercio.id) {
            mostrarModal(result.comercio.id);
          } else {
            // Fallback si la función no está disponible
            alert('✅ ¡Comercio registrado exitosamente!');
            const cerrarModal = window.cerrarModalComercio;
            if (cerrarModal) cerrarModal();
          }
          formComercioInicio.reset();
        } else {
          alert('Error al enviar el registro: ' + result.error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
      }
    });
  }

  // Formulario de pedido en página de inicio
  const formCrearPedido = document.getElementById('formCrearPedido');
  if (formCrearPedido) {
    formCrearPedido.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nombreCliente = document.getElementById('pedidoNombreCliente').value.trim();
      const telefonoCliente = document.getElementById('pedidoTelefonoCliente').value.trim();
      const direccionEntrega = document.getElementById('pedidoDireccionEntrega').value.trim();
      const descripcion = document.getElementById('pedidoDescripcion').value.trim();
      const monto = document.getElementById('pedidoMonto').value;

      if (!nombreCliente || !telefonoCliente || !direccionEntrega || !descripcion || !monto) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      const data = {
        nombreCliente,
        telefonoCliente,
        direccionEntrega,
        descripcion,
        monto: monto ? parseFloat(monto) : 0,
        estado: 'pendiente',
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          // Mostrar modal de verificación con el número de pedido
          const mostrarModal = window.mostrarModalVerificacionPedido;
          if (mostrarModal && result.pedido && result.pedido.id) {
            mostrarModal(result.pedido.id);
          } else {
            // Fallback si la función no está disponible
            alert(`✅ ¡Pedido creado! Tu número de pedido es: ${result.pedido.id}`);
            const cerrarModal = window.cerrarModalPedido;
            if (cerrarModal) cerrarModal();
          }
          formCrearPedido.reset();
        } else {
          alert('Error al crear el pedido: ' + result.error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
      }
    });
  }

  const formVehiculo = document.getElementById('form-datos-vehiculo');
  if (formVehiculo) {
    formVehiculo.addEventListener('submit', (e) => {
        e.preventDefault();
        handleVehiculoForm(formVehiculo);
    });
  }

  const contactForm = document.getElementById('form-contacto');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleContactForm(contactForm);
    });
  }

  const formBusqueda = document.querySelector('.formulario-busqueda');
  if (formBusqueda) {
    formBusqueda.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('input-busqueda').value;
      const categoria = document.getElementById('select-categoria').value;
      alert(`Buscando: "${query}" en categoría: "${categoria || 'Todas'}"`);
    });
  }

  const btnCargarMas = document.getElementById('btnCargarMas');
  if (btnCargarMas) {
    btnCargarMas.addEventListener('click', () => {
      alert('Cargando más comercios... (funcionalidad por implementar)');
    });
  }
}
