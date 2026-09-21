import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_SETTINGS,
  loadNames,
  loadSettings,
  saveNames,
  saveSettings,
  sanitizeDebateSeconds,
  type GameSettings,
} from "@/lib/session";
import { preloadRoleMedia } from "@/lib/preload-media";

const TITLE = "Noms des joueurs — Nightfall Oracle";
const DESC = "Ajoute les joueurs autour de la table avant de distribuer les rôles.";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

type Player = { id: string; name: string };

let seq = 0;
const newId = () => `p${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * Ligne joueur isolée : la saisie reste dans un state local (aucune remontée
 * vers le parent ni localStorage pendant la frappe). On ne commit qu'au blur.
 */
const PlayerRow = memo(function PlayerRow({
  id,
  index,
  initialName,
  placeholder,
  removeLabel,
  onCommit,
  onRemove,
}: {
  id: string;
  index: number;
  initialName: string;
  placeholder: string;
  removeLabel: string;
  onCommit: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [value, setValue] = useState(initialName);

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {index + 1}
      </span>
      <input
        type="text"
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        style={{ touchAction: "manipulation" }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit(id, value)}
        placeholder={placeholder}
        className="w-full rounded-full bg-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="button"
        aria-label={removeLabel}
        onClick={() => onRemove(id)}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
});

function SetupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [players, setPlayers] = useState<Player[]>(() =>
    Array.from({ length: 8 }, () => ({ id: newId(), name: "" })),
  );
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [customTime, setCustomTime] = useState(String(DEFAULT_SETTINGS.debateTimePerPlayer));
  // Valeurs "live" pour le bouton Suivant, sans re-render à chaque frappe.
  const draftRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const saved = loadNames();
    if (saved.length) setPlayers(saved.map((name) => ({ id: newId(), name })));
    const s = loadSettings();
    setSettings(s);
    setCustomTime(String(s.debateTimePerPlayer));
    preloadRoleMedia();
  }, []);

  const commitName = useCallback((id: string, name: string) => {
    draftRef.current[id] = name;
    setPlayers((list) => (list.some((p) => p.id === id && p.name !== name)
      ? list.map((p) => (p.id === id ? { ...p, name } : p))
      : list));
  }, []);

  const removePlayer = useCallback((id: string) => {
    delete draftRef.current[id];
    setPlayers((list) => list.filter((p) => p.id !== id));
  }, []);

  const addPlayer = useCallback(
    () => setPlayers((list) => [...list, { id: newId(), name: "" }]),
    [],
  );

  const handleNext = () => {
    const filled = players.map((p, i) => {
      const raw = (draftRef.current[p.id] ?? p.name).trim();
      return raw || `${t("defaultPlayer")} ${i + 1}`;
    });
    saveNames(filled);
    saveSettings({
      isDebateTimerEnabled: settings.isDebateTimerEnabled,
      debateTimePerPlayer: sanitizeDebateSeconds(
        customTime === "" ? settings.debateTimePerPlayer : customTime,
      ),
    });
    navigate({ to: "/gamemaster" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg box-border overflow-x-hidden overflow-y-auto bg-background px-4 py-4 pb-28">
      <header className="-mx-4 mb-2 flex items-center justify-between gap-3 bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-sm text-muted-foreground"
        >
          {t("back")}
        </button>
      </header>
      <h1 className="neon-text mt-3 mb-6 text-2xl font-black">{t("setupTitle")}</h1>

      <div className="space-y-3">
        {players.map((p, i) => (
          <PlayerRow
            key={p.id}
            id={p.id}
            index={i}
            initialName={p.name}
            placeholder={t("playerNamePlaceholder")}
            removeLabel={t("remove")}
            onCommit={commitName}
            onRemove={removePlayer}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addPlayer}
        className="mt-4 w-full rounded-full border border-dashed border-border py-3 text-sm text-muted-foreground"
      >
        {t("addPlayer")}
      </button>

      <section className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{t("debateTimer")}</h2>
            <p className="text-xs text-muted-foreground">{t("debateTimerDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.isDebateTimerEnabled}
            aria-label={t("debateTimerToggle")}
            onClick={() =>
              setSettings((s) => ({
                ...s,
                isDebateTimerEnabled: !s.isDebateTimerEnabled,
              }))
            }
            className={`relative h-7 w-12 shrink-0 rounded-full ${
              settings.isDebateTimerEnabled ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-foreground ${
                settings.isDebateTimerEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <div hidden={!settings.isDebateTimerEnabled} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[30, 60, 90, 120].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => {
                  setSettings((s) => ({ ...s, debateTimePerPlayer: v }));
                  setCustomTime(String(v));
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  settings.debateTimePerPlayer === v
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {v}s
              </button>
            ))}
            <span className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
              {t("custom")}
            </span>
            <input
              type="number"
              inputMode="numeric"
              autoComplete="off"
              min={5}
              max={600}
              style={{ touchAction: "manipulation" }}
              aria-label={t("custom")}
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              onBlur={() => {
                const safe = sanitizeDebateSeconds(customTime);
                setCustomTime(String(safe));
                setSettings((s) => ({ ...s, debateTimePerPlayer: safe }));
              }}
              className="w-20 rounded-full bg-input px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("perPlayerDebate", { n: settings.debateTimePerPlayer })}
          </p>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 bg-background p-4">
        <button
          type="button"
          disabled={players.length < 4}
          onClick={handleNext}
          className="neon-ring mx-auto block w-full max-w-lg rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
        >
          {t("next")}
        </button>
      </div>
    </main>
  );
}
