import { jsPDF } from 'jspdf';
import { autoTable, type CellHookData } from 'jspdf-autotable';
import { CHECK_DESCRIPTIONS } from './check-descriptions';
import { reportEnd, reportRows, type ReportFilter } from './report';
import type { Inspection, LocalRow, Station } from './types';
const date = (value: string) => value.split('-').reverse().join('/');
const number = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
const state = {
  pending: 'Pendente',
  synced: 'Sincronizado',
  conflict: 'Conflito',
};
export function createReportPdf(
  rows: LocalRow<Inspection>[],
  stations: LocalRow<Station>[],
  filter: ReportFilter,
  font: string,
  logo: string,
  now = new Date(),
) {
  const selected = reportRows(rows, filter);
  if (!selected.length)
    throw new Error(
      'Não há registros para o período e os turnos selecionados.',
    );
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });
  doc.addFileToVFS('NotoSans.ttf', font);
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
  doc.setFont('NotoSans', 'normal');
  const heading = () => {
    doc.addImage(logo, 'PNG', 14, 8, 44, 11);
    doc.setFontSize(14);
    doc.setTextColor(64, 64, 66);
    doc.text('Verificação de estações de solda', 64, 14);
    doc.setFontSize(9);
    doc.text(
      `${date(filter.start)} a ${date(reportEnd(filter))} · Turnos: ${filter.shifts.join(', ')} · ${selected.length} registro(s)`,
      64,
      20,
    );
    doc.setDrawColor(249, 155, 28);
    doc.line(14, 25, 283, 25);
  };
  const common = {
    margin: { left: 14, right: 14, top: 30, bottom: 17 },
    styles: {
      font: 'NotoSans',
      fontStyle: 'normal' as const,
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak' as const,
    },
    headStyles: {
      fillColor: [64, 64, 66] as [number, number, number],
      fontStyle: 'normal' as const,
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [247, 247, 247] as [number, number, number],
    },
    didDrawPage: heading,
    rowPageBreak: 'avoid' as const,
    // Noto Sans não inclui o glifo matemático ≤. Preserve o significado por extenso.
    didParseCell: (data: CellHookData) => {
      data.cell.text = data.cell.text.map((text) =>
        text.replaceAll('≤', 'menor ou igual a'),
      );
    },
  };
  autoTable(doc, {
    ...common,
    startY: 30,
    head: [
      [
        'Data / turno / momento',
        'Linha / posto / modelo',
        'Inspetor',
        '1 · Equip.',
        '2 · Fio',
        '3 · Ω',
        '4 · mV',
        '5 · °C',
        'Resultado',
        'Envio',
      ],
    ],
    body: selected.map(({ data: i, status }) => {
      const s = stations.find((s) => s.id === i.stationId)?.data;
      return [
        `${date(i.productionDate)}\n${i.shift}º · ${i.moment}`,
        s ? `${s.line}\n${s.code}\n${s.model}` : i.stationId,
        i.inspector,
        i.physical,
        i.solder,
        number(i.resistance),
        number(i.voltage),
        number(i.temperature),
        i.result,
        state[status],
      ];
    }),
    columnStyles: {
      0: { cellWidth: 31 },
      1: { cellWidth: 43 },
      2: { cellWidth: 41 },
      3: { cellWidth: 20 },
      4: { cellWidth: 17 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 23 },
      9: { cellWidth: 40 },
    },
  });
  doc.addPage();
  autoTable(doc, {
    ...common,
    startY: 30,
    head: [['Itens de verificação — descrições do papel']],
    body: Object.values(CHECK_DESCRIPTIONS).map((description, index) => [
      `${index + 1} · ${description}`,
    ]),
  });
  const y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;
  autoTable(doc, {
    ...common,
    startY: y,
    head: [['Rastreabilidade e limites preservados em cada coleta']],
    body: selected.map(({ data: i, status, error }) => {
      const s = stations.find((s) => s.id === i.stationId)?.data;
      return [
        `${date(i.productionDate)} · ${i.shift}º turno · ${i.moment} · ${s?.line ?? ''} / ${s?.code ?? i.stationId}\nID: ${i.id}\nInspetor: ${i.inspector} · Operador: ${i.operator}\nColeta: ${new Date(i.measuredAt).toLocaleString('pt-BR')} · Lançamento: ${new Date(i.recordedAt).toLocaleString('pt-BR')}\nLimites nesta coleta: resistência ≤ ${number(i.limits.resistance)} Ω; tensão ≤ ${number(i.limits.voltage)} mV; temperatura ${number(i.limits.min)} a ${number(i.limits.max)} °C.\nEnvio: ${state[status]}${error ? ` · ${error}` : ''}\nObservação: ${i.notes || '—'}\nAção: ${i.action || '—'}`,
      ];
    }),
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      'I.T: início · A.R: após refeição · F.T: final | Identificação declarada. Pendências e conflitos incluídos.',
      14,
      199,
    );
    doc.text(
      `Dados disponíveis neste aparelho · Emitido em ${now.toLocaleString('pt-BR')} · Página ${page}/${pages}`,
      14,
      204,
    );
  }
  return doc;
}
