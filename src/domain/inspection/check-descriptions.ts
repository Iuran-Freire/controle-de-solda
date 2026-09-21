// Transcrição da PRIMEIRA tabela do formulário enviado pelo usuário.
// Texto do documento é separado dos limites configurados de cada posto.
import type { Station } from './types';

export type CheckDescriptions = {
  physical: string;
  solder: string;
  resistance: string;
  voltage: string;
  temperature: string;
};

export const CHECK_DESCRIPTIONS: CheckDescriptions = {
  physical:
    'Verificação das condições do equipamento; Cabo; Ponta do ferro de solda',
  solder: 'Verificação da validade do fio de solda',
  resistance:
    'Teste de resistencia entre ferro de solda e terra. Valor: ≤ 10 Ω',
  voltage:
    'Teste de tensão residual entre ferro de solda e terra.Valor: ≤ 20 mV',
  temperature:
    'Verificação de Temperatura Ferro de solda: Especificação: 420°C - 480°C',
};

export function stationCheckDescriptions(station?: Station): CheckDescriptions {
  return station?.checks ?? CHECK_DESCRIPTIONS;
}
