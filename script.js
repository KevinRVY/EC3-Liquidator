/* ==========================================================================
   CONTRATACIÓN Y CÁLCULO DE LIQUIDACIÓN LABORAL (D.L. 728 - PERÚ)
   ========================================================================== */

// Asignación Familiar Legal Vigente (Sueldo Mínimo S/ 1130 -> 10% = S/ 113)
const RMV = 1130.00;
const ASIGNACION_FAMILIAR_VALOR = 113.00;

document.addEventListener("DOMContentLoaded", () => {
    inicializarTema();
    inicializarEventosFormulario();
});

/* ==========================================================================
   GESTIÓN DEL MODO OSCURO (INTERACTIVO)
   ========================================================================== */
function inicializarTema() {
    const btnTheme = document.getElementById("btn-theme");
    if (!btnTheme) return;

    const temaGuardado = localStorage.getItem("theme");

    if (temaGuardado === "dark") {
        document.body.classList.add("dark-theme");
        btnTheme.textContent = "☀️ Modo Claro";
    } else {
        document.body.classList.remove("dark-theme");
        btnTheme.textContent = "🌙 Modo Oscuro";
    }

    btnTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        
        if (document.body.classList.contains("dark-theme")) {
            localStorage.setItem("theme", "dark");
            btnTheme.textContent = "☀️ Modo Claro";
        } else {
            localStorage.setItem("theme", "light");
            btnTheme.textContent = "🌙 Modo Oscuro";
        }
    });
}

/* ==========================================================================
   LÓGICA DEL FORMULARIO LABORAL
   ========================================================================== */
function inicializarEventosFormulario() {
    const tipoContratoSelect = document.getElementById("tipo-contrato");
    const grupoFechaVencimiento = document.getElementById("group-fecha-vencimiento");
    const btnCalcular = document.getElementById("btn-calcular");

    tipoContratoSelect.addEventListener("change", () => {
        if (tipoContratoSelect.value === "modal") {
            grupoFechaVencimiento.classList.remove("hidden");
            document.getElementById("fecha-termino-contrato").setAttribute("required", "required");
        } else {
            grupoFechaVencimiento.classList.add("hidden");
            document.getElementById("fecha-termino-contrato").removeAttribute("required");
            document.getElementById("fecha-termino-contrato").value = "";
        }
    });

    btnCalcular.addEventListener("click", procesarCalculoLiquidacion);
}

function procesarCalculoLiquidacion() {
    // 1. Captura de Datos
    const fInicioRaw = document.getElementById("fecha-inicio").value;
    const fCeseRaw = document.getElementById("fecha-cese").value;
    const sueldoBasico = parseFloat(document.getElementById("sueldo-basico").value);
    const tieneHijos = document.getElementById("tiene-hijos").value === "si";
    const diasInasistencia = parseInt(document.getElementById("dias-inasistencia").value) || 0;
    
    const tipoContrato = document.getElementById("tipo-contrato").value;
    const motivoCese = document.getElementById("motivo-cese").value;
    const fVencimientoRaw = document.getElementById("fecha-termino-contrato").value;

    // --- CAPA DE VALIDACIONES CORREGIDA (MÁS HUMANA) ---
    
    if (!fInicioRaw || !fCeseRaw || isNaN(sueldoBasico)) {
        alert("Error: Por favor, completa todos los campos obligatorios.");
        return;
    }

    if (sueldoBasico < RMV) {
        alert(`Error: El sueldo mensual no puede ser menor a la RMV actual (S/ ${RMV.toFixed(2)}).`);
        return;
    }

    const fechaInicio = new Date(fInicioRaw + "T00:00:00");
    const fechaCese = new Date(fCeseRaw + "T00:00:00");

    if (fechaCese < fechaInicio) {
        alert("Error: La fecha de cese no puede ser anterior a la de ingreso.");
        return;
    }

    if (tipoContrato === "modal") {
        if (!fVencimientoRaw) {
            alert("Error: Debes ingresar la fecha de vencimiento del contrato.");
            return;
        }

        const fechaVencimiento = new Date(fVencimientoRaw + "T00:00:00");

        if (fechaVencimiento < fechaInicio) {
            alert("Error: La fecha de vencimiento no puede ser anterior a la de ingreso.");
            return;
        }

        if (fechaCese > fechaVencimiento) {
            alert("Error: La fecha de cese no puede ser posterior al vencimiento del contrato.");
            return;
        }
    }

    // --- FIN DE LA CAPA DE VALIDACIÓN ---

    // 2. Determinación de Tiempo de Servicio Computable
    let tiempo = calcularTiempoExacto(fechaInicio, fechaCese);
    
    let totalDiasRecord = (tiempo.anos * 360) + (tiempo.meses * 30) + tiempo.dias;
    let totalDiasComputables = Math.max(0, totalDiasRecord - diasInasistencia);

    if (totalDiasComputables <= 0) {
        alert("Error: Los días de inasistencia superan al tiempo total trabajado.");
        return;
    }

    let anosComp = Math.floor(totalDiasComputables / 360);
    let restoDias = totalDiasComputables % 360;
    let mesesComp = Math.floor(restoDias / 30);
    let diasComp = restoDias % 30;

    // 3. Establecer Bases Computables
    const asignacionFamiliar = tieneHijos ? ASIGNACION_FAMILIAR_VALOR : 0.00;
    const remuneracionFijaMensual = sueldoBasico + asignacionFamiliar;

    const sextoGratificacion = remuneracionFijaMensual / 6;
    const baseComputableCTS = remuneracionFijaMensual + sextoGratificacion;
    
    const baseComputableGrati = remuneracionFijaMensual;
    const baseComputableVacac = remuneracionFijaMensual;

    // 4. Algoritmos Matemáticos de Beneficios Truncos
    let totalCTS = 0;
    if (totalDiasComputables >= 30) {
        totalCTS = (baseComputableCTS / 12 * anosComp) + 
                   (baseComputableCTS / 12 * mesesComp) + 
                   (baseComputableCTS / 12 / 30 * diasComp);
    }

    let totalGrati = (baseComputableGrati / 6) * mesesComp;
    let bonificacionExtra = totalGrati * 0.09;
    let totalGratiConBono = totalGrati + bonificacionExtra;

    let totalVacaciones = (baseComputableVacac / 12 * anosComp) + 
                          (baseComputableVacac / 12 * mesesComp) + 
                          (baseComputableVacac / 12 / 30 * diasComp);

    // 5. Indemnización por Despido Arbitrario
    let totalIndemnizacion = 0;
    const cardIndemnizacion = document.getElementById("card-indemnizacion");

    if (motivoCese === "despido") {
        if (tipoContrato === "indeterminado") {
            let sueldosIndemnizables = 1.5 * (anosComp + (mesesComp / 12) + (diasComp / 360));
            if (sueldosIndemnizables > 12) sueldosIndemnizables = 12;
            totalIndemnizacion = baseComputableVacac * sueldosIndemnizables;
        } else if (tipoContrato === "modal") {
            const fechaVencimiento = new Date(fVencimientoRaw + "T00:00:00");
            if (fechaVencimiento > fechaCese) {
                let tiempoFaltante = calcularTiempoExacto(fechaCese, fechaVencimiento);
                let mesesFaltantes = (tiempoFaltante.anos * 12) + tiempoFaltante.meses + (tiempoFaltante.dias / 30);
                totalIndemnizacion = (baseComputableVacac * 1.5) * mesesFaltantes;
                
                const topeMaximoModal = baseComputableVacac * 12;
                if (totalIndemnizacion > topeMaximoModal) totalIndemnizacion = topeMaximoModal;
            }
        }
    }

    // 6. Consolidación y Despliegue de Resultados
    const totalNetoLiquidacion = totalCTS + totalGratiConBono + totalVacaciones + totalIndemnizacion;

    document.getElementById("res-asig").textContent = `S/ ${asignacionFamiliar.toFixed(2)}`;
    document.getElementById("res-cts").textContent = `S/ ${totalCTS.toFixed(2)}`;
    document.getElementById("res-grati").textContent = `S/ ${totalGratiConBono.toFixed(2)} (Incluye 9% Bono)`;
    document.getElementById("res-vacaciones").textContent = `S/ ${totalVacaciones.toFixed(2)}`;
    
    if (totalIndemnizacion > 0) {
        document.getElementById("res-indemnizacion").textContent = `S/ ${totalIndemnizacion.toFixed(2)}`;
        cardIndemnizacion.style.display = "flex";
    } else {
        cardIndemnizacion.style.display = "none";
    }

    document.getElementById("res-total").textContent = `S/ ${totalNetoLiquidacion.toFixed(2)}`;
    document.getElementById("resultados").style.display = "block";

    // INYECCIÓN AUTOMÁTICA DEL DICTAMEN JURÍDICO
    generarDictamenJuridico();
}

function calcularTiempoExacto(fInicio, fCese) {
    let anos = fCese.getFullYear() - fInicio.getFullYear();
    let meses = fCese.getMonth() - fInicio.getMonth();
    let dias = fCese.getDate() - fInicio.getDate();

    if (dias < 0) {
        meses--;
        dias += 30;
    }
    if (meses < 0) {
        anos--;
        meses += 12;
    }
    return { anos, meses, dias };
}

/* ==========================================================================
   NUEVO: PANEL DE DICTAMEN Y RECOMENDACIONES JURÍDICAS (D.L. 728)
   ========================================================================== */
function generarDictamenJuridico() {
    const motivoCese = document.getElementById("motivo-cese").value;
    const tieneHijos = document.getElementById("tiene-hijos").value === "si";
    const tipoContrato = document.getElementById("tipo-contrato").value;
    const diasInasistencia = parseInt(document.getElementById("dias-inasistencia").value) || 0;
    const contenedorAlertas = document.getElementById("alertas-dinamicas-legales");

    if (!contenedorAlertas) return;

    let dictamenHTML = "";

    // 1. Análisis del Motivo del Cese e Indemnización (D.S. N° 003-97-TR)
    if (motivoCese === "despido") {
        dictamenHTML += `
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #ef4444; font-weight: bold;">🔴 ALERTA CRÍTICA: Despido Arbitrario Detectado</p>
                <p style="margin: 0; text-align: justify;">
                    Al haberse configurado un cese por despido unilateral, se ha activado la protección resarcitoria del <strong>Artículo 38 del D.S. 003-97-TR</strong>. El sistema ha incorporado la indemnización equivalente a 1.5 remuneraciones por año completo o dozavos según corresponda. 
                    <br><strong>Acción Recomendada:</strong> El trabajador cuenta con un plazo de caducidad perentorio de <strong>30 días naturales</strong> para interponer una demanda ordinaria por despido arbitrario o solicitar la tutela inspectiva ante la <strong>SUNAFIL</strong>.
                </p>
            </div>
        `;
    } else if (motivoCese === "renuncia") {
        dictamenHTML += `
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #3b82f6; font-weight: bold;">🔵 Cese por Voluntad del Trabajador (Renuncia / Mutuo Disenso)</p>
                <p style="margin: 0; text-align: justify;">
                    Al tratarse de una desvinculación voluntaria, se extingue el derecho a percibir una indemnización por despido. Sin embargo, se mantiene incólume el derecho al cobro de los beneficios truncos acumulados (CTS, Gratificaciones y Vacaciones) prorrateados por los meses y días efectivamente laborados, siempre que se registre al menos un mes de servicios en la empresa.
                </p>
            </div>
        `;
    } else if (motivoCese === "termino" && tipoContrato === "modal") {
        dictamenHTML += `
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #f59e0b; font-weight: bold;">🟡 Extinción por Vencimiento de Contrato Sujeto a Modalidad</p>
                <p style="margin: 0; text-align: justify;">
                    El cese se produce de forma ordinaria por la llegada del término pactado. Recuerde verificar que la causa objetiva de contratación estipulada en su contrato modal físico se encuentre debidamente justificada en la realidad; de lo contrario, podría configurarse una desnaturalización contractual, transformando el vínculo en indeterminado.
                </p>
            </div>
        `;
    }

    // 2. Incidencia de la Carga Familiar (Ley N° 25129)
    if (tieneHijos) {
        dictamenHTML += `
            <div style="margin-bottom: 15px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
                <p style="margin: 0 0 5px 0; color: #10b981; font-weight: bold;">👶 Protección y Concepto de Asignación Familiar</p>
                <p style="margin: 0; text-align: justify;">
                    Conforme a la <strong>Ley N° 25129</strong>, el subsidio por carga familiar equivale de forma fija al 10% de la Remuneración Mínima Vital vigente (S/ 113.00). Al tener naturaleza estrictamente <strong>remunerativa</strong>, el sistema ha indexado este monto de forma obligatoria dentro de la base imponible computable, incrementando legalmente el valor final de su CTS, Gratificaciones y Vacaciones truncas.
                </p>
            </div>
        `;
    }

    // 3. Fiscalización de Días No Computables (Ausencias / Licencias sin goce)
    if (diasInasistencia > 0) {
        dictamenHTML += `
            <div style="margin-bottom: 15px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
                <p style="margin: 0 0 5px 0; color: #6b7280; font-weight: bold;">⏳ Deducción por Días No Computables</p>
                <p style="margin: 0; text-align: justify;">
                    Se han registrado ${diasInasistencia} días correspondientes a inasistencias injustificadas o licencias sin goce de haber. Conforme a las normas de cálculo de la CTS y Vacaciones, estos periodos de suspensión perfecta del contrato de trabajo se deducen a razón de treintavos del periodo de cálculo, reduciendo proporcionalmente el beneficio final.
                </p>
            </div>
        `;
    }

    // 4. Prescripción Legal de Derechos Laborales (Norma Constitucional)
    dictamenHTML += `
        <div style="margin-top: 15px; font-style: italic; color: var(--text-sub); border-top: 1px solid var(--border-color); padding-top: 10px; font-size: 0.8rem;">
            ⚖️ <strong>Plazo de Prescripción Extintiva:</strong> De acuerdo con la Ley N° 27321, las acciones para reclamar derechos de remuneraciones y beneficios sociales nacidos de la relación laboral prescriben de forma irrevocable a los <strong>4 años</strong>, contados a partir del día siguiente de la fecha de cese definitivo.
        </div>
    `;

    contenedorAlertas.innerHTML = dictamenHTML;
}
