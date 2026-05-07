import { useEffect, useState } from "react";

interface EvalResult {
  evalPercent: number;
  evalText: string;
}

let evalWorker: Worker | null = null;

function initEvalWorker(): Worker {
  if (evalWorker) {
    return evalWorker;
  }

  evalWorker = new Worker("/stockfish.js");
  return evalWorker;
}

function cpToPercent(cp: number): number {
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (clamped / 1000) * 45;
}

function formatEvalText(cp: number | null, mate: number | null): string {
  if (mate !== null) {
    return `M${mate}`;
  }
  if (cp === null) return "0.0";
  return (cp / 100).toFixed(1);
}

export function useStockfishEval(
  fen: string,
  isWhiteTurn: boolean,
  depth: number = 15,
): EvalResult {
  const [evalResult, setEvalResult] = useState<EvalResult>({
    evalPercent: 50,
    evalText: "0.0",
  });

  useEffect(() => {
    const worker = initEvalWorker();
    let hasUpdated = false;
    let isActive = true;

    const messageHandler = (e: MessageEvent) => {
      const line = e.data;
      if (typeof line === "string" && line.startsWith("info")) {
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch && scoreMatch.length >= 3) {
          const scoreType: string = scoreMatch[1]!;
          const scoreValueStr: string = scoreMatch[2]!;
          const scoreValue = parseInt(scoreValueStr, 10);

          let cp: number | null = null;
          let mate: number | null = null;
          let evalText: string;

          if (scoreType === "cp") {
            cp = scoreValue;
            evalText = formatEvalText(cp, null);
          } else {
            mate = scoreValue;
            evalText = formatEvalText(null, mate);
          }

          const normalizedCp =
            scoreType === "cp" && cp !== null ? (isWhiteTurn ? cp : -cp) : 0;

          const evalPercent =
            scoreType === "cp" && cp !== null ? cpToPercent(normalizedCp) : 50;

          if (isActive) {
            setEvalResult({
              evalPercent,
              evalText,
            });
          }
          hasUpdated = true;
        }
      }
    };

    worker.addEventListener("message", messageHandler);

    worker.postMessage("ucinewgame");
    worker.postMessage("position fen " + fen);
    worker.postMessage("go depth " + depth);

    return () => {
      isActive = false;
      worker.removeEventListener("message", messageHandler);
      worker.postMessage("stop");
    };
  }, [fen, isWhiteTurn, depth]);

  return evalResult;
}
