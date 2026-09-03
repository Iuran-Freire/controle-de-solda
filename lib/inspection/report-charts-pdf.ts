import { jsPDF } from 'jspdf';

import { chartNumber, measurementTicks } from './chart-scale';
import type { Inspection } from './types';
export function chart(
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
    if (i % Math.ceil(values.length / 5) === 0)
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
    if (values.length <= 8)
      doc.text(chartNumber(v), px(i), py(v) - 2, { align: 'center' });
  });
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(doc.splitTextToSize(note, 119), x + 5, y + 61);
}
