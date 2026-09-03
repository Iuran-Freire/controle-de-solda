/** Give mounted forms an opportunity to flush their current drafts before reload. */
export async function applyAppUpdate() {
  const pending: Promise<unknown>[] = [];
  window.dispatchEvent(
    new CustomEvent('solda:before-update', {
      detail: {
        waitUntil: (promise: Promise<unknown>) => pending.push(promise),
      },
    }),
  );
  await Promise.all(pending);
  location.reload();
}
