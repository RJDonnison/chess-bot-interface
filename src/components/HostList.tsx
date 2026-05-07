import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, X, Check, Pencil, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editErrors, setEditErrors] = useState<{ name?: string; url?: string }>(
    {},
  );
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addErrors, setAddErrors] = useState<{ name?: string; url?: string }>(
    {},
  );

  function startEdit(host: Host) {
    setEditingId(host.id);
    setEditName(host.name);
    setEditUrl(host.url);
    setEditErrors({});
  }

  function saveEdit() {
    if (!editingId) return;
    const errors: { name?: string; url?: string } = {};
    if (!editName.trim()) errors.name = "Name is required";
    if (!editUrl.trim()) errors.url = "URL is required";
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    const updated = hosts.map((h) =>
      h.id === editingId
        ? { ...h, name: editName.trim(), url: editUrl.trim() }
        : h,
    );
    setHosts(updated);
    saveHostsToLocalStorage(updated);
    setEditingId(null);
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditErrors({});
  }

  function deleteHost(id: string) {
    const updated = hosts.filter((h) => h.id !== id);
    setHosts(updated);
    saveHostsToLocalStorage(updated);
  }

  function addHost() {
    const errors: { name?: string; url?: string } = {};
    if (!newName.trim()) errors.name = "Name is required";
    if (!newUrl.trim()) errors.url = "URL is required";
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    const newHost: Host = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      url: newUrl.trim(),
      isDefault: false,
    };
    const updated = [...hosts, newHost];
    setHosts(updated);
    saveHostsToLocalStorage(updated);
    setNewName("");
    setNewUrl("");
    setAddingNew(false);
    setAddErrors({});
  }

  function cancelAdd() {
    setNewName("");
    setNewUrl("");
    setAddingNew(false);
    setAddErrors({});
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
        Hosts
      </p>

      {hosts.map((host) =>
        editingId === host.id ? (
          <div
            key={host.id}
            className="flex flex-col gap-1 p-2 rounded-md border bg-muted/30"
          >
            <div className="flex flex-col gap-0.5">
              <Input
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editErrors.name)
                    setEditErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="Name"
                className={`h-7 text-sm ${editErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoFocus
              />
              {editErrors.name && (
                <p className="text-xs text-destructive px-0.5">
                  {editErrors.name}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <Input
                value={editUrl}
                onChange={(e) => {
                  setEditUrl(e.target.value);
                  if (editErrors.url)
                    setEditErrors((p) => ({ ...p, url: undefined }));
                }}
                placeholder="URL"
                className={`h-7 text-sm ${editErrors.url ? "border-destructive focus-visible:ring-destructive" : ""}`}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              />
              {editErrors.url && (
                <p className="text-xs text-destructive px-0.5">
                  {editErrors.url}
                </p>
              )}
            </div>
            <div className="flex gap-1 mt-1">
              <Button
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={saveEdit}
              >
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 flex-1 text-xs"
                onClick={cancelEdit}
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={host.id}
            className={`flex items-center justify-between px-2 py-1.5 rounded-md ${!host.isDefault ? "hover:bg-muted/50 group" : ""}`}
          >
            <span className="text-sm text-left truncate flex-1">
              {host.name}
            </span>
            {!host.isDefault && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 cursor-pointer"
                  onClick={() => startEdit(host)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive cursor-pointer"
                  onClick={() => deleteHost(host.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ),
      )}

      {addingNew ? (
        <div className="flex flex-col gap-1 p-2 rounded-md border bg-muted/30 mt-1">
          <div className="flex flex-col gap-0.5">
            <Input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (addErrors.name)
                  setAddErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Name"
              className={`h-7 text-sm ${addErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
              autoFocus
            />
            {addErrors.name && (
              <p className="text-xs text-destructive px-0.5">
                {addErrors.name}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <Input
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (addErrors.url)
                  setAddErrors((p) => ({ ...p, url: undefined }));
              }}
              placeholder="URL"
              className={`h-7 text-sm ${addErrors.url ? "border-destructive focus-visible:ring-destructive" : ""}`}
              onKeyDown={(e) => e.key === "Enter" && addHost()}
            />
            {addErrors.url && (
              <p className="text-xs text-destructive px-0.5">{addErrors.url}</p>
            )}
          </div>
          <div className="flex gap-1 mt-1">
            <Button size="sm" className="h-7 flex-1 text-xs" onClick={addHost}>
              <Check className="w-3 h-3 mr-1" /> Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-xs"
              onClick={cancelAdd}
            >
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2 py-1.5 rounded-md text-sm text-left truncate flex-1 text-muted-foreground"
          onClick={() => setAddingNew(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Host
        </Button>
      )}
    </div>
  );
}

export default HostList;
