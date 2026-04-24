// ⚠️ CONFIGURACIÓN: Cambia este enlace por el de tu formulario de Google
const ENLACE_FORMULARIO = 'https://docs.google.com/forms/d/e/1FAIpQLSf8ee65OD9BVuRDh-WKe4DUEITmzkI-6BPQy_2Bf42fKezCHQ/viewform ';

// Variables de estado
let formularioAbierto = false;
let ventanaFormulario = null;

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado correctamente');
                
                // Escuchar mensajes del Service Worker
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.tipo === 'CORTE') {
                        console.log('🔔 Corte detectado por SW:', event.data.hora);
                        abrirFormulario();
                    }
                });
            })
            .catch(error => {
                console.error('❌ Error al registrar Service Worker:', error);
            });
    });
}

// ========== NOTIFICACIONES ==========
function solicitarPermisoNotificaciones() {
    if (!('Notification' in window)) {
        console.warn('⚠️ Este navegador no soporta notificaciones');
        return;
    }
    
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('🔔 Notificaciones permitidas - Recibirás avisos aunque la pantalla esté apagada');
            } else {
                console.warn('⚠️ Notificaciones bloqueadas - No recibirás avisos con pantalla apagada');
            }
        });
    }
}

// ========== FUNCIONES PRINCIPALES ==========
function abrirFormulario() {
    // Si ya hay una ventana abierta, la cerramos
    if (ventanaFormulario && !ventanaFormulario.closed) {
        ventanaFormulario.close();
    }
    
    // Abrir formulario en nueva ventana
    ventanaFormulario = window.open(
        ENLACE_FORMULARIO, 
        'FormularioCorte', 
        'width=800,height=900,scrollbars=yes,resizable=yes'
    );
    
    formularioAbierto = true;
    console.log('📝 Formulario abierto a las', new Date().toLocaleTimeString());
}

function calcularTiempoRestante(minutosActuales, segundosActuales) {
    let minutosHastaCorte;
    
    if (minutosActuales < 29) {
        minutosHastaCorte = 29 - minutosActuales;
    } else if (minutosActuales < 59) {
        minutosHastaCorte = 59 - minutosActuales;
    } else {
        minutosHastaCorte = 60 - minutosActuales + 29;
    }
    
    const segundosHastaCorte = (minutosHastaCorte * 60) - segundosActuales;
    const minutosRestantes = Math.floor(segundosHastaCorte / 60);
    const segundosRestantes = segundosHastaCorte % 60;
    
    return { minutos: minutosRestantes, segundos: segundosRestantes };
}

function actualizarReloj() {
    // Obtener la hora actual de Ciudad de México
    const ahora = new Date();
    const opcionesHora = {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    const horaCDMX = new Intl.DateTimeFormat('es-MX', opcionesHora).format(ahora);
    const [horas, minutos, segundos] = horaCDMX.split(':');
    
    // Actualizar el reloj principal
    document.getElementById('reloj').textContent = `${horas}:${minutos}`;
    document.getElementById('segundos').textContent = segundos;
    
    // Actualizar la fecha
    const opcionesFecha = {
        timeZone: 'America/Mexico_City',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const fechaCDMX = new Intl.DateTimeFormat('es-MX', opcionesFecha).format(ahora);
    document.getElementById('fecha').textContent = fechaCDMX;
    
    // Convertir a números
    const minutosActuales = parseInt(minutos);
    const segundosActuales = parseInt(segundos);
    
    // Elementos del DOM
    const elementoAviso = document.getElementById('aviso');
    const elementoEstado = document.getElementById('estado');
    const elementoContador = document.getElementById('contador');
    const elementoTiempoRestante = document.getElementById('tiempo-restante');
    
    // Calcular y mostrar tiempo restante
    const tiempoRestante = calcularTiempoRestante(minutosActuales, segundosActuales);
    elementoTiempoRestante.textContent = 
        `${String(tiempoRestante.minutos).padStart(2, '0')}:${String(tiempoRestante.segundos).padStart(2, '0')}`;
    elementoContador.style.display = 'block';
    
    // Calcular segundos totales hasta el próximo corte
    const segundosHastaCorte = (tiempoRestante.minutos * 60) + tiempoRestante.segundos;
    
    // LÓGICA PRINCIPAL: Detectar el minuto 29 y 59
    const esMinutoDeCorte = (minutosActuales === 29 || minutosActuales === 59);
    
    if (esMinutoDeCorte) {
        // Durante TODO el minuto 29 y 59 (60 segundos)
        elementoAviso.style.display = 'block';
        elementoEstado.textContent = '🔴 ¡CORTE ACTIVO - Rellena el formulario!';
        elementoEstado.className = 'estado alerta-activa';
        
        // Abrir el formulario SOLO en el primer segundo del minuto de corte
        if (segundosActuales === 0 && !formularioAbierto) {
            abrirFormulario();
        }
        
        // Reiniciar el flag cuando empiece el siguiente segundo
        if (segundosActuales === 1) {
            formularioAbierto = false;
        }
    } else {
        // Fuera del minuto de corte
        elementoAviso.style.display = 'none';
        elementoEstado.textContent = '✅ Monitoreando - Esperando próximo corte';
        elementoEstado.className = 'estado';
        formularioAbierto = false;
        
        // Cerrar ventana del formulario si está abierta
        if (ventanaFormulario && !ventanaFormulario.closed) {
            ventanaFormulario.close();
        }
    }
    
    // Cambiar color del contador cuando falta poco
    if (segundosHastaCorte <= 60) {
        elementoContador.style.color = '#ff3b3b';
        elementoTiempoRestante.style.color = '#ffd700';
    } else {
        elementoContador.style.color = '#ffd700';
        elementoTiempoRestante.style.color = '#ff3b3b';
    }
}

// ========== INICIALIZACIÓN ==========
function iniciarSistema() {
    // Actualizar cada segundo
    setInterval(actualizarReloj, 1000);
    
    // Primera actualización inmediata
    actualizarReloj();
    
    // Solicitar permiso de notificaciones
    solicitarPermisoNotificaciones();
    
    console.log('🕐 Sistema de Reloj de Cortes - CDMX');
    console.log('✅ Sistema activado correctamente');
    console.log('⏰ Se abrirá el formulario en los minutos 29 y 59 de cada hora');
    console.log('📝 Formulario configurado:', ENLACE_FORMULARIO);
    console.log('💡 El sistema funciona aunque la pantalla esté apagada');
}

// Iniciar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', iniciarSistema);