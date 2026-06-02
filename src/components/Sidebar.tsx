import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Players from "@/components/Players";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SidebarSection } from "@/components/SidebarSection";
import HostList, { Host } from "./HostList";
import { toast } from "sonner";

type BatchStats = {
  p1Wins: number;
  p2Wins: number;
  draws: number;
  gamesPlayed: number;
};

type SidebarProps = {
  hosts: Host[];
  player1HostId: string;
  player2HostId: string;
  setPlayer1HostId: (id: string) => void;
  setPlayer2HostId: (id: string) => void;
  player1Color: "White" | "Black";
  player2Color: "White" | "Black";
  timeout: number;
  setTimeout: (value: number) => void;
  stockfishDepth: number;
  setStockfishDepth: (value: number) => void;
  botDelay: number;
  setBotDelay: (value: number) => void;
  customHosts: Host[];
  debugHostId: string;
  setDebugHostId: (id: string) => void;
  debugGameEnabled: boolean;
  setDebugGameEnabled: (value: boolean) => void;
  debugClickEnabled: boolean;
  setDebugClickEnabled: (value: boolean) => void;
  boardDebug: () => void;
  batchTotalGames: number;
  setBatchTotalGames: (value: number) => void;
  batchRunning: boolean;
  setBatchRunning: (value: boolean) => void;
  batchStats: BatchStats;
  startBatch: () => void;
  resumeBatch: () => void;
  showEvalBar: boolean;
  setShowEvalBar: (value: boolean) => void;
  useTimer: boolean;
  setUseTimer: (value: boolean) => void;
  timerMinutes: number;
  setTimerMinutes: (value: number) => void;
  playSounds: boolean;
  setPlaySounds: (value: boolean) => void;
};

export function Sidebar({
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
  showEvalBar,
  setShowEvalBar,
  useTimer,
  setUseTimer,
  timerMinutes,
  setTimerMinutes,
  playSounds,
  setPlaySounds,
}: SidebarProps) {
  const handleStartBatchClick = () => {
    if (player1HostId === "human" || player2HostId === "human") {
      toast.error("2 bots must be selected to run a batch.");
      return;
    }
    startBatch();
  };

  const handleResumeBatchClick = () => {
    if (player1HostId === "human" || player2HostId === "human") {
      toast.error("2 bots must be selected to run a batch.");
      return;
    }
    resumeBatch();
  };

  return (
    <div className="h-full w-full flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <Players
          hosts={hosts}
          player1HostId={player1HostId}
          player2HostId={player2HostId}
          onPlayer1Change={setPlayer1HostId}
          onPlayer2Change={setPlayer2HostId}
          player1Color={player1Color}
          player2Color={player2Color}
        />
        <SidebarSection title="Settings">
          <div className="flex flex-col gap-2 py-2">
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="eval-bar-checkbox"
                  name="eval-bar-checkbox"
                  checked={showEvalBar}
                  onCheckedChange={(checked) =>
                    setShowEvalBar(checked === true)
                  }
                />
                <Label htmlFor="eval-bar-checkbox">Show Evaluation Bar</Label>
              </Field>
            </FieldGroup>
          </div>
          <div className="flex flex-col gap-2 py-2">
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="timer-checkbox"
                  name="timer-checkbox"
                  checked={useTimer}
                  onCheckedChange={(checked) => setUseTimer(checked === true)}
                />
                <Label htmlFor="timer-checkbox">Enable Game Timer</Label>
              </Field>
            </FieldGroup>
            {useTimer && (
              <div className="mt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                  Timer (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="5"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2 pb-4">
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="sounds-checkbox"
                  name="sounds-checkbox"
                  checked={playSounds}
                  onCheckedChange={(checked) => setPlaySounds(checked === true)}
                />
                <Label htmlFor="sounds-checkbox">Play Move Sounds</Label>
              </Field>
            </FieldGroup>
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
              Bot Timeout (seconds)
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
          <div className="flex flex-col gap-2 pt-2">
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
        </SidebarSection>
        {customHosts.length > 0 && (
          <SidebarSection title="Debug">
            <div className="flex flex-col gap-4">
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
              <FieldGroup className="flex items-center gap-4">
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
                <Button onClick={boardDebug} className="cursor-pointer">
                  Manual Debug
                </Button>
              </FieldGroup>
            </div>
          </SidebarSection>
        )}
        <SidebarSection title="Batch Games">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Total Games
              </label>
              <Input
                type="number"
                min={1}
                placeholder="10"
                value={batchTotalGames}
                onChange={(e) => setBatchTotalGames(Number(e.target.value))}
                className="w-full"
                disabled={batchRunning}
              />
            </div>
            {batchRunning ? (
              <Button
                onClick={() => setBatchRunning(false)}
                className="w-full cursor-pointer"
                variant="destructive"
              >
                Stop Batch
              </Button>
            ) : batchStats.gamesPlayed > 0 &&
              batchStats.gamesPlayed < batchTotalGames ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleResumeBatchClick}
                  variant="default"
                  className="cursor-pointer"
                >
                  Resume Batch
                </Button>
                <Button
                  onClick={handleStartBatchClick}
                  variant="secondary"
                  className="cursor-pointer"
                >
                  Reset Batch
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartBatchClick}
                className="w-full cursor-pointer"
                variant="default"
              >
                Start Batch
              </Button>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  {batchStats.gamesPlayed} / {batchTotalGames}
                </span>
              </div>
              <div className="flex h-4 rounded overflow-hidden">
                {batchStats.p1Wins > 0 && (
                  <div
                    className="bg-green-600 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${(batchStats.p1Wins / Math.max(1, batchStats.gamesPlayed)) * 100}%`,
                    }}
                  >
                    {batchStats.p1Wins > 0 ? batchStats.p1Wins : ""}
                  </div>
                )}
                {batchStats.draws > 0 && (
                  <div
                    className="bg-slate-500 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${(batchStats.draws / Math.max(1, batchStats.gamesPlayed)) * 100}%`,
                    }}
                  >
                    {batchStats.draws > 0 ? batchStats.draws : ""}
                  </div>
                )}
                {batchStats.p2Wins > 0 && (
                  <div
                    className="bg-red-600 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${(batchStats.p2Wins / Math.max(1, batchStats.gamesPlayed)) * 100}%`,
                    }}
                  >
                    {batchStats.p2Wins > 0 ? batchStats.p2Wins : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarSection>
      </ScrollArea>
      <div className="flex justify-center py-4">
        <a
          href="https://github.com/RJDonnison/Chess-Bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
}
