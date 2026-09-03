import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createReportPdf } from '../lib/inspection/report-pdf';
import {
  DEFAULT_LIMITS,
  type Inspection,
  type LocalRow,
  type Station,
} from '../lib/inspection/types';
const station: Station = {
  id: 'teste',
  line: 'Linha 2',
  code: 'Soldagem Inlet',
  model: 'LG 24W',
  instrument: '',
  approvedBy: '',
  limits: DEFAULT_LIMITS,
  createdAt: '2026-09-01T00:00:00Z',
};
const rows: LocalRow<Inspection>[] = Array.from({ length: 24 }, (_, n) => ({
  id: `teste-${n}`,
  status: n === 0 ? 'conflict' : n === 1 ? 'pending' : 'synced',
  data: {
    id: `teste-${n}`,
    stationId: 'teste',
    inspector: 'Inspetor de teste – João',
    operator: 'Operador de teste',
    productionDate: `2026-09-0${1 + Math.floor(n / 6)}`,
    measuredAt: `2026-09-0${1 + Math.floor(n / 6)}T${String(10 + (n % 6)).padStart(2, '0')}:00:00Z`,
    recordedAt: '2026-09-05T18:00:00Z',
    shift: n % 2 ? '2' : '1',
    moment: (['IT', 'AR', 'FT'] as const)[n % 3],
    physical: 'OK',
    solder: 'OK',
    resistance: 3,
    voltage: 0.6,
    temperature: 450,
    limits: DEFAULT_LIMITS,
    result: 'OK',
    notes:
      n === 0
        ? 'Teste de observação longa: '.repeat(70)
        : 'Amostra fictícia para validar o PDF.',
    action: 'Nenhuma ação necessária.',
  },
}));
mkdirSync('outputs', { recursive: true });
const doc = createReportPdf(
  rows,
  [{ id: station.id, data: station, status: 'synced' }],
  { start: '2026-09-01', period: 'week', shifts: ['1', '2'], stationId: '' },
  readFileSync('public/fonts/NotoSans-Regular.ttf', { encoding: 'base64' }),
  readFileSync('public/inventus-report-logo.png', { encoding: 'base64' }),
);
writeFileSync(
  'outputs/verificacao-relatorio.pdf',
  Buffer.from(doc.output('arraybuffer')),
);
console.log(
  `PDF de validação: ${doc.getNumberOfPages()} páginas, 24 registros fictícios.`,
);
