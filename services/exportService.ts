import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { EbiosProject, StrategicScenario, Likelihood } from '../types';
import { Severity } from '../types';

const THEME = {
  primary: [21, 101, 192] as [number, number, number],
  accent: [13, 71, 161] as [number, number, number],
  lightBg: [245, 248, 255] as [number, number, number],
  text: [34, 34, 34] as [number, number, number],
  mutedText: [117, 117, 117] as [number, number, number],
};

type PageOrientation = 'portrait' | 'landscape';

const SEVERITY_ORDER: Severity[] = [Severity.MINEURE, Severity.SIGNIFICATIVE, Severity.GRAVE, Severity.CRITICAL];
const LIKELIHOOD_ORDER: Likelihood[] = ['Peu vraisemblable', 'Vraisemblable', 'Très vraisemblable', 'Quasi-certain'];

const COLOR_GRID: [number, number, number][][] = [
  // Likelihood: Peu vraisemblable, Vraisemblable, Très vraisemblable, Quasi-certain (columns handled later)
  [
    [198, 239, 206],
    [255, 243, 191],
    [255, 243, 191],
    [255, 243, 191],
  ],
  [
    [198, 239, 206],
    [255, 243, 191],
    [255, 224, 178],
    [255, 224, 178],
  ],
  [
    [255, 243, 191],
    [255, 224, 178],
    [255, 205, 210],
    [255, 205, 210],
  ],
  [
    [255, 243, 191],
    [255, 224, 178],
    [239, 154, 154],
    [239, 154, 154],
  ],
];

const getPageWidth = (doc: jsPDF): number => ((doc.internal.pageSize as any).getWidth ? (doc.internal.pageSize as any).getWidth() : doc.internal.pageSize.width);
const getPageHeight = (doc: jsPDF): number => ((doc.internal.pageSize as any).getHeight ? (doc.internal.pageSize as any).getHeight() : doc.internal.pageSize.height);

const fillPageBackground = (doc: jsPDF, color: [number, number, number]) => {
  const pageWidth = getPageWidth(doc);
  const pageHeight = getPageHeight(doc);
  doc.setFillColor(...color);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
};

const addPageWithBackground = (
  doc: jsPDF,
  { color = THEME.lightBg, orientation = 'portrait' }: { color?: [number, number, number]; orientation?: PageOrientation } = {},
) => {
  doc.addPage(orientation === 'landscape' ? 'landscape' : 'portrait');
  fillPageBackground(doc, color);
};

const getUniqueScenarios = (scenarios: StrategicScenario[]): StrategicScenario[] => {
  const uniqueMap = new Map<string, StrategicScenario>();
  scenarios.forEach((scenario) => {
    if (!uniqueMap.has(scenario.id)) {
      uniqueMap.set(scenario.id, scenario);
    }
  });
  return Array.from(uniqueMap.values());
};

const getMatrixColor = (severity: Severity, likelihood: Likelihood): [number, number, number] => {
  const severityIndex = SEVERITY_ORDER.indexOf(severity);
  const likelihoodIndex = LIKELIHOOD_ORDER.indexOf(likelihood);
  if (severityIndex === -1 || likelihoodIndex === -1) {
    return [224, 224, 224];
  }
  return COLOR_GRID[likelihoodIndex][severityIndex];
};

const createScenarioLabelMap = (scenarios: StrategicScenario[]): Record<string, string> => {
  return scenarios.reduce((acc, scenario, index) => {
    acc[scenario.id] = `R${index + 1}`;
    return acc;
  }, {} as Record<string, string>);
};

const computeRiskMatrix = (
  project: EbiosProject,
  scenarios: StrategicScenario[],
): Record<Severity, Record<Likelihood, StrategicScenario[]>> => {
  const matrix = {} as Record<Severity, Record<Likelihood, StrategicScenario[]>>;
  SEVERITY_ORDER.forEach((severity) => {
    matrix[severity] = {} as Record<Likelihood, StrategicScenario[]>;
    LIKELIHOOD_ORDER.forEach((likelihood) => {
      matrix[severity][likelihood] = [];
    });
  });

  scenarios.forEach((scenario) => {
    const dreadedEvent = project.dreadedEvents.find((de) => de.id === scenario.dreadedEventId);
    if (!dreadedEvent) return;
    const likelihood = scenario.residualLikelihood || scenario.likelihood;
    if (matrix[dreadedEvent.severity] && matrix[dreadedEvent.severity][likelihood]) {
      matrix[dreadedEvent.severity][likelihood].push(scenario);
    }
  });

  return matrix;
};

const addTextSection = (doc: jsPDF, title: string, content: string, startY: number): number => {
  if (!content) return startY;
  const pageHeight = getPageHeight(doc);
  if (startY > pageHeight - 40) {
    addPageWithBackground(doc, { color: [255, 255, 255] });
    startY = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...THEME.primary);
  doc.text(title, 14, startY);
  doc.setDrawColor(...THEME.primary);
  doc.setLineWidth(0.6);
  doc.line(14, startY + 2, getPageWidth(doc) - 14, startY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...THEME.text);
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 14, startY + 10);
  return startY + 10 + splitText.length * 5 + 12;
};

const addRiskMatrixSection = (doc: jsPDF, project: EbiosProject) => {
  const uniqueScenarios = getUniqueScenarios(project.strategicScenarios);
  if (uniqueScenarios.length === 0) {
    return;
  }

  addPageWithBackground(doc, { orientation: 'landscape' });
  let pageWidth = getPageWidth(doc);
  let pageHeight = getPageHeight(doc);

  const scenarioLabelMap = createScenarioLabelMap(uniqueScenarios);
  const matrix = computeRiskMatrix(project, uniqueScenarios);

  let currentY = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...THEME.primary);
  doc.text('Synthèse Visuelle : Matrice des Risques', 14, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...THEME.mutedText);
  const introText = "Cette matrice positionne chaque scénario stratégique selon la gravité de l'événement redouté et la vraisemblance résiduelle (ou initiale si aucun traitement).";
  const introLines = doc.splitTextToSize(introText, pageWidth - 28);
  doc.text(introLines, 14, currentY);
  currentY += introLines.length * 5 + 10;

  const cellWidth = 45;
  const cellHeight = 30;
  const totalTableWidth = cellWidth * (LIKELIHOOD_ORDER.length + 1);
  const tableStartX = (pageWidth - totalTableWidth) / 2;
  const tableStartY = currentY + 16;

  // Column headers (Likelihood)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...THEME.primary);
  LIKELIHOOD_ORDER.forEach((likelihood, index) => {
    const headerX = tableStartX + (index + 1) * cellWidth;
    doc.setFillColor(225, 234, 252);
    doc.rect(headerX, tableStartY - 12, cellWidth, 12, 'F');
    doc.setDrawColor(...THEME.accent);
    doc.rect(headerX, tableStartY - 12, cellWidth, 12, 'S');
    doc.text(likelihood, headerX + cellWidth / 2, tableStartY - 4, { align: 'center' });
  });

  // Row headers (Severity) and cells
  SEVERITY_ORDER.forEach((severity, rowIndex) => {
    const rowY = tableStartY + rowIndex * cellHeight;

    // Severity header cell
    doc.setFillColor(225, 234, 252);
    doc.setDrawColor(...THEME.accent);
    doc.rect(tableStartX, rowY, cellWidth, cellHeight, 'F');
    doc.rect(tableStartX, rowY, cellWidth, cellHeight, 'S');
    doc.setTextColor(...THEME.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(severity, tableStartX + cellWidth / 2, rowY + cellHeight / 2, {
      align: 'center',
      baseline: 'middle',
    });

    // Risk cells
    LIKELIHOOD_ORDER.forEach((likelihood, colIndex) => {
      const cellX = tableStartX + (colIndex + 1) * cellWidth;
      const cellY = rowY;
      const [r, g, b] = getMatrixColor(severity, likelihood);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(255, 255, 255);
      doc.rect(cellX, cellY, cellWidth, cellHeight, 'FD');

      const scenarios = matrix[severity]?.[likelihood] ?? [];
      const labels = scenarios.map((scenario) => scenarioLabelMap[scenario.id]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      if (labels.length > 0) {
        const labelText = labels.join(', ');
        const lines = doc.splitTextToSize(labelText, cellWidth - 6);
        const textStartY = cellY + cellHeight / 2 - ((lines.length - 1) * 3);
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line, cellX + cellWidth / 2, textStartY + lineIndex * 6, {
            align: 'center',
            baseline: 'middle',
          });
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text('--', cellX + cellWidth / 2, cellY + cellHeight / 2, {
          align: 'center',
          baseline: 'middle',
        });
      }
    });
  });

  // Axes labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...THEME.mutedText);
  doc.text('Gravité', tableStartX - 14, tableStartY + (SEVERITY_ORDER.length * cellHeight) / 2, {
    angle: 90,
    align: 'center',
  });
  LIKELIHOOD_ORDER.forEach((likelihood: Likelihood, index: number) => {
    const axisX = tableStartX + (index + 1) * cellWidth;
    doc.setDrawColor(...THEME.accent);
    doc.line(axisX, tableStartY + SEVERITY_ORDER.length * cellHeight, axisX + cellWidth, tableStartY + SEVERITY_ORDER.length * cellHeight);
  });
  doc.text('Vraisemblance', tableStartX + ((LIKELIHOOD_ORDER.length + 1) * cellWidth) / 2, tableStartY + SEVERITY_ORDER.length * cellHeight + 14, {
    align: 'center',
  });

  // Legend
  let legendY = tableStartY + SEVERITY_ORDER.length * cellHeight + 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...THEME.primary);
  doc.text('Légende détaillée des scénarios stratégiques', 14, legendY);
  legendY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...THEME.text);

  let legendWidth = pageWidth - 28;
  uniqueScenarios.forEach((scenario, index) => {
    if (legendY > pageHeight - 40) {
      addPageWithBackground(doc, { orientation: 'landscape' });
      pageWidth = getPageWidth(doc);
      pageHeight = getPageHeight(doc);
      legendWidth = pageWidth - 28;
      legendY = 24;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...THEME.text);
    }
    const label = scenarioLabelMap[scenario.id];
    const intro = `${label} – ${scenario.description}`;
    const introLines = doc.splitTextToSize(intro, legendWidth);
    doc.text(introLines, 14, legendY);
    legendY += introLines.length * 5;

    const transition = scenario.residualLikelihood
      ? `Transition de vraisemblance : ${scenario.likelihood} → ${scenario.residualLikelihood}`
      : `Vraisemblance initiale : ${scenario.likelihood} (traitement en attente)`;
    const transitionLines = doc.splitTextToSize(transition, legendWidth);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...THEME.mutedText);
    doc.text(transitionLines, 17, legendY + 2);
    legendY += transitionLines.length * 5 + 6;

    if (scenario.residualLikelihood && scenario.residualLikelihoodJustification) {
      const justification = `Justification : ${scenario.residualLikelihoodJustification}`;
      const justificationLines = doc.splitTextToSize(justification, legendWidth);
      doc.text(justificationLines, 17, legendY);
      legendY += justificationLines.length * 5 + 4;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...THEME.text);
    if (index !== uniqueScenarios.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(14, legendY, pageWidth - 14, legendY);
      legendY += 6;
    }
  });
};

const applyPageNumbers = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = getPageWidth(doc);
  const pageHeight = getPageHeight(doc);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setTextColor(...THEME.mutedText);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - 16, pageHeight - 10, { align: 'right' });
  }
};

export const exportToPdf = (project: EbiosProject) => {
  const doc = new jsPDF();
  let currentY = 20;

  const pageWidth = getPageWidth(doc);
  const pageHeight = getPageHeight(doc);
  fillPageBackground(doc, THEME.lightBg);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.primary);
  doc.text("Rapport d'Analyse de Risque EBIOS RM", 105, currentY, { align: 'center' });
  doc.setDrawColor(...THEME.accent);
  doc.setLineWidth(1);
  doc.line(35, currentY + 4, pageWidth - 35, currentY + 4);
  currentY += 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.text);
  doc.text('Atelier 1: Cadrage et Socle de Sécurité', 14, currentY);
  currentY += 10;

  currentY = addTextSection(doc, '1. Contexte', project.context, currentY);
  currentY = addTextSection(doc, '2. Socle de Sécurité', project.securityBaseline, currentY);

  autoTable(doc, {
    startY: currentY,
    head: [['3. Valeurs Métier', 'Description']],
    body: project.businessValues.map((v) => [v.name, v.description]),
    theme: 'grid',
    headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [236, 240, 253] },
    styles: { fontSize: 9, textColor: THEME.text, cellPadding: 3 },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [["4. Événements Redoutés", 'Gravité']],
    body: project.dreadedEvents.map((e) => [e.name, e.severity]),
    theme: 'grid',
    headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [236, 240, 253] },
    styles: { fontSize: 9, textColor: THEME.text, cellPadding: 3 },
  });

  addPageWithBackground(doc, { color: [255, 255, 255] });
  currentY = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.text);
  doc.text('Atelier 2: Sources de Risque', 14, currentY);
  autoTable(doc, {
    startY: currentY + 10,
    head: [['Source de Risque', 'Profil', 'Description (Motivation)']],
    body: project.riskSources.map((s) => [s.name, s.profile || s.type, s.description]),
    theme: 'grid',
    headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [236, 240, 253] },
    styles: { fontSize: 9, textColor: THEME.text, cellPadding: 3 },
  });

  addPageWithBackground(doc, { color: [255, 255, 255] });
  currentY = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.text);
  doc.text('Atelier 3: Scénarios Stratégiques', 14, currentY);
  autoTable(doc, {
    startY: currentY + 10,
    head: [['Description du Scénario', 'Source de Risque', "Événement Redouté", 'Vraisemblance']],
    body: project.strategicScenarios.map((s) => [
      s.description,
      project.riskSources.find((rs) => rs.id === s.riskSourceId)?.name || 'N/A',
      project.dreadedEvents.find((de) => de.id === s.dreadedEventId)?.name || 'N/A',
      s.likelihood,
    ]),
    theme: 'grid',
    headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [236, 240, 253] },
    styles: { fontSize: 9, textColor: THEME.text, cellPadding: 3 },
  });

  addPageWithBackground(doc, { color: [255, 255, 255] });
  currentY = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.text);
  doc.text('Atelier 4: Scénarios Opérationnels', 14, currentY);
  currentY += 15;
  project.strategicScenarios.forEach((ss) => {
    if (currentY > 250) {
      addPageWithBackground(doc, { color: [255, 255, 255] });
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const ssTitle = `Depuis le scénario stratégique : ${ss.description}`;
    const splitTitle = doc.splitTextToSize(ssTitle, 180);
    doc.text(splitTitle, 14, currentY);
    currentY += splitTitle.length * 5 + 4;

    const opScenarios = project.operationalScenarios.filter((os) => os.strategicScenarioId === ss.id);
    if (opScenarios.length > 0) {
      opScenarios.forEach((os) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const osContent = doc.splitTextToSize(os.description, 175);
        doc.text(osContent, 18, currentY);
        currentY += osContent.length * 5 + 8;
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Aucun scénario opérationnel détaillé pour ce scénario stratégique.', 18, currentY);
      currentY += 10;
    }
  });

  addPageWithBackground(doc, { color: [255, 255, 255] });
  currentY = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.text);
  doc.text('Atelier 5: Traitement du Risque', 14, currentY);
  currentY += 15;
  project.operationalScenarios.forEach((os) => {
    const measures = project.securityMeasures.filter((sm) => sm.operationalScenarioId === os.id);
    const ss = project.strategicScenarios.find((s) => s.id === os.strategicScenarioId);

    if (currentY > 220) {
      addPageWithBackground(doc, { color: [255, 255, 255] });
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Pour le scénario opérationnel suivant :', 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const osContent = doc.splitTextToSize(os.description, 180);
    doc.text(osContent, 14, currentY);
    currentY += osContent.length * 5 + 4;

    if (measures.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Mesures de Sécurité Proposées', 'Type']],
        body: measures.map((m) => [m.description, m.type]),
        theme: 'striped',
        headStyles: { fillColor: [21, 101, 192] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    } else {
      doc.text('Aucune mesure de sécurité proposée pour ce scénario.', 14, currentY);
      currentY += 10;
    }

    if (ss && ss.residualLikelihood) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Synthèse du traitement :', 14, currentY);
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      const justificationText = `Transition de vraisemblance : ${ss.likelihood} -> ${ss.residualLikelihood}. Justification : ${ss.residualLikelihoodJustification}`;
      const splitJustification = doc.splitTextToSize(justificationText, 180);
      doc.text(splitJustification, 14, currentY);
      currentY += splitJustification.length * 4 + 5;
    }
    currentY += 10;
  });

  addRiskMatrixSection(doc, project);

  applyPageNumbers(doc);
  doc.save('Rapport_Analyse_EBIOS_RM.pdf');
};

export const exportToExcel = (project: EbiosProject) => {
  const wb = XLSX.utils.book_new();

  const contextData = [
    { Section: 'Contexte', Contenu: project.context },
    { Section: 'Socle de Sécurité', Contenu: project.securityBaseline },
  ];
  const wsContext = XLSX.utils.json_to_sheet(contextData);
  XLSX.utils.book_append_sheet(wb, wsContext, 'Contexte et Socle');

  const wsValues = XLSX.utils.json_to_sheet(project.businessValues.map(({ id, ...rest }) => rest));
  XLSX.utils.book_append_sheet(wb, wsValues, 'Valeurs Métier');

  const wsEvents = XLSX.utils.json_to_sheet(project.dreadedEvents.map(({ id, businessValueId, ...rest }) => rest));
  XLSX.utils.book_append_sheet(wb, wsEvents, "Événements Redoutés");

  const wsSources = XLSX.utils.json_to_sheet(project.riskSources.map(({ id, ...rest }) => rest));
  XLSX.utils.book_append_sheet(wb, wsSources, 'Sources de Risque');

  const strategicScenariosData = project.strategicScenarios.map((s) => ({
    Description: s.description,
    Vraisemblance: s.likelihood,
    'Vraisemblance Résiduelle': s.residualLikelihood,
    'Justification Traitement': s.residualLikelihoodJustification,
    'Source de Risque': project.riskSources.find((rs) => rs.id === s.riskSourceId)?.name || 'N/A',
    "Événement Redouté": project.dreadedEvents.find((de) => de.id === s.dreadedEventId)?.name || 'N/A',
  }));
  const wsStrategic = XLSX.utils.json_to_sheet(strategicScenariosData);
  XLSX.utils.book_append_sheet(wb, wsStrategic, 'Scénarios Stratégiques');

  const operationalScenariosData = project.operationalScenarios.map((os) => {
    const parentSS = project.strategicScenarios.find((ss) => ss.id === os.strategicScenarioId);
    return {
      'Scénario Opérationnel': os.description,
      'Lié au Scénario Stratégique': parentSS?.description || 'N/A',
    };
  });
  const wsOperational = XLSX.utils.json_to_sheet(operationalScenariosData);
  XLSX.utils.book_append_sheet(wb, wsOperational, 'Scénarios Opérationnels');

  const securityMeasuresData = project.securityMeasures.map((sm) => {
    const parentOS = project.operationalScenarios.find((os) => os.id === sm.operationalScenarioId);
    return {
      'Mesure de Sécurité': sm.description,
      Type: sm.type,
      'Liée au Scénario Opérationnel': parentOS?.description || 'N/A',
    };
  });
  const wsMeasures = XLSX.utils.json_to_sheet(securityMeasuresData);
  XLSX.utils.book_append_sheet(wb, wsMeasures, 'Mesures de Sécurité');

  XLSX.writeFile(wb, 'Synthese_Analyse_EBIOS_RM.xlsx');
};
