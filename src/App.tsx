import { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Input } from "./components/ui/input";
import HostList, { type Host, DEFAULT_HOSTS } from "./components/HostList";
import Players from "./components/Players";
import ChessGame from "./components/ChessGame";

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

export default function App() {
  const timeoutQuery = getQueryParam("timeout");
  const depthQuery = getQueryParam("depth");
  const botDelayQuery = getQueryParam("botDelay");

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
  const [hosts, setHosts] = useState<Host[]>(DEFAULT_HOSTS);
  const [player1HostId, setPlayer1HostIdState] = useState<string>(
    savedPlayerConfig?.player1HostId || DEFAULT_HOSTS[0]!.id,
  );
  const [player2HostId, setPlayer2HostIdState] = useState<string>(
    savedPlayerConfig?.player2HostId || DEFAULT_HOSTS[1]!.id,
  );
  const [player1Color, setPlayer1Color] = useState<"White" | "Black">(
    savedPlayerConfig?.player1Color || "White",
  );
  const [player2Color, setPlayer2Color] = useState<"White" | "Black">(
    savedPlayerConfig?.player2Color || "Black",
  );

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

  function handleSetHosts(updated: Host[]) {
    setHosts(updated);
  }

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

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={15}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
              Timeout (seconds)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="30"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
              Stockfish Depth
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              placeholder="12"
              value={stockfishDepth}
              onChange={(e) => setStockfishDepth(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
              Bot Delay (seconds)
            </label>
            <Input
              type="number"
              min={0}
              step={0.1}
              placeholder="0"
              value={botDelay}
              onChange={(e) => setBotDelay(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="border-t pt-4">
            <Players
              hosts={hosts}
              player1HostId={player1HostId}
              player2HostId={player2HostId}
              onPlayer1Change={setPlayer1HostId}
              onPlayer2Change={setPlayer2HostId}
              player1Color={player1Color}
              player2Color={player2Color}
            />
          </div>

          <div className="border-t pt-4">
            <HostList hosts={hosts} setHosts={handleSetHosts} />
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={75}>
        <ChessGame
          onColorsAssigned={handleColorsAssigned}
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
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
