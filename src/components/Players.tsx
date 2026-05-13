import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Host } from "./HostList";
import { Dot } from "lucide-react";
import { SidebarSection } from "./SidebarSection";

type Props = {
  hosts: Host[];
  player1HostId: string;
  player2HostId: string;
  onPlayer1Change: (id: string) => void;
  onPlayer2Change: (id: string) => void;
  player1Color?: "White" | "Black" | null;
  player2Color?: "White" | "Black" | null;
};

export default function Players({
  hosts,
  player1HostId,
  player2HostId,
  onPlayer1Change,
  onPlayer2Change,
  player1Color,
  player2Color,
}: Props) {
  return (
    <SidebarSection title="Players">
      <div className="flex flex-col gap-2">
        {(
          [
            {
              label: "Player 1",
              value: player1HostId,
              onChange: onPlayer1Change,
              color: player1Color,
            },
            {
              label: "Player 2",
              value: player2HostId,
              onChange: onPlayer2Change,
              color: player2Color,
            },
          ] as const
        ).map(({ label, value, onChange, color }) => (
          <Field key={label} className="w-full">
            <FieldLabel className="text-xs">
              {label}
              <span className="text-muted-foreground flex items-center">
                <Dot /> {color}
              </span>
            </FieldLabel>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select host" />
              </SelectTrigger>
              <SelectContent position="popper">
                {hosts.map((host) => (
                  <SelectItem key={host.id} value={host.id}>
                    {host.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ))}
      </div>
    </SidebarSection>
  );
}
