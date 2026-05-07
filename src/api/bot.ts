import { type Host } from "../components/HostList";

let stockfishWorker: Worker | null = null;

function initStockfishWorker(): Worker {
  if (stockfishWorker) {
    return stockfishWorker;
  }

  stockfishWorker = new Worker("/stockfish.js");
  return stockfishWorker;
}

function getLocalStockfishMove(
  fen: string,
  timeoutSeconds: number,
  depth: number = 1,
): Promise<string | null> {
  return new Promise((resolve) => {
    const worker = initStockfishWorker();
    let hasResolved = false;

    const messageHandler = (e: MessageEvent) => {
      const line = e.data;
      if (typeof line === "string" && line.startsWith("bestmove ")) {
        const move = line.split(" ")[1];
        worker.removeEventListener("message", messageHandler);
        if (!hasResolved) {
          hasResolved = true;
          resolve(move || null);
        }
      }
    };

    worker.addEventListener("message", messageHandler);

    worker.postMessage("position fen " + fen);
    worker.postMessage("go depth " + depth);

    const timeoutHandle = setTimeout(() => {
      worker.removeEventListener("message", messageHandler);
      if (!hasResolved) {
        hasResolved = true;
        resolve(null);
      }
    }, timeoutSeconds * 1000);
  });
}

async function getExternalBotMove(
  fen: string,
  host: Host,
  timeoutSeconds: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    timeoutSeconds * 1000,
  );

  try {
    const url = new URL(`${host.url}/bestmove`);
    url.searchParams.append("fen", fen);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`Bot API error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.bestmove || null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("External bot request timed out");
      return null;
    }
    console.error("Error calling external bot API:", error);
    return null;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function getBotMove(
  fen: string,
  host: Host,
  timeoutSeconds: number,
  depth: number = 12,
): Promise<string | null> {
  if (host.id === "stockfish") {
    return await getLocalStockfishMove(fen, timeoutSeconds, depth);
  }

  return await getExternalBotMove(fen, host, timeoutSeconds);
}
