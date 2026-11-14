export type ToastTone = "default" | "success" | "error";

export function toast(message: string, tone: ToastTone = "default") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("orange-isle:toast", {
      detail: {
        message,
        tone,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    }),
  );
}
