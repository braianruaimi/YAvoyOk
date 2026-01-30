/**
 * YAvoy Sistema de Accesibilidad Global
 * Panel de Configuración Persistente para toda la aplicación
 * Compatible con todos los paneles y páginas
 */

class YAvoyAccessibilitySystem {
    constructor() {
        this.isInitialized = false;
        this.isActive = false;
        this.panelVisible = false;
        this.settings = {
            contrast: false,
            fontSize: 'normal',
            voice: false,
            keyboard: false,
            animations: true,
            aiAssistant: false,
            autoFollow: true
        };
        
        this.deviceInfo = {
            isMobile: false,
            isTablet: false,
            hasTouch: false,
            supportsVibration: false
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🌟 Iniciando YAvoy Sistema de Accesibilidad Global...');
        
        // Detectar dispositivo
        this.detectDevice();
        
        // Cargar configuraciones guardadas
        this.loadSettings();
        
        // Crear interfaz
        this.createAccessibilityInterface();
        
        // Configurar eventos globales
        this.setupGlobalEvents();
        
        // NO auto-activar - Solo manual o por solicitud explícita
        // El usuario tiene control total sobre cuándo activar la accesibilidad
        
        this.isInitialized = true;
        
        console.log('✅ Sistema de Accesibilidad Global cargado - Control manual activo');
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTabletUA = /ipad|android(?=.*tablet)|tablet/i.test(userAgent);
        
        this.deviceInfo = {
            isMobile: (isMobileUA && !isTabletUA) || window.innerWidth <= 768,
            isTablet: isTabletUA || (!isMobileUA && window.innerWidth > 768 && window.innerWidth <= 1024),
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            supportsVibration: 'vibrate' in navigator
        };
        
        // Agregar clases CSS según dispositivo
        if (this.deviceInfo.isMobile) document.body.classList.add('device-mobile');
        if (this.deviceInfo.isTablet) document.body.classList.add('device-tablet');
        if (this.deviceInfo.hasTouch) document.body.classList.add('has-touch');
    }
    
    createAccessibilityInterface() {
        // Botón flotante desactivado - usar solo botón del footer
        // this.createFloatingButton();
        
        // Crear panel de configuración
        this.createConfigPanel();
        
        // Crear overlay para anuncios
        this.createAnnouncementOverlay();
    }
    
    createFloatingButton() {
        if (document.getElementById('yavoy-accessibility-btn')) return;
        
        const button = document.createElement('button');
        button.id = 'yavoy-accessibility-btn';
        button.innerHTML = '♿';
        button.setAttribute('aria-label', 'Panel de Accesibilidad YAvoy');
        button.setAttribute('title', 'Abrir configuración de accesibilidad');
        
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(6, 182, 212, 0.3);
            transition: all 0.3s ease;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Efectos hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 12px 40px rgba(6, 182, 212, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 8px 32px rgba(6, 182, 212, 0.3)';
        });
        
        // Evento click
        button.addEventListener('click', () => this.toggleConfigPanel());
        
        // Adaptaciones móvil
        if (this.deviceInfo.isMobile) {
            button.style.bottom = '80px';
            button.style.width = '70px';
            button.style.height = '70px';
            button.style.fontSize = '28px';
        }
        
        document.body.appendChild(button);
    }
    
    createConfigPanel() {
        if (document.getElementById('yavoy-accessibility-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'yavoy-accessibility-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            width: ${this.deviceInfo.isMobile ? '95%' : '600px'};
            max-height: 80vh;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 80px rgba(0,0,0,0.3);
            z-index: 10001;
            display: none;
            opacity: 0;
            transition: all 0.3s ease;
            overflow: hidden;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 20px; position: relative;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 600;">🌟 Panel de Accesibilidad</h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Configura YAvoy para tus necesidades</p>
                <button id="close-accessibility-panel" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " aria-label="Cerrar panel">×</button>
            </div>
            
            <div style="padding: 25px; max-height: 60vh; overflow-y: auto;">
                <!-- Estado del Sistema -->
                <div style="background: #f0f9ff; padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #06b6d4;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 20px;">⚡</span>
                        <strong style="color: #0c1b33;">Estado del Sistema</strong>
                    </div>
                    <p id="system-status" style="margin: 0; color: #374151; font-size: 14px;">
                        Sistema desactivado - Configura las opciones que necesites
                    </p>
                </div>
                
                <!-- Controles Principales -->
                <div style="display: grid; grid-template-columns: ${this.deviceInfo.isMobile ? '1fr' : '1fr 1fr'}; gap: 15px; margin-bottom: 25px;">
                    
                    <!-- Alto Contraste -->
                    <div class="config-item" data-setting="contrast">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9fafb; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                            <span style="font-size: 24px;">🎨</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">Alto Contraste</div>
                                <div style="font-size: 12px; color: #6b7280;">Mejora la visibilidad</div>
                            </div>
                            <input type="checkbox" id="contrast-toggle" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                    
                    <!-- Tamaño de Texto -->
                    <div class="config-item" data-setting="fontSize">
                        <div style="padding: 15px; background: #f9fafb; border-radius: 12px; border: 2px solid transparent;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                                <span style="font-size: 24px;">📝</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #111827;">Tamaño de Texto</div>
                                    <div style="font-size: 12px; color: #6b7280;">Ajusta para mejor lectura</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button id="font-decrease" style="width: 35px; height: 35px; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">A-</button>
                                <span id="font-size-display" style="flex: 1; text-align: center; font-size: 14px; color: #374151;">Normal</span>
                                <button id="font-increase" style="width: 35px; height: 35px; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">A+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Lector de Voz -->
                    <div class="config-item" data-setting="voice">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9fafb; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                            <span style="font-size: 24px;">🔊</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">Lector de Voz</div>
                                <div style="font-size: 12px; color: #6b7280;">Lee elementos en voz alta</div>
                            </div>
                            <input type="checkbox" id="voice-toggle" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                    
                    <!-- Navegación por Teclado -->
                    <div class="config-item" data-setting="keyboard">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9fafb; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                            <span style="font-size: 24px;">⌨️</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">Navegación Teclado</div>
                                <div style="font-size: 12px; color: #6b7280;">Atajos y navegación completa</div>
                            </div>
                            <input type="checkbox" id="keyboard-toggle" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                    
                    <!-- Pausar Animaciones -->
                    <div class="config-item" data-setting="animations">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9fafb; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                            <span style="font-size: 24px;">⏸️</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">Sin Animaciones</div>
                                <div style="font-size: 12px; color: #6b7280;">Reduce movimientos</div>
                            </div>
                            <input type="checkbox" id="animations-toggle" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                    
                    <!-- Asistente IA -->
                    <div class="config-item" data-setting="aiAssistant">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f9fafb; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                            <span style="font-size: 24px;">🤖</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">Asistente IA</div>
                                <div style="font-size: 12px; color: #6b7280;">Ayuda personalizada</div>
                            </div>
                            <input type="checkbox" id="ai-toggle" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                </div>
                
                <!-- Controles del Sistema -->
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="activate-accessibility" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 14px;
                    ">⚡ Activar Sistema</button>
                    
                    <button id="deactivate-accessibility" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 14px;
                        display: none;
                    ">❌ Desactivar</button>
                </div>
                
                <!-- Información de Ayuda -->
                <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 16px;">💡</span>
                        <strong style="color: #92400e;">Atajos de Teclado</strong>
                    </div>
                    <div style="font-size: 13px; color: #451a03; line-height: 1.4;">
                        • <strong>Alt + C</strong> → Alternar contraste<br>
                        • <strong>Alt + V</strong> → Activar/desactivar voz<br>
                        • <strong>Alt + =</strong> → Aumentar texto<br>
                        • <strong>Alt + -</strong> → Disminuir texto<br>
                        • <strong>Alt + H</strong> → Ayuda IA
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Configurar eventos del panel
        this.setupPanelEvents();
    }
    
    createAnnouncementOverlay() {
        if (document.getElementById('yavoy-announcements')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'yavoy-announcements';
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-atomic', 'true');
        overlay.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            z-index: 1;
        `;
        
        document.body.appendChild(overlay);
    }
    
    setupPanelEvents() {
        // Cerrar panel con mejor gestión de estado
        document.getElementById('close-accessibility-panel').addEventListener('click', () => {
            console.log('🔽 Cerrando panel desde botón X');
            this.panelVisible = true; // Asegurar que el estado sea correcto antes del toggle
            this.toggleConfigPanel();
        });
        
        // Activar/Desactivar sistema
        document.getElementById('activate-accessibility').addEventListener('click', () => {
            this.activateSystem();
        });
        
        document.getElementById('deactivate-accessibility').addEventListener('click', () => {
            this.deactivateSystem();
        });
        
        // Controles específicos
        this.setupContrastControl();
        this.setupFontSizeControls();
        this.setupVoiceControl();
        this.setupKeyboardControl();
        this.setupAnimationsControl();
        this.setupAIAssistantControl();
        
        // Eventos de items de configuración
        document.querySelectorAll('.config-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return; // Evitar doble trigger
                
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            // Efectos hover
            item.addEventListener('mouseenter', () => {
                item.firstElementChild.style.borderColor = '#06b6d4';
                item.firstElementChild.style.background = '#f0f9ff';
            });
            
            item.addEventListener('mouseleave', () => {
                item.firstElementChild.style.borderColor = 'transparent';
                item.firstElementChild.style.background = '#f9fafb';
            });
        });
    }
    
    setupContrastControl() {
        const toggle = document.getElementById('contrast-toggle');
        toggle.addEventListener('change', () => {
            this.settings.contrast = toggle.checked;
            this.applyContrast();
            this.saveSettings();
            
            if (toggle.checked) {
                this.announce('Alto contraste activado. Los colores ahora tienen mejor visibilidad.');
                this.vibrateIfSupported([100, 50, 100]);
            } else {
                this.announce('Alto contraste desactivado. Colores normales restaurados.');
                this.vibrateIfSupported([50]);
            }
        });
    }
    
    setupFontSizeControls() {
        const increase = document.getElementById('font-increase');
        const decrease = document.getElementById('font-decrease');
        const display = document.getElementById('font-size-display');
        
        const sizes = ['small', 'normal', 'large', 'xl', 'xxl'];
        const sizeNames = {
            small: 'Pequeño',
            normal: 'Normal', 
            large: 'Grande',
            xl: 'Muy Grande',
            xxl: 'Extra Grande'
        };
        
        const updateDisplay = () => {
            display.textContent = sizeNames[this.settings.fontSize] || 'Normal';
        };
        
        increase.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentIndex = sizes.indexOf(this.settings.fontSize);
            if (currentIndex < sizes.length - 1) {
                this.settings.fontSize = sizes[currentIndex + 1];
                this.applyFontSize();
                this.saveSettings();
                updateDisplay();
                this.announce(`Tamaño de texto aumentado a ${sizeNames[this.settings.fontSize]}`);
                this.vibrateIfSupported([50, 30, 50]);
            }
        });
        
        decrease.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentIndex = sizes.indexOf(this.settings.fontSize);
            if (currentIndex > 0) {
                this.settings.fontSize = sizes[currentIndex - 1];
                this.applyFontSize();
                this.saveSettings();
                updateDisplay();
                this.announce(`Tamaño de texto reducido a ${sizeNames[this.settings.fontSize]}`);
                this.vibrateIfSupported([50, 30, 50]);
            }
        });
        
        updateDisplay();
    }
    
    setupVoiceControl() {
        const toggle = document.getElementById('voice-toggle');
        toggle.addEventListener('change', () => {
            this.settings.voice = toggle.checked;
            this.applyVoice();
            this.saveSettings();
            
            if (toggle.checked) {
                this.announce('Lector de voz activado. Los elementos se leerán cuando los selecciones.');
                this.vibrateIfSupported([200, 100, 200]);
            } else {
                this.announce('Lector de voz desactivado');
                this.vibrateIfSupported([100]);
                // Cancelar cualquier lectura en curso
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
            }
        });
    }
    
    setupKeyboardControl() {
        const toggle = document.getElementById('keyboard-toggle');
        toggle.addEventListener('change', () => {
            this.settings.keyboard = toggle.checked;
            this.applyKeyboardNavigation();
            this.saveSettings();
            
            if (toggle.checked) {
                this.announce('Navegación por teclado activada. Usa Tab para moverte entre elementos.');
            } else {
                this.announce('Navegación por teclado desactivada');
            }
        });
    }
    
    setupAnimationsControl() {
        const toggle = document.getElementById('animations-toggle');
        toggle.addEventListener('change', () => {
            this.settings.animations = !toggle.checked; // Invertido: checkbox = pausar
            this.applyAnimations();
            this.saveSettings();
            
            if (!this.settings.animations) {
                this.announce('Animaciones pausadas para reducir distracciones');
            } else {
                this.announce('Animaciones reactivadas');
            }
        });
    }
    
    setupAIAssistantControl() {
        const toggle = document.getElementById('ai-toggle');
        toggle.addEventListener('change', () => {
            this.settings.aiAssistant = toggle.checked;
            this.saveSettings();
            
            if (toggle.checked) {
                this.activateAIAssistant();
                this.announce('Asistente IA activado. Te ayudará con todas tus necesidades en YAvoy.');
            } else {
                this.deactivateAIAssistant();
                this.announce('Asistente IA desactivado');
            }
        });
    }
    
    setupGlobalEvents() {
        // Atajos de teclado globales
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.altKey) {
                switch(e.code) {
                    case 'KeyC':
                        e.preventDefault();
                        document.getElementById('contrast-toggle').click();
                        break;
                    case 'KeyV':
                        e.preventDefault();
                        document.getElementById('voice-toggle').click();
                        break;
                    case 'Equal':
                        e.preventDefault();
                        document.getElementById('font-increase').click();
                        break;
                    case 'Minus':
                        e.preventDefault();
                        document.getElementById('font-decrease').click();
                        break;
                    case 'KeyH':
                        e.preventDefault();
                        if (this.settings.aiAssistant) {
                            this.activateAIAssistant();
                        } else {
                            this.announce('Asistente IA no está activado. Actívalo desde el panel de configuración.');
                        }
                        break;
                    case 'KeyP':
                        e.preventDefault();
                        this.toggleConfigPanel();
                        break;
                }
            }
        });
        
        // Detectar cambios de página para mantener sistema activo
        this.observePageChanges();
        
        // Eventos de resize para adaptación móvil
        window.addEventListener('resize', () => {
            this.detectDevice();
            this.adaptInterfaceToDevice();
        });
    }
    
    toggleConfigPanel() {
        const panel = document.getElementById('yavoy-accessibility-panel');
        
        if (!panel) {
            console.error('Panel de accesibilidad no encontrado');
            return;
        }
        
        // Verificar estado real del panel en lugar de solo confiar en la variable
        const isCurrentlyVisible = panel.style.display !== 'none' && panel.style.opacity !== '0';
        
        if (isCurrentlyVisible || this.panelVisible) {
            // Ocultar panel
            panel.style.opacity = '0';
            panel.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                panel.style.display = 'none';
                this.panelVisible = false; // Actualizar estado después de la animación
            }, 300);
        } else {
            // Mostrar panel
            this.panelVisible = true; // Actualizar estado antes de mostrar
            panel.style.display = 'block';
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
            
            // Actualizar estado visual del panel
            this.updatePanelState();
            
            // Focus en el panel para accesibilidad
            panel.setAttribute('tabindex', '-1');
            panel.focus();
        }
    }
    
    activateSystem() {
        this.isActive = true;
        localStorage.setItem('yavoy_accessibility_active', 'true');
        
        // Aplicar todas las configuraciones
        this.applyAllSettings();
        
        // Actualizar interfaz
        this.updatePanelState();
        
        // Anuncio
        this.announce('Sistema de accesibilidad YAvoy activado. Te acompañaré en toda la aplicación.');
        
        // Vibración
        this.vibrateIfSupported([200, 100, 200, 100, 200]);
        
        // Activar seguimiento automático si está configurado
        if (this.settings.autoFollow) {
            this.enableAutoFollow();
        }
        
        console.log('✅ Sistema de Accesibilidad YAvoy activado globalmente');
    }
    
    deactivateSystem() {
        this.isActive = false;
        localStorage.setItem('yavoy_accessibility_active', 'false');
        
        // Remover todas las modificaciones
        this.removeAllModifications();
        
        // Actualizar interfaz
        this.updatePanelState();
        
        // Anuncio
        this.announce('Sistema de accesibilidad YAvoy desactivado.');
        
        // Vibración
        this.vibrateIfSupported([100, 50, 100]);
        
        console.log('❌ Sistema de Accesibilidad YAvoy desactivado');
    }
    
    updatePanelState() {
        const status = document.getElementById('system-status');
        const activateBtn = document.getElementById('activate-accessibility');
        const deactivateBtn = document.getElementById('deactivate-accessibility');
        
        if (this.isActive) {
            status.innerHTML = '✅ <strong>Sistema Activo</strong> - Te estoy acompañando en toda la aplicación';
            status.style.color = '#059669';
            activateBtn.style.display = 'none';
            deactivateBtn.style.display = 'block';
        } else {
            status.innerHTML = '⚪ <strong>Sistema Desactivado</strong> - Configura las opciones que necesites y actívalo';
            status.style.color = '#374151';
            activateBtn.style.display = 'block';
            deactivateBtn.style.display = 'none';
        }
        
        // Actualizar checkboxes según configuración actual
        document.getElementById('contrast-toggle').checked = this.settings.contrast;
        document.getElementById('voice-toggle').checked = this.settings.voice;
        document.getElementById('keyboard-toggle').checked = this.settings.keyboard;
        document.getElementById('animations-toggle').checked = !this.settings.animations;
        document.getElementById('ai-toggle').checked = this.settings.aiAssistant;
        
        // Actualizar display de font size
        const sizeNames = {
            small: 'Pequeño',
            normal: 'Normal', 
            large: 'Grande',
            xl: 'Muy Grande',
            xxl: 'Extra Grande'
        };
        document.getElementById('font-size-display').textContent = sizeNames[this.settings.fontSize] || 'Normal';
    }
    
    // Aplicar configuraciones
    applyAllSettings() {
        if (!this.isActive) return;
        
        this.applyContrast();
        this.applyFontSize();
        this.applyVoice();
        this.applyKeyboardNavigation();
        this.applyAnimations();
        
        if (this.settings.aiAssistant) {
            this.activateAIAssistant();
        }
    }
    
    applyContrast() {
        if (this.isActive && this.settings.contrast) {
            document.body.classList.add('yavoy-high-contrast');
        } else {
            document.body.classList.remove('yavoy-high-contrast');
        }
    }
    
    applyFontSize() {
        // Remover clases anteriores
        document.body.classList.remove('yavoy-font-small', 'yavoy-font-normal', 'yavoy-font-large', 'yavoy-font-xl', 'yavoy-font-xxl');
        
        if (this.isActive && this.settings.fontSize !== 'normal') {
            document.body.classList.add(`yavoy-font-${this.settings.fontSize}`);
        }
    }
    
    applyVoice() {
        if (this.isActive && this.settings.voice) {
            this.setupVoiceEvents();
        } else {
            this.removeVoiceEvents();
        }
    }
    
    applyKeyboardNavigation() {
        if (this.isActive && this.settings.keyboard) {
            document.body.classList.add('yavoy-keyboard-navigation');
        } else {
            document.body.classList.remove('yavoy-keyboard-navigation');
        }
    }
    
    applyAnimations() {
        if (this.isActive && !this.settings.animations) {
            document.body.classList.add('yavoy-reduced-motion');
        } else {
            document.body.classList.remove('yavoy-reduced-motion');
        }
    }
    
    setupVoiceEvents() {
        // Remover eventos anteriores
        this.removeVoiceEvents();
        
        // Elementos que se pueden leer
        const readableElements = 'button, a, input, h1, h2, h3, h4, h5, h6, [role="button"], .cta-card, .brand-name, nav a';
        
        document.querySelectorAll(readableElements).forEach(element => {
            const handleFocus = () => this.speakElement(element);
            const handleMouseEnter = () => this.speakElement(element);
            
            element.addEventListener('focus', handleFocus);
            element.addEventListener('mouseenter', handleMouseEnter);
            
            // Guardar referencias para poder remover después
            element._yavoyFocusHandler = handleFocus;
            element._yavoyMouseHandler = handleMouseEnter;
        });
    }
    
    removeVoiceEvents() {
        document.querySelectorAll('[data-yavoy-voice="true"]').forEach(element => {
            if (element._yavoyFocusHandler) {
                element.removeEventListener('focus', element._yavoyFocusHandler);
                delete element._yavoyFocusHandler;
            }
            if (element._yavoyMouseHandler) {
                element.removeEventListener('mouseenter', element._yavoyMouseHandler);
                delete element._yavoyMouseHandler;
            }
        });
        
        // Cancelar lectura actual
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
    
    speakElement(element) {
        if (!this.isActive || !this.settings.voice || !window.speechSynthesis) return;
        
        const text = element.getAttribute('aria-label') || 
                    element.textContent?.trim() || 
                    element.getAttribute('title') || 
                    element.getAttribute('alt') ||
                    'Elemento interactivo';
        
        if (text && text.length > 0) {
            // Cancelar lectura anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = this.deviceInfo.isMobile ? 0.8 : 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            utterance.lang = 'es-ES';
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    activateAIAssistant() {
        // Intentar activar el sistema IA existente
        if (window.yavoyAIIntegration && window.yavoyAIIntegration.toggleChat) {
            window.yavoyAIIntegration.toggleChat();
        } else if (window.initChatbot) {
            window.initChatbot();
        } else if (document.querySelector('[onclick*="chat"]')) {
            document.querySelector('[onclick*="chat"]').click();
        }
        
        // Si hay un chatbot IA avanzado, configurarlo para accesibilidad
        if (window.YAvoyAIAssistant) {
            this.configureAIForAccessibility();
        }
    }
    
    deactivateAIAssistant() {
        // Intentar cerrar chatbots activos
        const chatCloseButtons = document.querySelectorAll('[aria-label*="cerrar"], [title*="cerrar"], .chat-close, .close-chat');
        chatCloseButtons.forEach(btn => {
            if (btn.offsetParent !== null) { // Si es visible
                btn.click();
            }
        });
    }
    
    configureAIForAccessibility() {
        // Configurar IA para máxima empatía y soporte accesibilidad
        if (window.YAvoyAIAssistant) {
            const aiConfig = {
                empathy_level: 10,
                promotional_intensity: 1,
                response_style: 'friendly',
                accessibility_mode: true,
                device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop',
                user_needs: {
                    visual_assistance: this.settings.contrast || this.settings.fontSize !== 'normal',
                    audio_assistance: this.settings.voice,
                    motor_assistance: this.settings.keyboard,
                    cognitive_assistance: !this.settings.animations
                }
            };
            
            // Si existe un método para configurar accesibilidad
            if (window.yavoyAIIntegration?.setupAccessibilityMode) {
                window.yavoyAIIntegration.setupAccessibilityMode(aiConfig);
            }
        }
    }
    
    enableAutoFollow() {
        // Observar cambios de URL para mantener sistema activo
        this.observePageChanges();
        
        // Reinyectar sistema en páginas nuevas
        this.injectInNewPages();
    }
    
    observePageChanges() {
        // Observer para detectar cambios en el DOM (SPAs)
        const observer = new MutationObserver(() => {
            if (this.isActive) {
                setTimeout(() => {
                    this.applyAllSettings();
                    this.ensureInterfaceExists();
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // Observer para cambios de URL (navigation)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                if (this.isActive) {
                    setTimeout(() => {
                        this.ensureInterfaceExists();
                        this.applyAllSettings();
                    }, 1000);
                }
            }
        }).observe(document, { subtree: true, childList: true });
    }
    
    injectInNewPages() {
        // Función para inyectar en iframes o ventanas nuevas
        const checkForNewFrames = () => {
            document.querySelectorAll('iframe').forEach(iframe => {
                if (!iframe._yavoyAccessibilityInjected) {
                    try {
                        if (iframe.contentDocument) {
                            this.injectInDocument(iframe.contentDocument);
                            iframe._yavoyAccessibilityInjected = true;
                        }
                    } catch (e) {
                        // Cross-origin iframe, no se puede acceder
                    }
                }
            });
        };
        
        setInterval(checkForNewFrames, 2000);
    }
    
    injectInDocument(doc) {
        // Inyectar el sistema en un documento diferente
        if (doc.getElementById('yavoy-accessibility-btn')) return;
        
        // Inyectar estilos CSS
        this.injectStyles(doc);
        
        // NO crear botón flotante - solo usar botón del footer
        const script = doc.createElement('script');
        script.textContent = `
            if (!window.yavoyAccessibilitySystem) {
                // Referenciar al sistema principal sin botón flotante
                window.yavoyAccessibilitySystem = window.parent.yavoyAccessibilitySystem;
                
                // NO crear botón - usar solo configuración del footer
                console.log('♿ Sistema de accesibilidad vinculado (sin botón flotante)');
            }
        `;
        doc.head.appendChild(script);
    }
    
    ensureInterfaceExists() {
        // NO verificar botón flotante - solo panel y anuncios
        // Botón flotante eliminado, solo usar footer
        
        if (!document.getElementById('yavoy-accessibility-panel')) {
            this.createConfigPanel();
        }
        
        if (!document.getElementById('yavoy-announcements')) {
            this.createAnnouncementOverlay();
        }
    }
    
    adaptInterfaceToDevice() {
        const button = document.getElementById('yavoy-accessibility-btn');
        const panel = document.getElementById('yavoy-accessibility-panel');
        
        if (button) {
            if (this.deviceInfo.isMobile) {
                button.style.bottom = '80px';
                button.style.width = '70px';
                button.style.height = '70px';
                button.style.fontSize = '28px';
            } else {
                button.style.bottom = '20px';
                button.style.width = '60px';
                button.style.height = '60px';
                button.style.fontSize = '24px';
            }
        }
        
        if (panel) {
            panel.style.width = this.deviceInfo.isMobile ? '95%' : '600px';
        }
    }
    
    removeAllModifications() {
        // Remover clases CSS
        document.body.classList.remove(
            'yavoy-high-contrast',
            'yavoy-font-small',
            'yavoy-font-normal', 
            'yavoy-font-large',
            'yavoy-font-xl',
            'yavoy-font-xxl',
            'yavoy-keyboard-navigation',
            'yavoy-reduced-motion'
        );
        
        // Remover eventos de voz
        this.removeVoiceEvents();
        
        // Desactivar IA
        this.deactivateAIAssistant();
        
        // Cancelar lecturas
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
    
    // Funciones de utilidad
    announce(message) {
        const announcer = document.getElementById('yavoy-announcements');
        if (announcer) {
            announcer.textContent = message;
            
            // También usar síntesis de voz si está activa
            if (this.isActive && this.settings.voice && window.speechSynthesis) {
                setTimeout(() => {
                    const utterance = new SpeechSynthesisUtterance(message);
                    utterance.rate = 0.9;
                    utterance.lang = 'es-ES';
                    window.speechSynthesis.speak(utterance);
                }, 100);
            }
        }
        
        console.log(`🔊 Anuncio: ${message}`);
    }
    
    vibrateIfSupported(pattern) {
        if (this.deviceInfo.supportsVibration && this.deviceInfo.isMobile) {
            navigator.vibrate(pattern);
        }
    }
    
    saveSettings() {
        localStorage.setItem('yavoy_accessibility_settings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('yavoy_accessibility_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Error loading accessibility settings:', e);
            }
        }
    }
    
    injectStyles(doc = document) {
        if (doc.getElementById('yavoy-accessibility-styles')) return;
        
        const style = doc.createElement('style');
        style.id = 'yavoy-accessibility-styles';
        style.textContent = `
            /* YAVOY SISTEMA DE ACCESIBILIDAD - ESTILOS GLOBALES */
            
            /* Alto Contraste */
            .yavoy-high-contrast {
                filter: contrast(1.5) brightness(1.1) !important;
            }
            
            .yavoy-high-contrast *, 
            .yavoy-high-contrast *::before, 
            .yavoy-high-contrast *::after {
                border-color: #000 !important;
                background-color: #fff !important;
                color: #000 !important;
            }
            
            .yavoy-high-contrast a,
            .yavoy-high-contrast button,
            .yavoy-high-contrast [role="button"] {
                background-color: #000 !important;
                color: #fff !important;
                border: 2px solid #fff !important;
            }
            
            /* Tamaños de Fuente */
            .yavoy-font-small { font-size: 0.875rem !important; }
            .yavoy-font-small * { font-size: inherit !important; }
            
            .yavoy-font-large { font-size: 1.25rem !important; }
            .yavoy-font-large * { font-size: inherit !important; }
            
            .yavoy-font-xl { font-size: 1.5rem !important; }
            .yavoy-font-xl * { font-size: inherit !important; }
            
            .yavoy-font-xxl { font-size: 1.875rem !important; }
            .yavoy-font-xxl * { font-size: inherit !important; }
            
            /* Navegación por Teclado */
            .yavoy-keyboard-navigation *:focus {
                outline: 3px solid #06b6d4 !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 1px #fff, 0 0 0 4px #06b6d4 !important;
            }
            
            /* Animaciones Reducidas */
            .yavoy-reduced-motion *,
            .yavoy-reduced-motion *::before,
            .yavoy-reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
            
            /* Adaptaciones Móvil */
            @media (max-width: 768px) {
                .device-mobile .yavoy-font-large { font-size: 1.375rem !important; }
                .device-mobile .yavoy-font-xl { font-size: 1.75rem !important; }
                .device-mobile .yavoy-font-xxl { font-size: 2.25rem !important; }
                
                .device-mobile button,
                .device-mobile [role="button"],
                .device-mobile a {
                    min-height: 44px !important;
                    min-width: 44px !important;
                    padding: 12px !important;
                }
            }
            
            /* Elementos con Touch */
            .has-touch button:hover,
            .has-touch [role="button"]:hover {
                transform: scale(1.05) !important;
                transition: transform 0.1s ease !important;
            }
        `;
        
        doc.head.appendChild(style);
    }
    
    // Método público para activar desde otras páginas
    static activate() {
        if (window.yavoyAccessibilitySystem) {
            window.yavoyAccessibilitySystem.activateSystem();
        }
    }
    
    // Sistema de Control Manual Total
    manualActivation(features = ['contrast', 'voice', 'keyboard', 'fontSize']) {
        console.log('🎛️ Activación manual solicitada por el usuario');
        
        // Solo activar las funciones específicas que el usuario eligió
        features.forEach(feature => {
            if (this.settings[feature] !== undefined) {
                this.settings[feature] = true;
            }
        });
        
        // Activar sistema
        this.activateSystem();
        this.applyAllSettings();
        
        // Guardar preferencia de activación manual
        localStorage.setItem('yavoy_accessibility_manual_active', 'true');
        localStorage.setItem('yavoy_accessibility_active', 'true');
        
        console.log('✅ Accesibilidad activada manualmente');
        return true;
    }
    
    // IA Bajo Demanda - Solo cuando el usuario la solicite
    activateAIAssistance(context = 'general') {
        console.log('🤖 IA de Accesibilidad activada bajo demanda');
        
        switch(context) {
            case 'reading':
                this.settings.voice = true;
                this.applyVoiceSettings();
                console.log('📖 IA de lectura activada');
                break;
                
            case 'navigation':
                this.settings.keyboard = true;
                this.applyKeyboardSettings();
                console.log('🧭 IA de navegación activada');
                break;
                
            case 'vision':
                this.settings.contrast = true;
                this.settings.fontSize = 125;
                this.applyContrastSettings();
                this.applyFontSettings();
                console.log('👁️ IA de visión activada');
                break;
                
            case 'complete':
                this.manualActivation(['contrast', 'voice', 'keyboard', 'fontSize']);
                console.log('🚀 IA completa activada');
                break;
                
            default:
                console.log('🤖 IA lista - especifica contexto: reading, navigation, vision, complete');
        }
        
        this.saveSettings();
    }
    
    // Desactivación completa bajo control del usuario
    manualDeactivation() {
        console.log('🛑 Desactivación manual solicitada por el usuario');
        
        this.deactivateSystem();
        
        // Limpiar configuraciones
        localStorage.removeItem('yavoy_accessibility_manual_active');
        localStorage.removeItem('yavoy_accessibility_active');
        localStorage.removeItem('yavoy_accessibility_for_clients');
        
        console.log('✅ Accesibilidad desactivada completamente');
        return true;
    }
    
    // Función específica para activación para clientes (solo manual)
    activateAccessibilityForClients() {
        console.log('🎯 Activación manual para cliente solicitada...');
        
        // Solo si el usuario lo solicita explícitamente
        const userConfirmed = confirm('¿Deseas activar las funciones de accesibilidad?\n\n✅ Alto Contraste\n✅ Texto más grande\n✅ Navegación por teclado\n✅ Lector de voz\n\nEsto te ayudará si tienes alguna dificultad visual o motriz.');
        
        if (userConfirmed) {
            // Configurar funciones principales para clientes
            this.settings.contrast = true;
            this.settings.voice = true;
            this.settings.keyboard = true;
            this.settings.fontSize = 125; // Texto 25% más grande
            this.settings.reducedMotion = true;
            
            // Activar sistema
            this.activateSystem();
            this.applyAllSettings();
            
            // Marcar como activado manualmente para clientes
            localStorage.setItem('yavoy_accessibility_for_clients', 'true');
            localStorage.setItem('yavoy_accessibility_active', 'true');
            
            console.log('✅ Accesibilidad activada manualmente para cliente');
            
            // Mensaje de confirmación
            setTimeout(() => {
                alert('✅ Accesibilidad activada correctamente\n\n🎨 Alto contraste activado\n📝 Texto agrandado\n🔊 Lector de voz disponible\n⌨️ Navegación mejorada\n\nPuedes desactivar desde el botón de Accesibilidad en cualquier momento.');
            }, 500);
            
            return true;
        } else {
            console.log('❌ Usuario canceló la activación de accesibilidad');
            return false;
        }
    }
    
    // Verificar si debe activarse - pero NO auto-activar
    checkAndActivateForClients() {
        // Esta función ya no auto-activa nada
        // Solo verifica si ya estaba activado manualmente anteriormente
        const wasManuallyActivated = localStorage.getItem('yavoy_accessibility_for_clients') === 'true';
        
        if (wasManuallyActivated) {
            console.log('ℹ️ Accesibilidad previamente activada por el usuario - aplicando configuración guardada');
            
            // Solo aplicar si ya había sido activada manualmente antes
            this.activateSystem();
            this.applyAllSettings();
        } else {
            console.log('ℹ️ Accesibilidad disponible - el usuario puede activarla desde el botón cuando lo necesite');
        }
    }
    
    static deactivate() {
        if (window.yavoyAccessibilitySystem) {
            window.yavoyAccessibilitySystem.deactivateSystem();
        }
    }
    
    static toggle() {
        if (window.yavoyAccessibilitySystem) {
            if (window.yavoyAccessibilitySystem.isActive) {
                window.yavoyAccessibilitySystem.deactivateSystem();
            } else {
                window.yavoyAccessibilitySystem.activateSystem();
            }
        }
    }
}

// Auto-inicialización global - Solo cargar, no activar
document.addEventListener('DOMContentLoaded', () => {
    if (!window.yavoyAccessibilitySystem) {
        window.yavoyAccessibilitySystem = new YAvoyAccessibilitySystem();
        
        // Inyectar estilos CSS globales
        window.yavoyAccessibilitySystem.injectStyles();
        
        // Sistema listo - pero NO se activa automáticamente
        // Solo cuando el usuario lo solicite explícitamente
        
        console.log('🌟 YAvoy Sistema de Accesibilidad disponible - Control manual');
    }
});

// Exportar para uso global
window.YAvoyAccessibilitySystem = YAvoyAccessibilitySystem;