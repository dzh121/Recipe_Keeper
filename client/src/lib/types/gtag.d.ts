export {};

declare global {
  interface Window {
    gtag: (...args: [command: 'config' | 'event' | 'js', ...params: unknown[]]) => void;
  }
}
