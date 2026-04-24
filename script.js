// ⚠️ CONFIGURACIÓN: Cambia este enlace por el de tu formulario de Google
const ENLACE_FORMULARIO = 'https://docs.google.com/forms/d/e/1FAIpQLSf8ee65OD9BVuRDh-WKe4DUEITmzkI-6BPQy_2Bf42fKezCHQ/viewform';

// Variables de estado
let formularioAbierto = false;
let ventanaFormulario = null;

/**
 * Abre el formulario de Google en una nueva ventana
 */
function abrirFormulario() {
    // Si ya hay una ventana abierta del formulario, la cerramos primero
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
}

/**
 * Calcula el tiempo restante hasta el próximo corte
 * @param {number} minutosActuales - Minutos actuales
 * @param {number} segundosActuales - Segundos actuales
 * @returns {Object} Objeto con minutos y segundos restantes
 */
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

/**
 * Actualiza el reloj y gestiona los avisos de corte
 */
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
        
        // Reiniciar el flag cuando cambie el minuto
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

// Iniciar el sistema
function iniciarSistema() {
    // Actualizar cada segundo
    setInterval(actualizarReloj, 1000);
    
    // Primera actualización inmediata
    actualizarReloj();
    
    // Mensaje de confirmación en consola
    console.log('🕐 Sistema de Reloj de Cortes - CDMX');
    console.log('✅ Sistema activado correctamente');
    console.log('⏰ Se abrirá el formulario en los minutos 29 y 59');
    console.log('📝 Formulario configurado:', ENLACE_FORMULARIO);
    console.log('💡 Recuerda permitir ventanas emergentes en tu navegador');
}

// Iniciar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', iniciarSistema);