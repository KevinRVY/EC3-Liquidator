/* ==========================================================================
   EXPORTACIÓN DE EXPEDIENTE A PDF (jsPDF)
   ========================================================================== */
document.getElementById("btn-pdf").addEventListener("click", () => {
    // 1. Verificar si hay resultados visibles antes de exportar
    if (document.getElementById("resultados").style.display === "none") {
        alert("Primero debes calcular la liquidación para poder exportar el PDF.");
        return;
    }

    // 2. Inicializar jsPDF (usando el espacio de nombres correcto para v2.5.1)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // 3. Capturar los valores actuales de la pantalla
    const fechaInicio = document.getElementById("fecha-inicio").value;
    const fechaCese = document.getElementById("fecha-cese").value;
    const tipoContrato = document.getElementById("tipo-contrato").options[document.getElementById("tipo-contrato").selectedIndex].text;
    const motivoCese = document.getElementById("motivo-cese").options[document.getElementById("motivo-cese").selectedIndex].text;
    const sueldoBasico = document.getElementById("sueldo-basico").value;
    
    const resAsig = document.getElementById("res-asig").textContent;
    const resCts = document.getElementById("res-cts").textContent;
    const resGrati = document.getElementById("res-grati").textContent;
    const resVacaciones = document.getElementById("res-vacaciones").textContent;
    const resTotal = document.getElementById("res-total").textContent;

    // Verificar si la indemnización está activa
    const cardIndemnizacion = document.getElementById("card-indemnizacion");
    const resIndemnizacion = cardIndemnizacion.style.display !== "none" ? document.getElementById("res-indemnizacion").textContent : "S/ 0.00";

    // 4. Diseño y Estructura del PDF
    let y = 20; // Control de posición vertical

    // Encabezado / Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Liquidator ⚖️", 20, y);
    
    y += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Liquidación de Beneficios Sociales - D.L. 728", 20, y);
    
    // Línea divisoria
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);

    // Sección 1: Datos Contractuales
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Datos de Control Temporal y Contractual", 20, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 8;
    doc.text(`Fecha de Ingreso: ${fechaInicio}`, 25, y);
    y += 6;
    doc.text(`Fecha de Cese: ${fechaCese}`, 25, y);
    y += 6;
    doc.text(`Tipo de Contrato: ${tipoContrato}`, 25, y);
    y += 6;
    doc.text(`Motivo de Cese: ${motivoCese}`, 25, y);
    y += 6;
    doc.text(`Última Remuneración Mensual: S/ ${parseFloat(sueldoBasico).toFixed(2)}`, 25, y);

    // Sección 2: Desglose de Beneficios Truncos
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("2. Desglose de Beneficios Sociales Estimados", 20, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 8;
    doc.text(`Asignación Familiar Incorporada:`, 25, y);
    doc.text(resAsig, 140, y, { align: "right" });
    
    y += 6;
    doc.text(`Compensación por Tiempo de Servicios (CTS) Trunca:`, 25, y);
    doc.text(resCts, 140, y, { align: "right" });
    
    y += 6;
    doc.text(`Gratificación Trunca Semestral:`, 25, y);
    doc.text(resGrati, 140, y, { align: "right" });
    
    y += 6;
    doc.text(`Vacaciones Truncas Acumuladas:`, 25, y);
    doc.text(resVacaciones, 140, y, { align: "right" });

    y += 6;
    doc.text(`Indemnización por Despido Arbitrario:`, 25, y);
    doc.text(resIndemnizacion, 140, y, { align: "right" });

    // Línea de Total
    y += 5;
    doc.setLineWidth(0.25);
    doc.line(25, y, 140, y);

    // Total Neto
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL NETO ESTIMADO A PAGAR:`, 25, y);
    doc.text(resTotal, 140, y, { align: "right" });

    // Sección 3: Dictamen Jurídico y Plazos
    y += 18;
    doc.setFontSize(12);
    doc.text("3. Criterios de Cumplimiento Legal", 20, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 6;
    const notaPago = doc.splitTextToSize("Plazo de Pago Obligatorio: Conforme a la legislación del régimen privado peruano, el empleador cuenta con un plazo máximo de 48 horas posteriores al cese de labores para depositar el íntegro de la liquidación, entregar la constancia de baja (T-Registro) y la carta de retiro de CTS. El incumplimiento genera intereses legales automáticos y multas por parte de la SUNAFIL.", 165);
    doc.text(notaPago, 20, y);

    y += 20;
    const notaPrescripcion = doc.splitTextToSize("Prescripción Extintiva: De acuerdo con la Ley N° 27321, las acciones para reclamar el cobro de derechos remunerativos y beneficios sociales prescriben de forma irrevocable a los 4 años, contabilizados desde el día siguiente de la extinción definitiva del vínculo laboral.", 165);
    doc.text(notaPrescripcion, 20, y);

    // Pie de página de Descargo de responsabilidad
    y += 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const disclaimer = doc.splitTextToSize("Nota de Exención: Este documento es una simulación matemática basada en los datos ingresados por el usuario y los lineamientos del D.L. 728. Tiene carácter estrictamente referencial e informativo.", 165);
    doc.text(disclaimer, 20, y);

    // 5. Descargar el archivo con nombre dinámico
    doc.save(`Expediente_Liquidacion_${fechaCese || "D.L.728"}.pdf`);
});
