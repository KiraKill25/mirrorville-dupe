import { describe, expect, it } from "vitest";
import {
  buildNightSteps,
  checkVictory,
  createGame,
  resolveBabyWolf,
  submitStep,
  submitVote,
} from "./engine";

const game = (roles: string[]) => createGame(roles.map((roleId, i) => ({ name: `P${i}`, roleId })));
const at = (s: ReturnType<typeof game>, role: string) => ({
  ...s,
  stepIndex: s.steps.findIndex((x) => x.roleId === role),
});

describe("new role rules", () => {
  it("lets Pyromaniac douse one player in villages of 10", () => {
    const s = game(["pyromaniac", ...Array(9).fill("simple-villageois")]);
    expect(s.steps.find((x) => x.roleId === "pyromaniac")?.mode).toBe("one");
  });
  it("lets Pyromaniac douse up to two players above 10", () => {
    const s = game(["pyromaniac", ...Array(10).fill("simple-villageois")]);
    expect(s.steps.find((x) => x.roleId === "pyromaniac")?.mode).toBe("two");
  });
  it("ignites every doused player once", () => {
    const s = game([
      "pyromaniac",
      "simple-villageois",
      "simple-villageois",
      "simple-villageois",
      "loup-garou",
    ]);
    s.players[1].doused = s.players[2].doused = true;
    const out = submitStep(at(s, "pyromaniac"), { ignite: true });
    expect(out.players.filter((p) => p.deathCause === "FIRE").map((p) => p.name)).toEqual([
      "P1",
      "P2",
    ]);
    expect(out.players[0].matchUsed).toBe(true);
  });
  it("Pyromaniac wins at three survivors", () => {
    const s = game(["pyromaniac", "simple-villageois", "loup-garou"]);
    expect(checkVictory(s).winner).toContain("winPyromaniac");
  });
  it("kills the Alien on its third wrong guess", () => {
    const s = game(["alien", "simple-villageois", "loup-garou", "voyante"]);
    s.players[0].alienErrors = 2;
    const out = submitStep(at(s, "alien"), { targetId: s.players[1].id, guessedRoleId: "voyante" });
    expect(out.players[0].deathCause).toBe("ALIEN_FAILURE");
  });
  it("Alien kills on an exact role guess", () => {
    const s = game(["alien", "voyante", "loup-garou", "simple-villageois"]);
    const out = submitStep(at(s, "alien"), { targetId: s.players[1].id, guessedRoleId: "voyante" });
    expect(out.players[1].deathCause).toBe("ALIEN");
  });
  it("Red Wolf wastes a freeze on a powerless player", () => {
    const s = game(["loup-rouge", "simple-villageois", "voyante"]);
    const out = submitStep(at(s, "loup-rouge"), { targetId: s.players[1].id });
    expect(out.players[1].frozenNight).toBeUndefined();
  });
  it("Red Wolf freezes a power for the night", () => {
    const s = game(["loup-rouge", "voyante", "simple-villageois"]);
    const out = submitStep(at(s, "loup-rouge"), { targetId: s.players[1].id });
    expect(out.players[1].frozenNight).toBe(1);
  });
  it("Baby Wolf revenge opens after a village vote", () => {
    const s = {
      ...game(["bébé-loup", "simple-villageois", "simple-villageois", "voyante"]),
      phase: "JOUR_VOTE" as const,
      day: 2,
    };
    const pending = submitVote(s, s.players[0].id);
    expect(pending.babyWolfPending).toEqual([s.players[0].id]);
    expect(resolveBabyWolf(pending, s.players[1].id).players[1].deathCause).toBe(
      "BABY_WOLF_REVENGE",
    );
  });
  it("new wolves take the pack kill when alone", () => {
    expect(
      buildNightSteps(game(["bébé-loup", "simple-villageois"])).some((x) => x.mode === "wolves"),
    ).toBe(true);
  });
});
