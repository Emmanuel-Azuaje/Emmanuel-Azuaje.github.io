class Modelo {
    constructor() {
        this.registros = [];
        this.apiUrl = 'http://localhost:3000/api/registros';
    }

    async inicializar() {
        try {
            const response = await fetch(this.apiUrl);
            let datosServidor = await response.json();

            const datosLocalesStr = localStorage.getItem('registros_unefa');
            if (datosLocalesStr) {
                const datosLocales = JSON.parse(datosLocalesStr);
                
                if (datosLocales.length > 0 && datosServidor.length === 0) {
                    console.log("Migrando datos de localStorage al servidor Node.js...");
                    this.registros = datosLocales;
                    await this._commit(); 
                    localStorage.removeItem('registros_unefa'); 
                } else if (datosLocales.length > 0) {
                    localStorage.removeItem('registros_unefa');
                    this.registros = datosServidor;
                } else {
                    this.registros = datosServidor;
                }
            } else {
                this.registros = datosServidor;
            }
        } catch (error) {
            console.error('Error al inicializar el Modelo - ¿Está encendido el servidor Node?', error);
            this.registros = [];
            alert("No se pudo conectar con el servidor Node.js local. Los datos se guardarán temporalmente en memoria, enciende el servidor.");
        }
    }

    async _commit() {
        try {
            await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.registros)
            });
        } catch (error) {
            console.error('Error al guardar datos en el servidor:', error);
        }
    }

    async obtenerTasaDolar() {
        try {
            const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const data = await response.json();
            return data.promedio;
        } catch (error) {
            console.error('Error al obtener tasa BCV:', error);
            return null;
        }
    }

    async agregarRegistro(registro) {
        registro.id = Date.now().toString();
        this.registros.push(registro);
        await this._commit();
    }

    obtenerRegistros(sortConfig = null) {
        let copy = [...this.registros];

        if (sortConfig && sortConfig.campo) {
            copy.sort((a, b) => {
                let valA = a[sortConfig.campo];
                let valB = b[sortConfig.campo];

                if (sortConfig.campo === 'monto') {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                } else if (sortConfig.campo === 'fecha') {
                    valA = new Date(valA).getTime();
                    valB = new Date(valB).getTime();
                } else {
                    valA = valA ? valA.toString().toLowerCase() : '';
                    valB = valB ? valB.toString().toLowerCase() : '';
                }

                if (valA < valB) return sortConfig.descendente ? 1 : -1;
                if (valA > valB) return sortConfig.descendente ? -1 : 1;
                return 0;
            });
        } else {
            // Predeterminado descendente por fecha
            copy.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }

        return copy;
    }

    async eliminarRegistro(id) {
        this.registros = this.registros.filter(registro => registro.id !== id);
        await this._commit();
    }

    async actualizarRegistro(id, registroActualizado) {
        this.registros = this.registros.map(registro => 
            registro.id === id ? { ...registroActualizado, id } : registro
        );
        await this._commit();
    }

    obtenerEstadisticas() {
        const totalRegistros = this.registros.length;
        const totalIngresos = this.registros.reduce((suma, registro) => suma + parseFloat(registro.monto), 0);
        return {
            totalRegistros,
            totalIngresos
        };
    }

    obtenerRendimientoPorSemestre() {
        const rendimientoDesordenado = {};
        this.registros.forEach(registro => {
            const sem = registro.semestre;
            const monto = parseFloat(registro.monto) || 0;
            
            if (!rendimientoDesordenado[sem]) {
                rendimientoDesordenado[sem] = { estudiantes: 0, ingresos: 0 };
            }
            rendimientoDesordenado[sem].estudiantes += 1;
            rendimientoDesordenado[sem].ingresos += monto;
        });

        // Orden estricto de mayor a menor
        const ordenDeseado = [
            'Egresados', 
            'Pasantes', 
            '8vo Semestre', 
            '7mo Semestre', 
            '6to Semestre', 
            '5to Semestre', 
            '4to Semestre', 
            '3er Semestre', 
            '2do Semestre', 
            '1er Semestre'
        ];

        const rendimientoOrdenado = {};
        ordenDeseado.forEach(sem => {
            if (rendimientoDesordenado[sem]) {
                rendimientoOrdenado[sem] = rendimientoDesordenado[sem];
            }
        });

        // Añadir cualquier otro valor anómalo al final
        Object.keys(rendimientoDesordenado).forEach(sem => {
            if (!rendimientoOrdenado[sem]) {
                rendimientoOrdenado[sem] = rendimientoDesordenado[sem];
            }
        });

        return rendimientoOrdenado;
    }
}
