import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { chart } from './report-charts-pdf';
import { chartNumber } from './chart-scale';
import { reportEnd, reportRows, type ReportFilter } from './report';
import { shiftComparisons } from './shift-comparison';
import type { Inspection, LocalRow, Station } from './types';
const date = (value: string) => value.split('-').reverse().join('/');
const metrics = [
  { key: 'resistance', title: 'Resistência', unit: 'Ω' },
  { key: 'voltage', title: 'Tensão residual', unit: 'mV' },
  { key: 'temperature', title: 'Temperatura', unit: '°C' },
] as const;
export function createReportPdf(
  rows: LocalRow<Inspection>[],
  stations: LocalRow<Station>[],
  filter: ReportFilter,
  font: string,
  logo: string,
  now = new Date(),
) {
  const selected = reportRows(rows, filter),
    valid = selected.filter((r) => r.status !== 'conflict');
  if (!valid.length)
    throw new Error('Não há medições sem conflito neste período.');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });
  doc.addFileToVFS('NotoSans.ttf', font);
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
  doc.setFont('NotoSans', 'normal');
  let first = true;
  for (const stationId of [...new Set(valid.map((r) => r.data.stationId))]) {
    const station = stations.find((s) => s.id === stationId)?.data;
    const stationRows = valid
      .filter((r) => r.data.stationId === stationId)
      .sort(
        (a, b) =>
          a.data.measuredAt.localeCompare(b.data.measuredAt) ||
          a.id.localeCompare(b.id),
      );
    const records = stationRows.map((r) => r.data),
      groups = shiftComparisons(stationRows, stationId);
    const stationLabel = station
      ? `${station.line} · ${station.code} · ${station.model}`
      : stationId;
    for (const metric of metrics) {
      if (!first) doc.addPage();
      first = false;
      const heading = () => {
        doc.setFont('NotoSans', 'normal');
        doc.setTextColor(64, 64, 66);
        doc.addImage(logo, 'PNG', 14, 8, 44, 11);
        doc.setFontSize(13);
        doc.text(`${metric.title} · Resultados e gráfico`, 64, 14);
        doc.setFontSize(8);
        doc.text(
          `${date(filter.start)} a ${date(reportEnd(filter))} · Turnos: ${filter.shifts.join(', ')}`,
          64,
          20,
        );
        doc.setDrawColor(249, 155, 28);
        doc.setLineWidth(0.3);
        doc.line(14, 25, 283, 25);
        doc.setFontSize(9);
        doc.text(doc.splitTextToSize(stationLabel, 269)[0], 14, 32);
      };
      const limits =
        metric.key === 'temperature'
          ? [records.map((i) => i.limits.min), records.map((i) => i.limits.max)]
          : [records.map((i) => i.limits[metric.key])];
      chart(
        doc,
        14,
        38,
        metric.title,
        metric.unit,
        records.map((i) => i[metric.key]),
        records,
        'Escala ajustada às medições. Vermelho: limite dentro da escala.',
        limits,
      );
      doc.setFontSize(10);
      doc.setTextColor(64, 64, 66);
      doc.text('Período completo do posto', 154, 46);
      const info = [
        `${records.length} medições · ${stationRows.filter((r) => r.status === 'pending').length} pendente(s).`,
        `${selected.filter((r) => r.data.stationId === stationId && r.status === 'conflict').length} conflito(s) excluído(s).`,
        ...limits.map(
          (l, index) =>
            `${metric.key === 'temperature' && index === 0 ? 'Limite mínimo' : 'Limite máximo'}: ${[...new Set(l)].map(chartNumber).join(' / ')} ${metric.unit}.`,
        ),
        'Os limites são os preservados nas coletas.',
        'I.T: início · A.R: após refeição · F.T: final',
      ];
      let y = 54;
      doc.setFontSize(8);
      info.forEach((line) => {
        const lines = doc.splitTextToSize(line, 125);
        doc.text(lines, 154, y);
        y += lines.length * 4 + 2;
      });
      autoTable(doc, {
        startY: 115,
        margin: { left: 14, right: 14, top: 38, bottom: 20 },
        styles: {
          font: 'NotoSans',
          fontStyle: 'normal',
          fontSize: 8,
          cellPadding: 1.5,
        },
        headStyles: {
          fillColor: [64, 64, 66],
          fontStyle: 'normal',
          textColor: 255,
        },
        alternateRowStyles: { fillColor: [247, 247, 247] },
        rowPageBreak: 'avoid',
        didDrawPage: heading,
        head: [
          [
            'Data de produção',
            'Posto',
            'Turno',
            `I.T (${metric.unit})`,
            `A.R (${metric.unit})`,
            `F.T (${metric.unit})`,
          ],
        ],
        body: groups.map((group) => [
          date(group.date),
          station?.code ?? stationId,
          `${group.shift}º`,
          ...(['IT', 'AR', 'FT'] as const).map((moment) => {
            const list = group.moments[moment];
            if (!list.length) return '—';
            return (
              list
                .map(({ data: i, status }) => {
                  const v = i[metric.key];
                  const nc =
                    metric.key === 'temperature'
                      ? v < i.limits.min || v > i.limits.max
                      : v > i.limits[metric.key];
                  return `${chartNumber(v)}${nc ? ' · NC' : ''}${status === 'pending' ? ' *' : ''}`;
                })
                .join('\n') + (list.length > 1 ? '\nDuplicidade' : '')
            );
          }),
        ]),
        columnStyles: {
          0: { cellWidth: 43 },
          1: { cellWidth: 70 },
          2: { cellWidth: 21 },
          3: { cellWidth: 45 },
          4: { cellWidth: 45 },
          5: { cellWidth: 45 },
        },
      });
    }
  }
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      '— Sem medição · * Pendente de envio · NC: fora dos limites da coleta. Dados disponíveis neste aparelho.',
      14,
      198,
    );
    doc.text(
      `Emitido em ${now.toLocaleString('pt-BR')} · Página ${page}/${total}`,
      14,
      204,
    );
  }
  return doc;
}
