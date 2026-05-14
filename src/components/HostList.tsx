import { SidebarSection } from "./SidebarSection";

export type Host = {
  id: string;
  name: string;
  url: string;
  isDefault?: boolean;
};

export const DEFAULT_HOSTS: Host[] = [
  { id: "human", name: "Human", url: "", isDefault: true },
  { id: "stockfish", name: "Stockfish", url: "", isDefault: true },
  {
    id: "v1",
    name: "Random Moves",
    url: "https://chess.reujdon.dev/api/v1",
    isDefault: true,
  },
  {
    id: "v2",
    name: "Basic Search",
    url: "https://chess.reujdon.dev/api/v2",
    isDefault: true,
  },
];

type Props = {
  hosts: Host[];
};

function HostList({ hosts }: Props) {
  return (
    <SidebarSection title="Bots">
      {hosts.map((host) => (
        <div
          key={host.id}
          className={`flex items-center justify-between px-2 py-1.5 rounded-md ${!host.isDefault ? "hover:bg-muted/50 group" : ""}`}
        >
          <span className="text-sm text-left truncate flex-1">{host.name}</span>
        </div>
      ))}
    </SidebarSection>
  );
}

export default HostList;
