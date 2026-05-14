import { useState } from "react";
import { Chess } from "chess.js";
import { type Host, DEFAULT_HOSTS } from "./components/HostList";
import ChessGame, { type ChessGameRef } from "@/components/ChessGame";
import { ScrollArea } from "./components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "./components/Sidebar";

// URL query helpers
function getQueryParam(param: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function setQueryParam(param: string, value: string | number) {
  const params = new URLSearchParams(window.location.search);
  params.set(param, String(value));
  window.history.replaceState({}, "", `?${params.toString()}`);
}

// Player config localStorage helpers
const PLAYER_CONFIG_KEY = "chess-player-config";

type PlayerConfig = {
  player1HostId: string;
  player2HostId: string;
  player1Color: "White" | "Black";
  player2Color: "White" | "Black";
};

function loadPlayerConfigFromLocalStorage(): PlayerConfig | null {
  try {
    const raw = localStorage.getItem(PLAYER_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.player1HostId !== "string" ||
      typeof parsed.player2HostId !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePlayerConfigToLocalStorage(config: PlayerConfig) {
  try {
    localStorage.setItem(PLAYER_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

type BatchStats = {
  p1Wins: number;
  p2Wins: number;
  draws: number;
  gamesPlayed: number;
};

const BATCH_STATS_KEY = "chess-batch-stats";

function loadBatchStatsFromLocalStorage(): BatchStats | null {
  try {
    const raw = localStorage.getItem(BATCH_STATS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.p1Wins !== "number" ||
      typeof parsed.p2Wins !== "number" ||
      typeof parsed.draws !== "number" ||
      typeof parsed.gamesPlayed !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveBatchStatsToLocalStorage(stats: BatchStats) {
  try {
    localStorage.setItem(BATCH_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export default function App() {
  const timeoutQuery = getQueryParam("timeout");
  const depthQuery = getQueryParam("depth");
  const botDelayQuery = getQueryParam("botDelay");
  const batchTotalQuery = getQueryParam("batchTotal");

  const savedPlayerConfig = loadPlayerConfigFromLocalStorage();

  const [timeout, setTimeoutState] = useState<number>(
    timeoutQuery ? parseInt(timeoutQuery) : 30,
  );
  const [stockfishDepth, setDepthState] = useState<number>(
    depthQuery ? parseInt(depthQuery) : 12,
  );
  const [botDelay, setBotDelayState] = useState<number>(
    botDelayQuery ? parseFloat(botDelayQuery) : 0,
  );
  const hosts = DEFAULT_HOSTS;
  const [player1HostId, setPlayer1HostIdState] = useState<string>(
    savedPlayerConfig?.player1HostId || DEFAULT_HOSTS[0]!.id,
  );
  const [player2HostId, setPlayer2HostIdState] = useState<string>(
    savedPlayerConfig?.player2HostId ||
      DEFAULT_HOSTS[DEFAULT_HOSTS.length - 1]!.id,
  );
  const [player1Color, setPlayer1Color] = useState<"White" | "Black">(
    savedPlayerConfig?.player1Color || "White",
  );
  const [player2Color, setPlayer2Color] = useState<"White" | "Black">(
    savedPlayerConfig?.player2Color || "Black",
  );
  const [debugGameEnabled, setDebugGameEnabled] = useState(false);
  const [debugClickEnabled, setDebugClickEnabled] = useState<boolean>(false);

  const customHosts = hosts.filter((h) => !h.isDefault);
  const [debugHostId, setDebugHostId] = useState<string>(
    customHosts.length > 0 ? customHosts[0]!.id : "",
  );

  const [batchTotalGames, setBatchTotalGamesState] = useState<number>(
    batchTotalQuery ? parseInt(batchTotalQuery) : 10,
  );
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStats, setBatchStats] = useState<BatchStats>(
    loadBatchStatsFromLocalStorage() || {
      p1Wins: 0,
      p2Wins: 0,
      draws: 0,
      gamesPlayed: 0,
    },
  );

  const lastBotConfigRef = useRef({
    player1HostId,
    player2HostId,
  });

  const chessGameRef = useRef<ChessGameRef>(null);

  const boardDebug = () => {
    chessGameRef.current?.manualDebug();
  };

  const setTimeout = (value: number) => {
    setTimeoutState(value);
    setQueryParam("timeout", value);
  };

  const setStockfishDepth = (value: number) => {
    const validDepth = Math.max(1, value);
    setDepthState(validDepth);
    setQueryParam("depth", validDepth);
  };

  const setBotDelay = (value: number) => {
    setBotDelayState(value);
    setQueryParam("botDelay", value);
  };

  const setBatchTotalGames = (value: number) => {
    setBatchTotalGamesState(value);
    setQueryParam("batchTotal", value);
  };

  const setPlayer1HostId = (id: string) => {
    setPlayer1HostIdState(id);
    savePlayerConfigToLocalStorage({
      player1HostId: id,
      player2HostId,
      player1Color,
      player2Color,
    });
  };

  const setPlayer2HostId = (id: string) => {
    setPlayer2HostIdState(id);
    savePlayerConfigToLocalStorage({
      player1HostId,
      player2HostId: id,
      player1Color,
      player2Color,
    });
  };

  function handleColorsAssigned(
    player1: "White" | "Black",
    player2: "White" | "Black",
  ) {
    setPlayer1Color(player1);
    setPlayer2Color(player2);
    savePlayerConfigToLocalStorage({
      player1HostId,
      player2HostId,
      player1Color: player1,
      player2Color: player2,
    });
  }

  function handleGameOver(result: "White" | "Black" | "Draw") {
    const newStats = { ...batchStats };
    if (result === player1Color) {
      newStats.p1Wins++;
    } else if (result === player2Color) {
      newStats.p2Wins++;
    } else {
      newStats.draws++;
    }
    newStats.gamesPlayed++;
    setBatchStats(newStats);
    saveBatchStatsToLocalStorage(newStats);

    if (newStats.gamesPlayed < batchTotalGames) {
      const alternatedColor = player1Color === "White" ? "Black" : "White";
      window.setTimeout(() => {
        chessGameRef.current?.newGame(alternatedColor);
      }, 0);
    } else {
      setBatchRunning(false);
    }
  }

  function startBatch() {
    setBatchStats({
      p1Wins: 0,
      p2Wins: 0,
      draws: 0,
      gamesPlayed: 0,
    });
    setBatchRunning(true);
    window.setTimeout(() => {
      chessGameRef.current?.newGame(player1Color);
    }, 0);
  }

  function resumeBatch() {
    setBatchRunning(true);
    window.setTimeout(() => {
      const localGame = localStorage.getItem("chess-local-game");
      if (localGame) {
        try {
          const parsed = JSON.parse(localGame);
          const chess = new Chess(parsed.fen);
          if (chess.isGameOver()) {
            const alternatedColor =
              player1Color === "White" ? "Black" : "White";
            chessGameRef.current?.newGame(alternatedColor);
          }
        } catch {}
      }
    }, 0);
  }

  useEffect(() => {
    if (
      batchRunning &&
      (player1HostId !== lastBotConfigRef.current.player1HostId ||
        player2HostId !== lastBotConfigRef.current.player2HostId)
    ) {
      setBatchRunning(false);
    }
    lastBotConfigRef.current = {
      player1HostId,
      player2HostId,
    };
  }, [player1HostId, player2HostId, batchRunning]);

  const sidebarProps = {
    hosts,
    player1HostId,
    player2HostId,
    setPlayer1HostId,
    setPlayer2HostId,
    player1Color,
    player2Color,
    timeout,
    setTimeout,
    stockfishDepth,
    setStockfishDepth,
    botDelay,
    setBotDelay,
    customHosts,
    debugHostId,
    setDebugHostId,
    debugGameEnabled,
    setDebugGameEnabled,
    debugClickEnabled,
    setDebugClickEnabled,
    boardDebug,
    batchTotalGames,
    setBatchTotalGames,
    batchRunning,
    setBatchRunning,
    batchStats,
    startBatch,
    resumeBatch,
  };

  return (
    <>
      <div className="flex h-screen">
        <aside className="hidden lg:flex w-64 border-r">
          <Sidebar {...sidebarProps} />
        </aside>

        <div className="block lg:hidden">
          <Sheet modal={false}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-2 top-2 z-50 lg:hidden"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ScrollArea className="h-full p-4">
                <Sidebar {...sidebarProps} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 min-w-0">
          <ChessGame
            ref={chessGameRef}
            onColorsAssigned={handleColorsAssigned}
            onGameOver={batchRunning ? handleGameOver : undefined}
            isBatchMode={batchRunning}
            humanColor={
              player1HostId === "human" && player2HostId === "human"
                ? "White"
                : player1HostId === "human"
                  ? player1Color || undefined
                  : player2HostId === "human"
                    ? player2Color || undefined
                    : undefined
            }
            player1HostId={player1HostId}
            player2HostId={player2HostId}
            player1Color={player1Color}
            player2Color={player2Color}
            hosts={hosts}
            timeout={timeout}
            stockfishDepth={stockfishDepth}
            botDelay={botDelay}
            debugGameEnabled={debugGameEnabled}
            debugClickEnabled={debugClickEnabled}
            debugHost={hosts.find((h) => h.id === debugHostId)}
          />
        </main>
      </div>
    </>
  );
}
