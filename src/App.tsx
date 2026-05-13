import { useState } from "react";
import {
  type Host,
  DEFAULT_HOSTS,
  loadHostsFromLocalStorage,
  saveHostsToLocalStorage,
} from "@/components/HostList";
import ChessGame, { type ChessGameRef } from "@/components/ChessGame";
import { ScrollArea } from "./components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { useRef } from "react";
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
  const [hosts, setHosts] = useState<Host[]>(loadHostsFromLocalStorage);
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
  const [debugGameEnabled, setDebugGameEnabled] = useState(false);
  const [debugClickEnabled, setDebugClickEnabled] = useState<boolean>(false);

  const customHosts = hosts.filter((h) => !h.isDefault);
  const [debugHostId, setDebugHostId] = useState<string>(
    customHosts.length > 0 ? customHosts[0]!.id : "",
  );

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
    saveHostsToLocalStorage(updated);
    const updatedCustomHosts = updated.filter((h) => !h.isDefault);
    if (updatedCustomHosts.length > 0) {
      setDebugHostId(updatedCustomHosts[0]!.id);
    }
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
    handleSetHosts,
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
