import { jsPDF } from 'jspdf';
import { reportEnd, reportRows, type ReportFilter } from './report';
import { chartNumber, measurementTicks } from './chart-scale';
import { imr, type Inspection, type LocalRow, type Station } from './types';
const date = (v: string) => v.split('-').reverse().join('/');
const metrics = [
  { key: 'resistance', title: 'Resistência', unit: 'Ω' },
  { key: 'voltage', title: 'Tensão residual', unit: 'mV' },
  { key: 'temperature', title: 'Temperatura', unit: '°C' },
] as const;
function chart(
  doc: jsPDF,
  x: number,
  y: number,
  title: string,
  unit: string,
  values: (number | null)[],
  records: Inspection[],
  note: string,
  ranges?: number[][],
) {
  doc.setDrawColor(222);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, 129, 70, 2, 2);
  doc.setTextColor(64, 64, 66);
  doc.setFontSize(11);
  doc.text(`${title} (${unit})`, x + 5, y + 7);
  const ticks = measurementTicks(values.filter((v): v is number => v !== null)),
    min = ticks[0],
    max = ticks[ticks.length - 1];
  const left = x + 16,
    top = y + 15,
    w = 105,
    h = 32,
    py = (v: number) => top + h - ((v - min) / (max - min)) * h,
    px = (i: number) =>
      left + (values.length === 1 ? w / 2 : (i * w) / (values.length - 1));
  doc.setFontSize(7);
  ticks.forEach((t) => {
    doc.setDrawColor(235);
    doc.line(left, py(t), left + w, py(t));
    doc.setTextColor(100);
    doc.text(chartNumber(t), left - 2, py(t) + 1, { align: 'right' });
  });
  ranges?.forEach((range) => {
    doc.setDrawColor(196, 94, 80);
    doc.setLineDashPattern([1, 1], 0);
    for (let i = 0; i < range.length - 1; i++) {
      if (range[i] >= min && range[i] <= max)
        doc.line(px(i), py(range[i]), px(i + 1), py(range[i]));
      const a = Math.max(min, Math.min(max, range[i])),
        b = Math.max(min, Math.min(max, range[i + 1]));
      if (a !== b) doc.line(px(i + 1), py(a), px(i + 1), py(b));
    }
    doc.setLineDashPattern([], 0);
  });
  values.forEach((v, i) => {
    doc.setTextColor(90);
    doc.setFontSize(6.5);
    doc.text(
      [
        records[i].productionDate.slice(8) +
          '/' +
          records[i].productionDate.slice(5, 7),
        `${records[i].shift}º ${records[i].moment}`,
      ],
      px(i),
      top + h + 4,
      { align: 'center' },
    );
    if (v === null) return;
    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(0.6);
    const previous = values[i - 1];
    if (i > 0 && previous !== null)
      doc.line(px(i - 1), py(previous), px(i), py(v));
    doc.setFillColor(255, 255, 255);
    doc.circle(px(i), py(v), 0.9, 'FD');
    doc.setTextColor(64, 64, 66);
    doc.setFontSize(7.5);
    doc.text(chartNumber(v), px(i), py(v) - 2, { align: 'center' });
  });
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(doc.splitTextToSize(note, 119), x + 5, y + 61);
}
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
    throw new Error(
      'Não há medições sem conflito para gerar os gráficos neste período.',
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
      ranges = metrics.map((m) => imr(records, m.key).points.map((p) => p.mr));
    for (let offset = 0; offset < records.length; offset += 8) {
      const chunk = records.slice(offset, offset + 8);
      for (const amplitude of [false, true]) {
        if (!first) doc.addPage();
        first = false;
        doc.setFont('NotoSans', 'normal');
        doc.setTextColor(64, 64, 66);
        doc.addImage(logo, 'PNG', 14, 8, 44, 11);
        doc.setFontSize(13);
        doc.text(
          amplitude ? 'Amplitude móvel por medição' : 'Gráficos das medições',
          64,
          14,
        );
        doc.setFontSize(8);
        doc.text(
          `${date(filter.start)} a ${date(reportEnd(filter))} · Turnos: ${filter.shifts.join(', ')} · Coletas ${offset + 1}–${offset + chunk.length} de ${records.length}`,
          64,
          20,
        );
        doc.setDrawColor(249, 155, 28);
        doc.line(14, 25, 283, 25);
        doc.setFontSize(9);
        doc.text(
          doc.splitTextToSize(
            station
              ? `${station.line} · ${station.code} · ${station.model}`
              : stationId,
            269,
          )[0],
          14,
          32,
        );
        metrics.forEach((m, index) => {
          const x = index % 2 === 0 ? 14 : 154,
            y = index < 2 ? 38 : 113;
          const limits =
            m.key === 'temperature'
              ? [chunk.map((i) => i.limits.min), chunk.map((i) => i.limits.max)]
              : [chunk.map((i) => i.limits[m.key])];
          const note = amplitude
            ? 'Amplitude = |atual - anterior|. Primeira coleta do período: sem amplitude.'
            : `Limites: ${limits.map((l, j) => `${m.key === 'temperature' && j === 0 ? 'mín.' : 'máx.'} ${[...new Set(l)].map(chartNumber).join(' / ')}`).join(' · ')} ${m.unit}. Vermelho: limite dentro da escala.`;
          chart(
            doc,
            x,
            y,
            m.title,
            m.unit,
            amplitude
              ? ranges[index].slice(offset, offset + 8)
              : chunk.map((i) => i[m.key]),
            chunk,
            note,
            amplitude ? undefined : limits,
          );
        });
        doc.setFontSize(10);
        doc.setTextColor(64, 64, 66);
        doc.text('Sobre estes gráficos', 159, 121);
        doc.setFontSize(9);
        const conflicts = selected.filter(
            (r) => r.data.stationId === stationId && r.status === 'conflict',
          ).length,
          pending = stationRows.filter((r) => r.status === 'pending').length;
        const info = [
          `${stationRows.length} medições do posto no período.`,
          `${pending} pendente(s) de envio incluída(s).`,
          `${conflicts} registro(s) em conflito excluído(s).`,
          'Escala ajustada aos valores de cada gráfico.',
          amplitude
            ? 'Comparação consecutiva do mesmo item e posto, dentro do período e turnos selecionados. A sequência continua entre páginas.'
            : 'Cada ponto representa uma coleta. Limites históricos informados em cada gráfico; podem ficar fora da escala.',
          'I.T: início · A.R: após refeição · F.T: final',
        ];
        let y = 129;
        info.forEach((line) => {
          const lines = doc.splitTextToSize(line, 119);
          doc.text(lines, 159, y);
          y += lines.length * 4 + 2;
        });
      }
    }
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      `Dados disponíveis neste aparelho · Emitido em ${now.toLocaleString('pt-BR')} · Página ${page}/${pages}`,
      14,
      201,
    );
  }
  return doc;
}
