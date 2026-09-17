import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
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

function SetupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [names, setNames] = useState<string[]>(Array(8).fill(""));
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [customTime, setCustomTime] = useState(String(DEFAULT_SETTINGS.debateTimePerPlayer));

  useEffect(() => {
    const saved = loadNames();
    if (saved.length) setNames(saved);
    const s = loadSettings();
    setSettings(s);
    setCustomTime(String(s.debateTimePerPlayer));
    preloadRoleMedia();
  }, []);

  const updateName = useCallback((i: number, v: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const removePlayer = useCallback((i: number) => {
    setNames((prev) => prev.filter((_, k) => k !== i));
  }, []);

  const addPlayer = useCallback(() => {
    setNames((prev) => [...prev, ""]);
  }, []);

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTime(e.target.value);
  };

  const handleCustomTimeBlur = () => {
    const safe = sanitizeDebateSeconds(customTime);
    setCustomTime(String(safe));
    setSettings((s) => ({ ...s, debateTimePerPlayer: safe }));
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg box-border overflow-x-hidden overflow-y-auto px-4 py-4 pb-32">
      <TopBar
        left={
          <button type="button" onClick={() => navigate({ to: "/" })} className="text-sm text-muted-foreground">
            {t("back")}
          </button>
        }
      />
      <h1 className="neon-text mt-3 mb-6 text-2xl font-black">{t("setupTitle")}</h1>

      <div className="space-y-3">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <input
              type="text"
              value={n}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={t("playerNamePlaceholder")}
              className="w-full rounded-full bg-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary touch-manipulation"
            />
            <button
              type="button"
              aria-label={t("remove")}
              onClick={() => removePlayer(i)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPlayer}
        className="mt-4 w-full rounded-full border border-dashed border-border py-3 text-sm text-muted-foreground"
      >
        {t("addPlayer")}
      </button>

      <section className="surface-card mt-6 space-y-4 rounded-3xl p-4">
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
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              settings.isDebateTimerEnabled ? "neon-ring bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-foreground transition-all ${
                settings.isDebateTimerEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {settings.isDebateTimerEnabled && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSettings((s) => ({ ...s, debateTimePerPlayer: v }));
                    setCustomTime(String(v));
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
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
                min={5}
                max={600}
                aria-label={t("custom")}
                value={customTime}
                onChange={handleCustomTimeChange}
                onBlur={handleCustomTimeBlur}
                className="w-20 rounded-full bg-input px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("perPlayerDebate", { n: settings.debateTimePerPlayer })}
            </p>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 mt-6 bg-background/80 backdrop-blur-md p-2 rounded-full">
        <button
          type="button"
          disabled={names.length < 4}
          onClick={() => {
            const safeSeconds = sanitizeDebateSeconds(customTime);
            const finalSettings: GameSettings = {
              ...settings,
              debateTimePerPlayer: safeSeconds,
            };
            const filled = names.map((n, i) => n.trim() || `${t("defaultPlayer")} ${i + 1}`);
            saveNames(filled);
            saveSettings(finalSettings);
            navigate({ to: "/gamemaster" });
          }}
          className="neon-ring mx-auto block w-full max-w-lg rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
        >
          {t("next")}
        </button>
      </div>
    </main>
  );
}
