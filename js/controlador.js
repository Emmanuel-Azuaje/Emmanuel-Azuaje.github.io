class Controlador {
    constructor(modelo, vista) {
        this.modelo = modelo;
        this.vista = vista;
        
        // Estado de ordenamiento
        this.sortConfig = {
            campo: 'fecha',
            descendente: true
        };
        
        // Tasa BCV cacheada para evitar spam a la API
        this.dolarPromedio = null;

        // Enlaces de eventos
        this.vista.enlazarAgregarRegistro(this.manejarAgregarRegistro.bind(this));
        this.vista.enlazarEliminarRegistro(this.manejarEliminarRegistro.bind(this));
        this.vista.enlazarActualizarRegistro(this.manejarActualizarRegistro.bind(this));
        this.vista.enlazarOrdenarTabla(this.manejarOrdenarTabla.bind(this));
    }

    async inicializar() {
        this.vista.tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Conectando con Servidor Local Node.js...</td></tr>`;
        
        // Cargar tasa de dólar al iniciar (asíncrono sin bloquear)
        this.modelo.obtenerTasaDolar().then(tasa => {
            if (tasa) {
                // Formateamos para asgurar que sea número en caso de que la respuesta sea rara
                this.dolarPromedio = parseFloat(tasa);
            }
            this.onListaRegistrosCambiada(); // Re renderiza dolares
        });

        await this.modelo.inicializar();
        
        // Iniciar en la UI el estado visual del sort
        const thDefecto = document.querySelector(`th[data-sort="${this.sortConfig.campo}"]`);
        this.vista.actualizarIconosOrden(thDefecto, this.sortConfig.descendente);

        this.onListaRegistrosCambiada();
    }

    onListaRegistrosCambiada() {
        const registros = this.modelo.obtenerRegistros(this.sortConfig);
        const stats = this.modelo.obtenerEstadisticas();
        const rendimientoSemestres = this.modelo.obtenerRendimientoPorSemestre();
        
        this.vista.mostrarRegistros(registros);
        this.vista.actualizarEstadisticas(stats, this.dolarPromedio, rendimientoSemestres);
    }

    manejarOrdenarTabla(campo, thElemento) {
        if (this.sortConfig.campo === campo) {
            // Si tocamos la misma columna, invierte el orden
            this.sortConfig.descendente = !this.sortConfig.descendente;
        } else {
            // Nueva columna, orden descendente por defecto
            this.sortConfig.campo = campo;
            this.sortConfig.descendente = true;
        }

        this.vista.actualizarIconosOrden(thElemento, this.sortConfig.descendente);
        this.onListaRegistrosCambiada();
    }

    async manejarAgregarRegistro(registro) {
        await this.modelo.agregarRegistro(registro);
        this.onListaRegistrosCambiada();
    }

    async manejarEliminarRegistro(id) {
        await this.modelo.eliminarRegistro(id);
        this.onListaRegistrosCambiada();
    }

    async manejarActualizarRegistro(id, registroActualizado) {
        await this.modelo.actualizarRegistro(id, registroActualizado);
        this.onListaRegistrosCambiada();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new Controlador(new Modelo(), new Vista());
    await app.inicializar();
});
