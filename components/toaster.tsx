"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CloseIcon, SparkIcon } from "./icons";
import type { ToastTone } from "@/lib/toast";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timersMap = timers.current;
    function dismiss(id: string) {
      setItems((current) => current.filter((item) => item.id !== id));
      const timer = timersMap.get(id);
      if (timer) clearTimeout(timer);
      timersMap.delete(id);
    }

    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastItem>).detail;
      if (!detail?.message) return;
      setItems((current) => [...current.slice(-2), detail]);
      const timer = setTimeout(() => dismiss(detail.id), 3600);
      timersMap.set(detail.id, timer);
    }

    window.addEventListener("orange-isle:toast", onToast);
    return () => {
      window.removeEventListener("orange-isle:toast", onToast);
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.tone}`}>
          <span className="toast__icon" aria-hidden="true">
            {item.tone === "success" ? (
              <CheckIcon size={16} />
            ) : item.tone === "error" ? (
              <CloseIcon size={16} />
            ) : (
              <SparkIcon size={16} />
            )}
          </span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
