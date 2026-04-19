class Vista {
    constructor() {
        // Formulario y elementos
        this.form = document.getElementById('registro-form');
        this.formTitle = document.getElementById('form-title');
        this.inputId = document.getElementById('registro-id');
        this.inputNombre = document.getElementById('nombre');
        this.selectSemestre = document.getElementById('semestre');
        this.selectTipoPago = document.getElementById('tipo-pago');
        this.groupReferencia = document.getElementById('referencia-group');
        this.inputReferencia = document.getElementById('referencia');
        this.inputMonto = document.getElementById('monto');
        this.inputFecha = document.getElementById('fecha');
        this.btnSubmit = document.getElementById('btn-submit');
        this.btnCancel = document.getElementById('btn-cancel');

        // Dashboard stats
        this.statTotalIngresos = document.getElementById('total-ingresos');
        this.statTotalRegistros = document.getElementById('total-registros');
        this.statTotalUSD = document.getElementById('total-ingresos-usd');
        this.tasaDolarInfo = document.getElementById('tasa-dolar-info');
        this.listaSemestresStats = document.getElementById('lista-semestres-stats');

        // Tabla
        this.tablaBody = document.getElementById('registros-body');
        this.headersSortables = document.querySelectorAll('th.sortable');

        // Pestañas y Gráfico
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        this.chartInstance = null;

        // Inicializar UI
        this._inicializarSelectSemestres();
        this._configurarEventosUI();
        
        // Callbacks (se asignan en el controlador)
        this.onAgregarRegistro = null;
        this.onEliminarRegistro = null;
        this.onActualizarRegistro = null;
        this.onOrdenarTabla = null;
    }

    _inicializarSelectSemestres() {
        const semestres = ['1er Semestre', '2do Semestre', '3er Semestre', '4to Semestre', '5to Semestre', '6to Semestre', '7mo Semestre', '8vo Semestre', 'Pasantes', 'Egresados'];
        semestres.forEach(sem => {
            const option = document.createElement('option');
            option.value = sem;
            option.textContent = sem;
            this.selectSemestre.appendChild(option);
        });

        this.inputFecha.valueAsDate = new Date();
    }

    _configurarEventosUI() {
        this.selectTipoPago.addEventListener('change', () => {
            if (this.selectTipoPago.value === 'Pago Móvil') {
                this.groupReferencia.style.display = 'block';
                this.inputReferencia.required = true;
            } else {
                this.groupReferencia.style.display = 'none';
                this.inputReferencia.required = false;
                this.inputReferencia.value = '';
            }
        });

        this.btnCancel.addEventListener('click', () => {
            this._resetForm();
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._manejarSubmit();
        });

        // Configurar Eventos para Ordenamiento de Tabla
        this.headersSortables.forEach(th => {
            th.addEventListener('click', () => {
                const campo = th.getAttribute('data-sort');
                if (this.onOrdenarTabla) {
                    this.onOrdenarTabla(campo, th);
                }
            });
        });

        // Configurar Pestañas
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabBtns.forEach(b => b.classList.remove('active'));
                this.tabPanes.forEach(p => p.style.display = 'none');
                
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                document.getElementById(targetId).style.display = 'block';
            });
        });
    }

    _manejarSubmit() {
        const registro = {
            nombre: this.inputNombre.value.trim(),
            semestre: this.selectSemestre.value,
            tipoPago: this.selectTipoPago.value,
            referencia: this.selectTipoPago.value === 'Pago Móvil' ? this.inputReferencia.value.trim() : null,
            monto: parseFloat(this.inputMonto.value),
            fecha: this.inputFecha.value
        };

        const idEditando = this.inputId.value;

        if (idEditando) {
            if (this.onActualizarRegistro) {
                this.onActualizarRegistro(idEditando, registro);
            }
        } else {
            if (this.onAgregarRegistro) {
                this.onAgregarRegistro(registro);
            }
        }

        this._resetForm();
    }

    _resetForm() {
        this.form.reset();
        this.inputId.value = '';
        this.formTitle.textContent = 'Nuevo Registro';
        this.btnSubmit.textContent = 'Guardar Registro';
        this.btnCancel.style.display = 'none';
        this.groupReferencia.style.display = 'none';
        this.inputReferencia.required = false;
        this.inputFecha.valueAsDate = new Date(); 
    }

    _llenarFormularioParaEditar(registro) {
        this.inputId.value = registro.id;
        this.inputNombre.value = registro.nombre;
        this.selectSemestre.value = registro.semestre;
        this.selectTipoPago.value = registro.tipoPago;
        this.inputMonto.value = registro.monto;
        this.inputFecha.value = registro.fecha;

        const event = new Event('change');
        this.selectTipoPago.dispatchEvent(event);

        if (registro.referencia) {
            this.inputReferencia.value = registro.referencia;
        }

        this.formTitle.textContent = 'Editar Registro';
        this.btnSubmit.textContent = 'Actualizar Registro';
        this.btnCancel.style.display = 'inline-flex';
        
        this.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    enlazarAgregarRegistro(callback) {
        this.onAgregarRegistro = callback;
    }

    enlazarEliminarRegistro(callback) {
        this.onEliminarRegistro = callback;
    }

    enlazarActualizarRegistro(callback) {
        this.onActualizarRegistro = callback;
    }

    enlazarOrdenarTabla(callback) {
        this.onOrdenarTabla = callback;
    }

    actualizarIconosOrden(thActivo, descendente) {
        // Limpiar todas las clases
        this.headersSortables.forEach(th => {
            th.classList.remove('active');
            const icon = th.querySelector('i');
            icon.className = 'fa-solid fa-sort'; // Resetear a flechas dobles
        });

        // Configurar la columna activa
        if (thActivo) {
            thActivo.classList.add('active');
            const icon = thActivo.querySelector('i');
            icon.className = descendente ? 'fa-solid fa-sort-down' : 'fa-solid fa-sort-up';
        }
    }

    mostrarRegistros(registros) {
        this.tablaBody.innerHTML = '';

        if (registros.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay registros aún.</td>`;
            this.tablaBody.appendChild(tr);
            return;
        }

        registros.forEach(registro => {
            const tr = document.createElement('tr');
            let metodoClase = registro.tipoPago === 'Efectivo' ? 'method-efectivo' : 'method-pago-movil';
            let refTexto = registro.referencia ? `#${registro.referencia}` : 'N/A';
            const montoFormateado = parseFloat(registro.monto).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const fechaObj = new Date(registro.fecha + 'T00:00:00'); 
            const fechaStr = fechaObj.toLocaleDateString('es-VE');

            tr.innerHTML = `
                <td>${fechaStr}</td>
                <td style="font-weight: 500;">${registro.nombre}</td>
                <td>${registro.semestre}</td>
                <td><span class="method-tag ${metodoClase}">${registro.tipoPago}</span></td>
                <td>${refTexto}</td>
                <td style="font-weight: 600;">Bs. ${montoFormateado}</td>
                <td>
                    <button class="action-btn btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            const btnEdit = tr.querySelector('.btn-edit');
            btnEdit.addEventListener('click', () => {
                this._llenarFormularioParaEditar(registro);
            });

            const btnDelete = tr.querySelector('.btn-delete');
            btnDelete.addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que deseas eliminar el registro de ${registro.nombre}?`)) {
                    if (this.onEliminarRegistro) {
                        this.onEliminarRegistro(registro.id);
                    }
                }
            });

            this.tablaBody.appendChild(tr);
        });
    }

    actualizarEstadisticas(stats, dolarPromedio, rendimientoSemestres) {
        this.statTotalRegistros.textContent = stats.totalRegistros;
        
        // Total Bs
        this.statTotalIngresos.textContent = stats.totalIngresos.toLocaleString('es-VE', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });

        // Total USD
        if (dolarPromedio && dolarPromedio > 0) {
            const totalUSD = stats.totalIngresos / dolarPromedio;
            this.statTotalUSD.textContent = `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            this.tasaDolarInfo.textContent = `Tasa BCV: Bs. ${dolarPromedio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            this.statTotalUSD.textContent = "No disponible";
            this.tasaDolarInfo.textContent = "Error al conectar API BCV";
        }

        // Semestres
        this.listaSemestresStats.innerHTML = '';
        if (Object.keys(rendimientoSemestres).length === 0) {
            this.listaSemestresStats.innerHTML = '<li>Sin registros aún</li>';
        } else {
            for (const [semestre, data] of Object.entries(rendimientoSemestres)) {
                const li = document.createElement('li');
                li.innerHTML = `${semestre} <span style="color:var(--primary); font-weight:700;">(${data.estudiantes})</span>`;
                this.listaSemestresStats.appendChild(li);
            }
        }

        // Actualizar Gráfico
        this._actualizarGrafico(rendimientoSemestres);
    }

    _actualizarGrafico(rendimientoSemestres) {
        const ctx = document.getElementById('semestresChart');
        if (!ctx) return;
        
        const labels = Object.keys(rendimientoSemestres);
        const dataEstudiantes = labels.map(l => rendimientoSemestres[l].estudiantes);
        const dataIngresos = labels.map(l => rendimientoSemestres[l].ingresos);

        if (this.chartInstance) {
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = dataIngresos;
            this.chartInstance.data.datasets[1].data = dataEstudiantes;
            this.chartInstance.update();
        } else {
            this.chartInstance = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos (Bs)',
                            data: dataIngresos,
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderRadius: 6,
                            yAxisID: 'yIngresos'
                        },
                        {
                            label: 'N° Estudiantes',
                            data: dataEstudiantes,
                            type: 'line',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            backgroundColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 3,
                            yAxisID: 'yEstudiantes'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yIngresos: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'Monto Recaudado (Bs)' },
                            beginAtZero: true
                        },
                        yEstudiantes: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'N° Estudiantes' },
                            beginAtZero: true,
                            grid: { drawOnChartArea: false },
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        }
    }
}
