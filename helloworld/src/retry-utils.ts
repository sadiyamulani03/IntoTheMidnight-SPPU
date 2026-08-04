export function isRetryableSubmissionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error && 'cause' in err ? String((err as Error & { cause?: unknown }).cause ?? '') : '';
  const full = `${message}\n${cause}`.toLowerCase();

  return (
    full.includes('submission failed') ||
    full.includes('transaction submission error') ||
    full.includes('disconnected from') ||
    full.includes('normal closure') ||
    full.includes('socket hang up') ||
    full.includes('econnreset') ||
    full.includes('econnrefused')
  );
}
