export function registerPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const host = location.hostname;
  const inIframe = window.self !== window.top;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  const killSwitch = new URLSearchParams(location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || isPreview || killSwitch) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      }
    });
    return;
  }
  const baseUrl = import.meta.env.BASE_URL || "/";
  const swUrl = `${baseUrl}sw.js`;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, { scope: baseUrl }).catch(() => {});
  });
}