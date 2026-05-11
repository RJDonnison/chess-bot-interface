const HOSTS_STORAGE_KEY = "chess-hosts";

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
];

export function loadHostsFromLocalStorage(): Host[] {
  try {
    const raw = localStorage.getItem(HOSTS_STORAGE_KEY);
    if (!raw) return DEFAULT_HOSTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_HOSTS;
    return parsed;
  } catch {
    return DEFAULT_HOSTS;
  }
}

export function saveHostsToLocalStorage(hosts: Host[]) {
  try {
    localStorage.setItem(HOSTS_STORAGE_KEY, JSON.stringify(hosts));
  } catch {}
}

type Props = {
  hosts: Host[];
  setHosts: (hosts: Host[]) => void;
};

function HostList({ hosts, setHosts }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
        Bots
      </p>

      {hosts.map((host) => (
        <div
          key={host.id}
          className={`flex items-center justify-between px-2 py-1.5 rounded-md ${!host.isDefault ? "hover:bg-muted/50 group" : ""}`}
        >
          <span className="text-sm text-left truncate flex-1">{host.name}</span>
        </div>
      ))}
    </div>
  );
}

export default HostList;
