'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type Item = { id: number; message: string };
const Ctx = createContext<((m: string) => void) | null>(null);

export function useToast() {
  const f = useContext(Ctx);
  return f ?? (() => {});
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Item[]>([]);
  const n = useRef(0);
  const add = useCallback((message: string) => {
    const id = ++n.current;
    setList((prev) => [...prev, { id, message }]);
    setTimeout(() => setList((prev) => prev.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <Ctx.Provider value={add}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className="rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 text-sm text-slate-100 shadow-lg">
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
