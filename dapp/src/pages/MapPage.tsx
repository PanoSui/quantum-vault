import { useMemo, useState } from "react";
import { Crosshair, ExternalLink, Swords, X } from "lucide-react";
import { toast } from "sonner";
import { useTurrets } from "@/hooks/useTurrets";
import { useCharacters } from "@/hooks/useCharacters";
import { useRegisterSniperTurret } from "@/hooks/useRegisterSniperTurret";
import { explorerUrl } from "@/lib/explorer";
import type { Turret } from "@/types/turret";
import {CharacterInfo} from "@evefrontier/dapp-kit";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {useSniperTarget, useSnipe, useUnsnipe} from "@/hooks/useSniper.ts";

const PADDING_PERCENT = 5;

function hashId(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function turretPosition(turret: Turret) {
  const h = hashId(turret.id);
  const x =
    PADDING_PERCENT +
    ((h & 0xffff) / 0xffff) * (100 - PADDING_PERCENT * 2);
  const y =
    PADDING_PERCENT +
    (((h >>> 16) & 0xffff) / 0xffff) * (100 - PADDING_PERCENT * 2);
  return { x, y };
}

const STAR_COUNT = 220;
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars() {
  const rand = mulberry32(0xc0ffee);
  return Array.from({ length: STAR_COUNT }, () => {
    const tier = rand();
    const size =
      tier < 0.7
        ? 0.6 + rand() * 0.8
        : tier < 0.95
        ? 1.4 + rand() * 1.1
        : 2.5 + rand() * 1.5;
    return {
      x: rand() * 100,
      y: rand() * 100,
      size,
      opacity: 0.2 + rand() * 0.75,
    };
  });
}

const SHIP_COUNT = 20;
const SHIP_CLASSES = [
  "Frigate",
  "Destroyer",
  "Cruiser",
  "Battlecruiser",
  "Battleship",
] as const;
const SHIP_NAMES = [
  "Vanguard",
  "Specter",
  "Onyx",
  "Hyperion",
  "Nebula",
  "Ironclad",
  "Aurora",
  "Vortex",
  "Pulsar",
  "Ember",
  "Phantom",
  "Cyclone",
  "Eclipse",
  "Tempest",
  "Quasar",
  "Wraith",
  "Nova",
  "Helios",
  "Talon",
  "Comet",
];
const SHIP_FACTIONS = ["Coalition", "Outlaws", "Syndicate", "Free Fleet"];

const SHIP_SIZE: Record<(typeof SHIP_CLASSES)[number], number> = {
  Frigate: 22,
  Destroyer: 28,
  Cruiser: 34,
  Battlecruiser: 40,
  Battleship: 48,
};

interface Spaceship {
  id: string;
  character: CharacterInfo;
  name: string;
  shipClass: (typeof SHIP_CLASSES)[number];
  faction: string;
  shield: number;
  armor: number;
  hull: number;
  damage: number;
  pilot: string;
  x: number;
  y: number;
  rotation: number;
}

function generateShips(characters: CharacterInfo[]): Spaceship[] {
  const rand = mulberry32(0x5eedba11);
  const count = Math.min(SHIP_COUNT, characters.length);
  return Array.from({ length: count }, (_, i) => {
    const character = characters[i];
    const shipClass = SHIP_CLASSES[Math.floor(rand() * SHIP_CLASSES.length)];
    const tier = ["I", "II", "III", "IV", "V"][Math.floor(rand() * 5)];
    const sizeMultiplier =
      shipClass === "Frigate"
        ? 0.6
        : shipClass === "Destroyer"
        ? 0.8
        : shipClass === "Cruiser"
        ? 1
        : shipClass === "Battlecruiser"
        ? 1.3
        : 1.6;
    return {
      id: `ship-${i}`,
      character,
      name: character.name || `${SHIP_NAMES[i % SHIP_NAMES.length]} ${tier}`,
      shipClass,
      faction: SHIP_FACTIONS[Math.floor(rand() * SHIP_FACTIONS.length)],
      shield: Math.floor(500 + rand() * 4500 * sizeMultiplier),
      armor: Math.floor(500 + rand() * 3500 * sizeMultiplier),
      hull: Math.floor(500 + rand() * 2500 * sizeMultiplier),
      damage: Math.floor(50 + rand() * 750 * sizeMultiplier),
      pilot: character.address,
      x: PADDING_PERCENT + rand() * (100 - PADDING_PERCENT * 2),
      y: PADDING_PERCENT + rand() * (100 - PADDING_PERCENT * 2),
      rotation: Math.floor(rand() * 360),
    };
  });
}

export function MapPage() {
  const { data: turrets, isLoading, error } = useTurrets();
  const { data: characters } = useCharacters();
  const { data: target } = useSniperTarget();
  const { mutate: registerSniper, isPending: isRegisteringSniper } = useRegisterSniperTurret();
  const { mutate: snipe, isPending: isSniping } = useSnipe();
  const { mutate: unsnipe, isPending: isUnsniping } = useUnsnipe();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<Spaceship | null>(null);
  const [selectedTurret, setSelectedTurret] = useState<Turret | null>(null);

  const stars = useMemo(generateStars, []);
  const ships = useMemo(
    () => generateShips(characters ?? []),
    [characters]
  );
  const placedTurrets = useMemo(
    () => (turrets ?? []).map((t) => ({ turret: t, ...turretPosition(t) })),
    [turrets]
  );

  const isSelectedShipTargeted = target === selectedShip?.character._raw?.key.item_id;

  const handleAttack = () => {
    if (!selectedShip) return;
    if (isSelectedShipTargeted) {
      unsnipe(undefined, {
        onSuccess: () => {
          toast.success(`Stopped sniping ${selectedShip.name}`);
          setSelectedShip(null);
        },
        onError: (err) => {
          toast.error("Failed to stop sniping", {
            description: err instanceof Error ? err.message : String(err),
          });
        },
      });
    } else {
      snipe(selectedShip.character, {
        onSuccess: () => {
          toast.success(`Sniper locked on ${selectedShip.name}`, {
            description: `${selectedShip.shipClass} • ${selectedShip.faction}`,
          });
          setSelectedShip(null);
        },
        onError: (err) => {
          toast.error("Failed to lock sniper target", {
            description: err instanceof Error ? err.message : String(err),
          });
        },
      });
    }
  };

  const handleRegisterSniper = () => {
    if (!selectedTurret) return;
    registerSniper(selectedTurret, {
      onSuccess: () => {
        toast.success("Turret registered as sniper");
        setSelectedTurret(null);
      },
      onError: (err) => {
        toast.error("Failed to register sniper turret", {
          description: err instanceof Error ? err.message : String(err),
        });
      },
    });
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 top-16 overflow-hidden"
      style={{
        backgroundColor: "#020617",
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(30,41,59,0.6) 0%, rgba(2,6,23,0) 70%), linear-gradient(rgba(30,41,59,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.4) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 50px 50px, 50px 50px",
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-slate-200 pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-400">Error loading turrets: {error.message}</p>
        </div>
      )}

      {!isLoading && !error && placedTurrets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-400">No turrets anchored yet</p>
        </div>
      )}

      {placedTurrets.map(({ turret, x, y }) => {
        const isOffline =
          turret.status.status["@variant"].toLowerCase() === "offline";
        const ringColor = turret.isMine
          ? "#a78bfa"
          : isOffline
          ? "#f87171"
          : "#60a5fa";
        const isHovered = hovered === turret.id;

        return (
          <div
            key={turret.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: isHovered ? 30 : 10 }}
            onMouseEnter={() => setHovered(turret.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelectedTurret(turret)}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md transition-all group-hover:blur-lg"
              style={{
                width: 48,
                height: 48,
                backgroundColor: ringColor,
                opacity: 0.35,
              }}
            />
            <div
              className="relative rounded-full bg-slate-950 border-2 p-1 transition-transform group-hover:scale-125 shadow-lg"
              style={{ borderColor: ringColor }}
            >
              <img src="/turret.png" alt="Turret" className="h-5 w-5 block" />
            </div>

            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none">
                <div className="bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-2xl space-y-1 min-w-[200px] w-max max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-100 font-semibold">
                      {turret.id.slice(0, 6)}...{turret.id.slice(-4)}
                    </span>
                    {turret.isMine && (
                      <span className="text-purple-400 font-semibold text-[10px] tracking-wider">
                        YOURS
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Item ID:{" "}
                    <span className="font-mono text-slate-300">
                      {turret.key.item_id}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Status:{" "}
                    <span
                      className={
                        isOffline ? "text-red-300" : "text-blue-300"
                      }
                    >
                      {turret.status.status["@variant"]}
                    </span>
                  </div>
                </div>
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid rgb(51, 65, 85)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {ships.map((ship) => {
        const isHovered = hovered === ship.id;
        const isTargeted = target === ship.character._raw?.key.item_id;
        const size = SHIP_SIZE[ship.shipClass];
        const reticleSize = size * 2;
        return (
          <div
            key={ship.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${ship.x}%`,
              top: `${ship.y}%`,
              zIndex: isTargeted ? 25 : isHovered ? 30 : 15,
            }}
            onMouseEnter={() => setHovered(ship.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelectedShip(ship)}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md transition-all group-hover:blur-xl"
              style={{
                width: size * 1.4,
                height: size * 1.4,
                backgroundColor: isTargeted ? "#ef4444" : "#22d3ee",
                opacity: isTargeted ? 0.35 : 0.18,
              }}
            />
            {isTargeted && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"
                style={{ width: reticleSize, height: reticleSize }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <g
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M5 20 L5 5 L20 5" />
                    <path d="M80 5 L95 5 L95 20" />
                    <path d="M95 80 L95 95 L80 95" />
                    <path d="M20 95 L5 95 L5 80" />
                    <line x1="50" y1="0" x2="50" y2="14" />
                    <line x1="50" y1="86" x2="50" y2="100" />
                    <line x1="0" y1="50" x2="14" y2="50" />
                    <line x1="86" y1="50" x2="100" y2="50" />
                  </g>
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
            )}
            <div
              className="relative transition-transform group-hover:scale-125"
              style={{
                width: size,
                height: size,
                transform: `rotate(${ship.rotation}deg)`,
                filter: isTargeted
                  ? "drop-shadow(0 0 6px rgba(239,68,68,0.9))"
                  : "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
              }}
            >
              <ShipIcon shipClass={ship.shipClass} />
            </div>

            {isTargeted && (
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ top: `calc(50% + ${reticleSize / 2 + 4}px)` }}
              >
                <span className="bg-red-500/90 text-white text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded shadow-lg">
                  TARGET
                </span>
              </div>
            )}

            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none">
                <div className="bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-2xl space-y-1 min-w-[180px] w-max max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-semibold">
                      {ship.name}
                    </span>
                    {isTargeted && (
                      <span className="text-red-400 font-bold text-[10px] tracking-wider">
                        SNIPER TARGET
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Class:{" "}
                    <span className="text-amber-300">{ship.shipClass}</span>
                  </div>
                  <div className="text-slate-400">
                    Faction:{" "}
                    <span className="text-slate-300">{ship.faction}</span>
                  </div>
                  <div className="text-slate-400">
                    Character ID:{" "}
                    <span className="text-slate-300 font-mono">
                      {ship.character.id.slice(0, 6)}...
                      {ship.character.id.slice(-4)}
                    </span>
                  </div>
                </div>
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid rgb(51, 65, 85)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs flex flex-col gap-2 shadow-xl">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-400" />
          Yours
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
          Online
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400" />
          Offline
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="h-4 w-4">
            <ShipIcon shipClass="Cruiser" />
          </div>
          Spaceship
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Crosshair className="h-4 w-4 text-red-400" />
          Sniper target
        </div>
        <div className="text-slate-500 border-t border-slate-700 pt-2">
          {placedTurrets.length} turret
          {placedTurrets.length === 1 ? "" : "s"} · {ships.length} ships
          {typeof target === "number" && target > 0 && (
            <>
              {" "}
              · target #
              <span className="text-red-300 font-mono">{target}</span>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={selectedTurret !== null}
        onOpenChange={(open) => !open && setSelectedTurret(null)}
      >
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 flex items-center gap-3">
              <img src="/turret.png" alt="Turret" className="h-7 w-7" />
              Turret
            </DialogTitle>
          </DialogHeader>

          {selectedTurret && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Turret ID
                  </p>
                  <a
                    href={explorerUrl({ type: "object", id: selectedTurret.id })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedTurret.id.slice(0, 12)}...
                    {selectedTurret.id.slice(-12)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Item ID
                  </p>
                  <p className="font-mono text-xs text-slate-300">
                    {selectedTurret.key.item_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Status
                  </p>
                  <p
                    className={
                      selectedTurret.status.status["@variant"].toLowerCase() ===
                      "offline"
                        ? "text-red-300 font-semibold"
                        : "text-blue-300 font-semibold"
                    }
                  >
                    {selectedTurret.status.status["@variant"]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Owner
                  </p>
                  <p
                    className={
                      selectedTurret.isMine
                        ? "text-purple-300 font-semibold"
                        : "text-slate-300"
                    }
                  >
                    {selectedTurret.isMine ? "You" : "Other"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Sniper
                  </p>
                  <p
                    className={
                      selectedTurret.isSniper
                        ? "text-amber-300 font-semibold"
                        : "text-slate-400"
                    }
                  >
                    {selectedTurret.isSniper ? "Registered" : "Not registered"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTurret(null)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
            {selectedTurret?.isMine && !selectedTurret.isSniper && (
              <Button
                onClick={handleRegisterSniper}
                disabled={isRegisteringSniper}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crosshair className="h-4 w-4 mr-2" />
                {isRegisteringSniper ? "Registering..." : "Register as Sniper"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedShip !== null}
        onOpenChange={(open) => !open && setSelectedShip(null)}
      >
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300 flex items-center gap-3">
              {selectedShip && (
                <div className="h-7 w-7 shrink-0">
                  <ShipIcon shipClass={selectedShip.shipClass} />
                </div>
              )}
              {selectedShip?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedShip && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Class
                  </p>
                  <p className="text-amber-300 font-semibold">
                    {selectedShip.shipClass}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Faction
                  </p>
                  <p className="text-slate-200 font-semibold">
                    {selectedShip.faction}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Pilot
                  </p>
                  <p className="font-mono text-xs text-slate-300">
                    {selectedShip.pilot.slice(0, 6)}...
                    {selectedShip.pilot.slice(-4)}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Character Id
                  </p>
                  <p className="font-mono text-xs text-slate-300">
                    {selectedShip.character._raw?.key.item_id}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <StatBar
                  label="Shield"
                  value={selectedShip.shield}
                  max={10000}
                  color="bg-cyan-400"
                />
                <StatBar
                  label="Armor"
                  value={selectedShip.armor}
                  max={10000}
                  color="bg-amber-400"
                />
                <StatBar
                  label="Hull"
                  value={selectedShip.hull}
                  max={10000}
                  color="bg-red-400"
                />
              </div>

              <div className="rounded-md bg-slate-950/60 border border-slate-800 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wide">
                  Damage / volley
                </span>
                <span className="text-lg font-bold text-orange-400">
                  {selectedShip.damage.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedShip(null)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttack}
              disabled={isSniping || isUnsniping}
              className={
                isSelectedShipTargeted
                  ? "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              {isSelectedShipTargeted ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {isUnsniping ? "Stopping..." : "Stop"}
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4 mr-2" />
                  {isSniping ? "Locking..." : "Attack"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const HULL_FILL = "#1e293b";
const HULL_STROKE = "#64748b";
const PANEL = "#475569";
const ENGINE = "#fbbf24";
const ENGINE_CORE = "#fef3c7";
const ACCENT = "#22d3ee";

function ShipIcon({
  shipClass,
}: {
  shipClass: (typeof SHIP_CLASSES)[number];
}) {
  switch (shipClass) {
    case "Frigate":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,6 58,46 60,72 40,72 42,46"
            fill={HULL_FILL}
            stroke={HULL_STROKE}
            strokeWidth="1.2"
          />
          <polygon
            points="42,48 22,66 30,72 42,62"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="1"
          />
          <polygon
            points="58,48 78,66 70,72 58,62"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="1"
          />
          <line x1="50" y1="20" x2="50" y2="60" stroke={HULL_STROKE} strokeWidth="0.6" />
          <circle cx="50" cy="32" r="2.5" fill={ACCENT} />
          <rect x="46" y="70" width="8" height="8" fill={ENGINE} />
          <rect x="48" y="72" width="4" height="4" fill={ENGINE_CORE} />
        </svg>
      );
    case "Destroyer":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,4 56,32 60,68 56,78 44,78 40,68 44,32"
            fill={HULL_FILL}
            stroke={HULL_STROKE}
            strokeWidth="1.2"
          />
          <rect x="30" y="38" width="8" height="26" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <rect x="62" y="38" width="8" height="26" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <line x1="34" y1="40" x2="34" y2="32" stroke={HULL_STROKE} strokeWidth="1" />
          <line x1="66" y1="40" x2="66" y2="32" stroke={HULL_STROKE} strokeWidth="1" />
          <line x1="50" y1="20" x2="50" y2="64" stroke={HULL_STROKE} strokeWidth="0.6" />
          <circle cx="50" cy="26" r="2.5" fill={ACCENT} />
          <rect x="42" y="76" width="6" height="8" fill={ENGINE} />
          <rect x="52" y="76" width="6" height="8" fill={ENGINE} />
          <rect x="44" y="78" width="2" height="4" fill={ENGINE_CORE} />
          <rect x="54" y="78" width="2" height="4" fill={ENGINE_CORE} />
        </svg>
      );
    case "Cruiser":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,10 65,40 64,72 60,80 40,80 36,72 35,40"
            fill={HULL_FILL}
            stroke={HULL_STROKE}
            strokeWidth="1.2"
          />
          <polygon
            points="35,46 18,52 16,66 22,72 35,64"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="1"
          />
          <polygon
            points="65,46 82,52 84,66 78,72 65,64"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="1"
          />
          <rect x="45" y="34" width="10" height="20" fill={PANEL} stroke={HULL_STROKE} strokeWidth="0.8" />
          <line x1="50" y1="20" x2="50" y2="76" stroke={HULL_STROKE} strokeWidth="0.6" />
          <circle cx="50" cy="28" r="3" fill={ACCENT} />
          <rect x="40" y="78" width="5" height="8" fill={ENGINE} />
          <rect x="47.5" y="78" width="5" height="8" fill={ENGINE} />
          <rect x="55" y="78" width="5" height="8" fill={ENGINE} />
        </svg>
      );
    case "Battlecruiser":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,4 62,18 70,38 70,66 64,80 36,80 30,66 30,38 38,18"
            fill={HULL_FILL}
            stroke={HULL_STROKE}
            strokeWidth="1.4"
          />
          <rect x="14" y="36" width="14" height="32" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <rect x="72" y="36" width="14" height="32" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <line x1="14" y1="44" x2="28" y2="44" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="14" y1="60" x2="28" y2="60" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="72" y1="44" x2="86" y2="44" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="72" y1="60" x2="86" y2="60" stroke={HULL_STROKE} strokeWidth="0.6" />
          <polygon
            points="42,30 58,30 56,60 44,60"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="0.8"
          />
          <circle cx="50" cy="42" r="3" fill={ACCENT} />
          <rect x="36" y="78" width="28" height="6" fill={PANEL} stroke={HULL_STROKE} strokeWidth="0.8" />
          <rect x="38" y="80" width="6" height="6" fill={ENGINE} />
          <rect x="47" y="80" width="6" height="6" fill={ENGINE} />
          <rect x="56" y="80" width="6" height="6" fill={ENGINE} />
        </svg>
      );
    case "Battleship":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,3 60,14 75,22 80,42 78,68 72,82 28,82 22,68 20,42 25,22 40,14"
            fill={HULL_FILL}
            stroke={HULL_STROKE}
            strokeWidth="1.4"
          />
          <rect x="10" y="30" width="14" height="38" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <rect x="76" y="30" width="14" height="38" fill={PANEL} stroke={HULL_STROKE} strokeWidth="1" />
          <line x1="10" y1="40" x2="24" y2="40" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="10" y1="50" x2="24" y2="50" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="10" y1="60" x2="24" y2="60" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="76" y1="40" x2="90" y2="40" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="76" y1="50" x2="90" y2="50" stroke={HULL_STROKE} strokeWidth="0.6" />
          <line x1="76" y1="60" x2="90" y2="60" stroke={HULL_STROKE} strokeWidth="0.6" />
          <polygon
            points="38,22 62,22 60,62 40,62"
            fill={PANEL}
            stroke={HULL_STROKE}
            strokeWidth="0.8"
          />
          <rect x="46" y="32" width="8" height="22" fill={HULL_FILL} stroke={HULL_STROKE} strokeWidth="0.6" />
          <circle cx="50" cy="42" r="3.5" fill={ACCENT} />
          <rect x="32" y="80" width="36" height="5" fill={PANEL} stroke={HULL_STROKE} strokeWidth="0.8" />
          <rect x="33" y="82" width="5" height="6" fill={ENGINE} />
          <rect x="41" y="82" width="5" height="6" fill={ENGINE} />
          <rect x="49" y="82" width="5" height="6" fill={ENGINE} />
          <rect x="57" y="82" width="5" height="6" fill={ENGINE} />
          <line x1="50" y1="3" x2="50" y2="14" stroke={HULL_STROKE} strokeWidth="0.8" />
        </svg>
      );
  }
}
