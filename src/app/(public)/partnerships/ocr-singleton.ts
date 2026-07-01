/**
 * ocr-singleton.ts
 *
 * Module-level Tesseract worker singleton.
 * Call `warmOcrWorker()` early (on page load) so the worker is ready
 * by the time the user opens the scanner.
 *
 * Subsequent calls to `getOcrWorker()` return the same cached promise —
 * zero extra cost.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _promise: Promise<any> | null = null;

export function warmOcrWorker(): void {
  if (_promise) return; // already warming
  _promise = import("tesseract.js").then(({ createWorker }) =>
    createWorker("eng", 1, { logger: () => {} })
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOcrWorker(): Promise<any> {
  if (!_promise) warmOcrWorker();
  return _promise!;
}
