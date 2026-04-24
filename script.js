// ⚠️ CONFIGURACIÓN - TU ENLACE DEL FORMULARIO DE GOOGLE
const ENLACE_FORMULARIO = 'https://docs.google.com/forms/d/e/1FAIpQLSf8ee65OD9BVuRDh-WKe4DUEITmzkI-6BPQy_2Bf42fKezCHQ/viewform';

// 🧪 MODO PRUEBA: true = cortes cada 2 minutos | false = cortes en :29 y :59
const MODO_PRUEBA = false;

let formularioAbierto = false;
let ventanaFormulario = null;
let botonMostrado = false;

// ========== INICIALIZACIÓN SEGURA ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🕐 Iniciando Reloj de Cortes CDMX');
    console.log('📝 Formulario:', ENLACE_FORMULARIO);
    
    if (MODO_PRUEBA) {
        console.log('🧪 MODO PRUEBA ACTIVADO - Cortes cada 2 minutos');
    } else {
        console.log('⚡ MODO NORMAL - Cortes en minutos :29 y :59');
    }
    
    iniciarSistema();
});

// ========== FUNCIÓN PRINCIPAL ==========
function iniciarSistema() {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
}

function actualizarReloj() {
    try {
        const ahora = new Date();
        
        // Obtener hora CDMX
        const opcionesHora = {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        const horaCDMX = new Intl.DateTimeFormat('es-MX', opcionesHora).format(ahora);
        const partes = horaCDMX.split(':');
        const horas = partes[0];
        const minutos = partes[1];
        const segundos = partes[2];
        
        // Actualizar display
        const relojElement = document.getElementById('reloj');
        const segundosElement = document.getElementById('segundos');
        if (relojElement) relojElement.textContent = `${horas}:${minutos}`;
        if (segundosElement) segundosElement.textContent = segundos;
        
        // Actualizar fecha
        const opcionesFecha = {
            timeZone: 'America/Mexico_City',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const fechaCDMX = new Intl.DateTimeFormat('es-MX', opcionesFecha).format(ahora);
        const fechaElement = document.getElementById('fecha');
        if (fechaElement) fechaElement.textContent = fechaCDMX;
        
        // Convertir a números
        const minutosNum = parseInt(minutos);
        const segundosNum = parseInt(segundos);
        
        // Actualizar contador
        actualizarContador(minutosNum, segundosNum);
        
        // Verificar si es minuto de corte
        verificarCorte(minutosNum, segundosNum);
        
    } catch (error) {
        console.error('Error en actualizarReloj:', error);
    }
}

function actualizarContador(minutosActuales, segundosActuales) {
    const elementoTiempoRestante = document.getElementById('tiempo-restante');
    const elementoContador = document.getElementById('contador');
    
    if (!elementoTiempoRestante || !elementoContador) return;
    
    let minutosHastaCorte;
    
    if (MODO_PRUEBA) {
        // Próximo múltiplo de 2
        let proximoPar;
        if (minutosActuales % 2 === 0 && segundosActuales === 0) {
            proximoPar = minutosActuales + 2;
        } else {
            proximoPar = Math.ceil(minutosActuales / 2) * 2;
            if (proximoPar === minutosActuales && segundosActuales > 0) {
                proximoPar += 2;
            }
        }
        
        if (proximoPar >= 60) {
            minutosHastaCorte = 60 - minutosActuales + (proximoPar - 60);
        } else {
            minutosHastaCorte = proximoPar - minutosActuales;
        }
    } else {
        // Modo normal: :29 y :59
        if (minutosActuales < 29) {
            minutosHastaCorte = 29 - minutosActuales;
        } else if (minutosActuales < 59) {
            minutosHastaCorte = 59 - minutosActuales;
        } else {
            minutosHastaCorte = 60 - minutosActuales + 29;
        }
    }
    
    const segundosHastaCorte = (minutosHastaCorte * 60) - segundosActuales;
    const minutosRestantes = Math.floor(segundosHastaCorte / 60);
    const segundosRestantes = segundosHastaCorte % 60;
    
    elementoTiempoRestante.textContent = 
        `${String(minutosRestantes).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
    elementoContador.style.display = 'block';
    
    // Color del contador
    if (segundosHastaCorte <= 60) {
        elementoContador.style.color = '#ff3b3b';
        elementoTiempoRestante.style.color = '#ffd700';
    } else {
        elementoContador.style.color = '#ffd700';
        elementoTiempoRestante.style.color = '#ff3b3b';
    }
}

function verificarCorte(minutosActuales, segundosActuales) {
    let esMinutoDeCorte;
    
    if (MODO_PRUEBA) {
        esMinutoDeCorte = (minutosActuales % 2 === 0);
    } else {
        esMinutoDeCorte = (minutosActuales === 29 || minutosActuales === 59);
    }
    
    const elementoAviso = document.getElementById('aviso');
    const elementoEstado = document.getElementById('estado');
    const elementoModoPrueba = document.getElementById('modo-prueba');
    
    if (esMinutoDeCorte) {
        if (elementoAviso) elementoAviso.style.display = 'block';
        if (elementoEstado) {
            elementoEstado.textContent = '🔴 ¡CORTE ACTIVO - Abre el formulario!';
            elementoEstado.className = 'estado alerta-activa';
        }
        
        // Activar en el segundo 0
        if (segundosActuales === 0 && !formularioAbierto) {
            activarModoCorte();
        }
        
        if (segundosActuales === 1) {
            formularioAbierto = false;
        }
    } else {
        if (elementoAviso) elementoAviso.style.display = 'none';
        if (elementoEstado) {
            if (MODO_PRUEBA) {
                elementoEstado.textContent = '🧪 Modo prueba - Cortes cada 2 minutos';
            } else {
                elementoEstado.textContent = '✅ Monitoreando - Esperando próximo corte';
            }
            elementoEstado.className = 'estado';
        }
        
        formularioAbierto = false;
        ocultarBotonFormulario();
    }
    
    // Mostrar/ocultar indicador modo prueba
    if (elementoModoPrueba) {
        elementoModoPrueba.style.display = MODO_PRUEBA ? 'block' : 'none';
    }
}

// ========== FUNCIONES DEL FORMULARIO ==========
function activarModoCorte() {
    console.log('🔔 Activando modo corte');
    mostrarBotonFormulario();
    
    // Intentar abrir automáticamente
    try {
        ventanaFormulario = window.open(
            ENLACE_FORMULARIO, 
            '_blank',
            'width=800,height=900,scrollbars=yes,resizable=yes'
        );
        
        if (ventanaFormulario) {
            console.log('✅ Formulario abierto automáticamente');
            formularioAbierto = true;
        } else {
            console.log('⚠️ No se pudo abrir automáticamente, usa el botón');
        }
    } catch (error) {
        console.log('🔴 El navegador bloqueó la apertura automática');
        console.log('💡 Haz clic en el botón para abrir el formulario');
    }
}

function mostrarBotonFormulario() {
    if (botonMostrado) return;
    
    const botonContainer = document.getElementById('boton-formulario');
    if (botonContainer) {
        botonContainer.style.display = 'block';
        botonMostrado = true;
        console.log('🔘 Botón de formulario mostrado');
    }
}

function ocultarBotonFormulario() {
    const botonContainer = document.getElementById('boton-formulario');
    if (botonContainer) {
        botonContainer.style.display = 'none';
        botonMostrado = false;
    }
}