// Service Worker para Reloj de Cortes CDMX
const INTERVALOS_CORTE = [29, 59];
const ENLACE_FORMULARIO = 'https://docs.google.com/forms/d/e/1FAIpQLSf8ee65OD9BVuRDh-WKe4DUEITmzkI-6BPQy_2Bf42fKezCHQ/viewform ';

// Instalación del Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker instalado');
    self.skipWaiting(); // Activar inmediatamente
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activado');
    event.waitUntil(clients.claim()); // Tomar control de todas las pestañas
});

// Función principal de verificación
function verificarCorte() {
    try {
        const ahora = new Date();
        const horaCDMX = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const minutos = horaCDMX.getMinutes();
        const segundos = horaCDMX.getSeconds();
        const horas = horaCDMX.getHours();
        
        // Si es minuto 29 o 59 y segundo 0
        if (INTERVALOS_CORTE.includes(minutos) && segundos === 0) {
            const horaFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
            
            console.log('🔔 ¡Corte detectado!', horaFormateada);
            
            // 1. Notificar a todas las pestañas abiertas
            self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        tipo: 'CORTE',
                        hora: horaFormateada
                    });
                });
            });
            
            // 2. Mostrar notificación del sistema
            self.registration.showNotification('⚠️ ¡HORA DE CORTE!', {
                body: `Son las ${horaFormateada} - Abre el formulario para rellenar los datos`,
                icon: '⏰',
                badge: '⏰',
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                tag: 'corte-horario',
                data: {
                    url: ENLACE_FORMULARIO,
                    hora: horaFormateada
                }
            });
        }
    } catch (error) {
        console.error('Error en verificación:', error);
    }
}

// Verificar cada segundo
setInterval(verificarCorte, 1000);

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const urlFormulario = event.notification.data.url || ENLACE_FORMULARIO;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Si hay una ventana abierta, enfocarla y abrir formulario
            for (let client of windowClients) {
                if ('focus' in client) {
                    client.focus();
                    // Enviar mensaje para abrir formulario
                    client.postMessage({
                        tipo: 'CORTE',
                        hora: event.notification.data.hora
                    });
                    return;
                }
            }
            // Si no hay ventana, abrir la página principal
            if (clients.openWindow) {
                return clients.openWindow(self.registration.scope);
            }
        })
    );
});

// Mantener el Service Worker vivo
self.addEventListener('periodicsync', event => {
    if (event.tag === 'verificar-corte') {
        event.waitUntil(verificarCorte());
    }
});

console.log('🕐 Service Worker de Cortes CDMX inicializado');