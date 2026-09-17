import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, memo } from "react";
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

// Memoized player row to prevent full list re-renders on every keypress
const PlayerInputRow = memo(function PlayerInputRow({
  index,
  value,
  placeholder,
  removeLabel,
  onChange,
  onRemove,
}: {
  index: number;
  value: string;
  placeholder: string;
  removeLabel: string;
  onChange: (index: number, val: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {index + 1}
      </span>
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full bg-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary touch-manipulation"
      />
      <button
        type="button"
        aria-label={removeLabel}
        onClick={() => onRemove(index)}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground active:scale-95 touch-manipulation"
      >
        <X className="size-4" />
      </button>
    </div>
  );
});

function SetupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [names, setNames] = useState<string[]>(Array(8).fill(""));
  const [isDebateTimerEnabled, setIsDebateTimerEnabled] = useState(false);
  const [debateSeconds, setDebateSeconds] = useState(60);
  const [customInput, setCustomInput] = useState("60");

  useEffect(() => {
    const saved = loadNames();
    if (saved.length) setNames(saved);
    const s = loadSettings();
    setIsDebateTimerEnabled(s.isDebateTimerEnabled);
    setDebateSeconds(s.debateTimePerPlayer);
    setCustomInput(String(s.debateTimePerPlayer));
  }, []);

  const updateName = useCallback((index: number, value: string) => {
    setNames((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }, []);

  const removePlayer = useCallback((index: number) => {
    setNames((prev) => prev.filter((_, k) => k !== index));
  }, []);

  const addPlayer = useCallback(() => {
    setNames((prev) => [...prev, ""]);
  }, []);

  const handleNext = () => {
    const finalSeconds = sanitizeDebateSeconds(customInput);
    const finalSettings: GameSettings = {
      isDebateTimerEnabled,
      debateTimePerPlayer: finalSeconds,
    };
    const filledNames = names.map((n, i) => n.trim() || `${t("defaultPlayer")} ${i + 1}`);
    saveNames(filledNames);
    saveSettings(finalSettings);
    navigate({ to: "/gamemaster" });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg px-4 py-4 pb-16">
      <TopBar
        left={
          <button type="button" onClick={() => navigate({ to: "/" })} className="text-sm text-muted-foreground touch-manipulation">
            {t("back")}
          </button>
        }
      />
      <h1 className="mt-3 mb-6 text-2xl font-black">{t("setupTitle")}</h1>

      <div className="space-y-3">
        {names.map((n, i) => (
          <PlayerInputRow
            key={i}
            index={i}
            value={n}
            placeholder={t("playerNamePlaceholder")}
            removeLabel={t("remove")}
            onChange={updateName}
            onRemove={removePlayer}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addPlayer}
        className="mt-4 w-full rounded-full border border-dashed border-border py-3 text-sm text-muted-foreground active:bg-input touch-manipulation"
      >
        {t("addPlayer")}
      </button>

      <section className="mt-6 space-y-4 rounded-3xl border border-border/40 bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{t("debateTimer")}</h2>
            <p className="text-xs text-muted-foreground">{t("debateTimerDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDebateTimerEnabled}
            aria-label={t("debateTimerToggle")}
            onClick={() => setIsDebateTimerEnabled((prev) => !prev)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors touch-manipulation ${
              isDebateTimerEnabled ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-foreground transition-all ${
                isDebateTimerEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {isDebateTimerEnabled && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setDebateSeconds(v);
                    setCustomInput(String(v));
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold touch-manipulation ${
                    debateSeconds === v
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={t("custom")}
                value={customInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setCustomInput(val);
                  if (val) setDebateSeconds(Number(val));
                }}
                className="w-20 rounded-full bg-input px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("perPlayerDebate", { n: debateSeconds })}
            </p>
          </div>
        )}
      </section>

      <div className="mt-8">
        <button
          type="button"
          disabled={names.length < 4}
          onClick={handleNext}
          className="block w-full rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40 touch-manipulation active:scale-[0.99]"
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}
