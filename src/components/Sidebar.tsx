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
  handleSetHosts: (hosts: Host[]) => void;
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
  handleSetHosts,
}: SidebarProps) {
  return (
    <ScrollArea className="h-full w-full p-4">
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
        <div className="flex flex-col gap-2 pb-2">
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
      <HostList hosts={hosts} setHosts={handleSetHosts} />
    </ScrollArea>
  );
}
