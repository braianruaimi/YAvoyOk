// js/ui.js

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function smoothScrollTo(hash) {
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  if (prefersReducedMotion) {
    target.scrollIntoView();
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  window.setTimeout(() => target.removeAttribute('tabindex'), 1000);
}

export function initUI() {
  // Oculta la pantalla de carga con transición y luego elimínala
  const splashScreen = document.getElementById('splash-screen');
  setTimeout(() => {
    if (splashScreen) {
      splashScreen.classList.add('hidden');
      document.body.classList.add('loaded');
      setTimeout(() => {
        if (splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
        }
      }, 600);
    } else {
      document.body.classList.add('loaded');
    }
  }, 1000);

  // Enlaces internos y menú móvil
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    if (window.innerWidth <= 768) {
      const menu = document.getElementById('mainMenu');
      if (menu && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        const toggle = document.getElementById('menuToggle');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      }
    }
  });

  // Año automático en el footer
  const elAnio = document.getElementById('anio');
  if (elAnio) elAnio.textContent = new Date().getFullYear();

  // Menú móvil
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mainMenu');

  function checkMenuButton() {
    const show = window.innerWidth <= 768;
    if (toggle) toggle.style.display = show ? 'inline-block' : 'none';
    if (!show && menu) {
      menu.classList.remove('is-open');
      menu.style.removeProperty('display');
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  checkMenuButton();
  window.addEventListener('resize', checkMenuButton);

  function openMenu() {
    if (!menu || !toggle) return;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    const firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu(returnFocus = true) {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('is-open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' || ev.key === 'Esc') {
        if (menu.classList.contains('is-open')) {
          closeMenu();
        }
      }
    });
  }

  // IntersectionObserver para animaciones
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, observerOptions);

    document.querySelectorAll('main section, header, footer').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('main section, header, footer').forEach((el) => {
      el.classList.add('is-visible');
    });
  }

  // Atajos de teclado
  document.addEventListener('keydown', (ev) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;

    if (ev.key === 'i' || ev.key === 'I' || ev.key === '1') {
      ev.preventDefault();
      smoothScrollTo('#inicio');
    } else if (ev.key === 'c' || ev.key === 'C' || ev.key === '2') {
      ev.preventDefault();
      smoothScrollTo('#comercios');
    } else if (ev.key === 'r' || ev.key === 'R' || ev.key === '3') {
      ev.preventDefault();
      smoothScrollTo('#repartidores');
    }
  });

  // Estadísticas animadas
  const statNumbers = document.querySelectorAll('.stat-numero');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.getAttribute('data-target'));
            animateNumber(entry.target, 0, target, 2000);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNumbers.forEach((stat) => statsObserver.observe(stat));
  }

  function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      element.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Botón de scroll to top
  const scrollBtn = document.getElementById('scrollToTop');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Modales
  function initModal(modalId, openTriggers) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');

    const openModal = () => {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    };

    openTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const nombreComercio = trigger.getAttribute('data-comercio');
        if (nombreComercio) {
          const detallesBody = document.getElementById('detallesBody');
          const detallesTitulo = document.getElementById('detallesTitulo');
          if (detallesTitulo) detallesTitulo.textContent = nombreComercio;
          if (detallesBody) {
            detallesBody.innerHTML = `
              <p><strong>Nombre:</strong> ${nombreComercio}</p>
              <p><strong>Horario:</strong> Lun-Sáb 9:00 - 21:00</p>
              <p><strong>Teléfono:</strong> +54 221 504 7962</p>
              <p><strong>Dirección:</strong> Ensenada, Buenos Aires</p>
              <p><strong>Descripción:</strong> Servicio de calidad con entregas rápidas y seguras.</p>
            `;
          }
        }
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  const repartidorOpeners = Array.from(document.querySelectorAll('a')).filter(
    (link) =>
      link.textContent.includes('Quiero Empezar a Repartir') ||
      (link.textContent.includes('Repartidor') && link.getAttribute('href') === '#')
  );

  initModal('modal-repartidor', repartidorOpeners);
  initModal('modal-detalles', document.querySelectorAll('.btn-detalles'));

  // Botón para activar notificaciones
  const btnNotificaciones = document.getElementById('btnActivarNotificaciones');
  if (btnNotificaciones) {
    btnNotificaciones.addEventListener('click', () => {
      requestNotificationPermission();
      btnNotificaciones.textContent = '¡Gracias!';
      btnNotificaciones.disabled = true;
    });

    // Ocultar el botón si las notificaciones ya están activadas o no son soportadas
    if (!checkNotificationSupport() || Notification.permission === 'granted' || Notification.permission === 'denied') {
        const seccionNotificaciones = document.querySelector('.seccion-notificaciones');
        if(seccionNotificaciones) seccionNotificaciones.style.display = 'none';
    }
  }
}

/**
 * Revisa si el navegador soporta las APIs necesarias para notificaciones push.
 */
function checkNotificationSupport() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}
