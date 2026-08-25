import { useEffect, useState } from "react";

/**
 * Relógio que avança sozinho, para textos do tipo "há 3 min" não congelarem
 * enquanto a tela fica aberta. Só re-renderiza quem consome — o intervalo
 * padrão (30s) é suficiente para uma leitura em minutos.
 */
export const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
