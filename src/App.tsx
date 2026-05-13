import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HostList, {
  type Host,
  DEFAULT_HOSTS,
  loadHostsFromLocalStorage,
  saveHostsToLocalStorage,
} from "@/components/HostList";
import Players from "@/components/Players";
import ChessGame, { type ChessGameRef } from "@/components/ChessGame";
import { ScrollArea } from "./components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Button } from "./components/ui/button";
import { useRef } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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

  function Sidebar() {
    return (
      <ScrollArea className="h-full w-full p-4">
        <div className="pb-2">
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

        <Collapsible className="pb-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 group border-b pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-left">
              Settings
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 pt-4 border-b">
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
            <div className="flex flex-col gap-2 py-2">
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
            <div className="flex flex-col gap-2 py-2 pb-4">
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
          </CollapsibleContent>
        </Collapsible>
        {customHosts.length > 0 && (
          <Collapsible className="pb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-2 group border-b pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-left">
                Debug
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 cursor-pointer"
              >
                <ChevronDown className="h-3 w-3 text-muted-foreground  transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-2 py-4 border-b">
              <Select value={debugHostId} onValueChange={setDebugHostId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select debug host" />
                </SelectTrigger>
                <SelectContent>
                  {customHosts.map((host) => (
                    <SelectItem key={host.id} value={host.id}>
                      {host.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldGroup className="flex items-center gap-2">
                <Field orientation="horizontal">
                  <Checkbox
                    id="board-debug-checkbox"
                    name="board-debug-checkbox"
                    checked={debugGameEnabled}
                    onCheckedChange={(checked) =>
                      setDebugGameEnabled(checked === true)
                    }
                  />
                  <Label htmlFor="board-debug-checkbox">Debug Game</Label>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id="click-debug-checkbox"
                    name="click-debug-checkbox"
                    checked={debugClickEnabled}
                    onCheckedChange={(checked) =>
                      setDebugClickEnabled(checked === true)
                    }
                  />
                  <Label htmlFor="click-debug-checkbox">Debug Click</Label>
                </Field>
                <Button onClick={boardDebug}>Manual Debug</Button>
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>
        )}
        <HostList hosts={hosts} setHosts={handleSetHosts} />
      </ScrollArea>
    );
  }

  return (
    <>
      <div className="flex h-screen">
        <aside className="hidden lg:flex w-64 border-r">
          <Sidebar />
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
                <Sidebar />
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
