// Simple global counter + pub/sub
let count = 0;
const listeners = new Set();

function notify() {
  const isLoading = count > 0;
  listeners.forEach((fn) => fn(isLoading, count));
}
export const loading = {
  start() {
    count += 1;
    notify();
  },
  stop() {
    count = Math.max(0, count - 1);
    notify();
  },
  reset() {
    count = 0;
    notify();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get isLoading() {
    return count > 0;
  },
};
