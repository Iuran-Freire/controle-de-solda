export function inProductionMonth(productionDate: string, month: string) {
  return (
    !month ||
    (/^\d{4}-\d{2}$/.test(month) && productionDate.startsWith(`${month}-`))
  );
}
