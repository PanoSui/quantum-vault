import { useTurrets } from "@/hooks/useTurrets";
import { useBribe } from "@/hooks/useBribe";
import { useRegisterBribeTurret } from "@/hooks/useRegisterBribeTurret";
import { useOnlineOffline } from "@/hooks/useOnlineOffline";
import { useQuantumBalance } from "@/hooks/useQuantumBalance";
import { useQuantumMetadata } from "@/hooks/useQuantumMetadata";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { explorerUrl } from "@/lib/explorer.ts";
import { useState } from "react";
import type { Turret } from "@/types/turret";
import {useMyCharacter} from "@/hooks/useCharacter.ts";

export function TurretsTable() {
  const { data: turrets, isLoading, error } = useTurrets();
  const { mutate: bribe, isPending: isBribing } = useBribe();
  const { mutate: register, isPending: isRegistering } = useRegisterBribeTurret();
  const { mutate: toggleOnlineOffline, isPending: isTogglingStatus } = useOnlineOffline();
  const { balance, formattedBalance } = useQuantumBalance();
  const { data: quantumMetadata } = useQuantumMetadata();
  const { character } = useMyCharacter();
  const [selectedTurret, setSelectedTurret] = useState<Turret | null>(null);
  const [days, setDays] = useState<string>("7");
  const [dialogOpen, setDialogOpen] = useState(false);

  const calculateCost = (numDays: string) => {
    if (!numDays || !quantumMetadata) return 0n;
    return BigInt(numDays) * 2n * 10n ** BigInt(quantumMetadata.decimals);
  };

  const getFormattedCost = (numDays: string) => {
    if (!numDays) return "0";
    return (Number(numDays) * 2).toString();
  };

  const hasInsufficientBalance = () => {
    if (!days || !balance || !quantumMetadata) return false;
    const cost = calculateCost(days);
    return BigInt(balance) < cost;
  };

  const getSuiScanUrl = (objectId: string) => {
    return explorerUrl({
      type: 'object',
      id: objectId
    })
  };

  const handleBribeClick = (turret: Turret) => {
    setSelectedTurret(turret);
    setDialogOpen(true);
  };

  const handleRegisterClick = (turret: Turret) => {
    register(turret);
  };

  const handleStatusClick = (turret: Turret) => {
    toggleOnlineOffline(turret);
  };

  const handleBribeSubmit = () => {
    if (selectedTurret && days) {
      bribe(
        { turretId: selectedTurret.id, days: BigInt(days) },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setDays("7");
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-400">Error loading turrets: {error.message}</p>
      </div>
    );
  }

  if (!turrets || turrets.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-400">No turrets found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-slate-800/50">
            <TableHead className="text-slate-400 w-16"></TableHead>
            <TableHead className="text-slate-400">ID</TableHead>
            <TableHead className="text-slate-400">Item ID</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead className="text-slate-400">Energy Source</TableHead>
            <TableHead className="text-slate-400">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {turrets.map((turret) => (
            <TableRow key={turret.id} className="border-slate-700 hover:bg-slate-800/30">
              <TableCell className="w-16">
                <img
                  src="/turret.png"
                  alt="Turret"
                  className="h-10 w-10 rounded-md"
                />
              </TableCell>
              <TableCell className="font-mono text-xs">
                <a
                  href={getSuiScanUrl(turret.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {turret.id.slice(0, 4)}...{turret.id.slice(-4)} {turret.isMine && <span>(YOURS)</span>}
                </a>
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-300">
                {turret.key.item_id}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleStatusClick(turret)}
                  disabled={!turret.isMine || isTogglingStatus}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-all cursor-pointer hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${
                    turret.status.status["@variant"].toLowerCase() === "offline"
                      ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  }`}
                >
                  {isTogglingStatus ? "..." : turret.status.status["@variant"]}
                </button>
              </TableCell>
              <TableCell className="font-mono text-xs">
                <a
                  href={getSuiScanUrl(turret.energy_source_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {turret.energy_source_id.slice(0, 4)}...{turret.energy_source_id.slice(-4)}
                </a>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                    {
                        !turret.isBribable && turret.isMine &&
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                            onClick={() => handleRegisterClick(turret)}
                            disabled={isRegistering}
                          >
                            {isRegistering ? "..." : "REGISTER"}
                          </Button>
                    }
                  {
                    turret.isBribable && !turret.remainingDays &&
                      <Button
                        size="sm"
                        disabled={!character}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                        onClick={() => handleBribeClick(turret)}
                      >
                        BRIBE
                      </Button>
                  }
                  {
                    (turret.remainingDays || 0 > 0) &&
                      <p className="text-white">
                        Expires in {turret.remainingDays} day{(turret.remainingDays || 0)>1 ? 's' : ''}
                      </p>
                  }
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Bribe Turret
            </DialogTitle>
          </DialogHeader>

          {selectedTurret && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <img
                  src="/turret.png"
                  alt="Turret"
                  className="h-16 w-16 rounded-md"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Turret ID</p>
                    <p className="font-mono text-sm text-slate-300">
                      {selectedTurret.id.slice(0, 12)}...{selectedTurret.id.slice(-12)} {selectedTurret.isMine && <span>(YOURS)</span>}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      selectedTurret.status.status["@variant"].toLowerCase() === "offline"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {selectedTurret.status.status["@variant"]}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-slate-300 text-base flex items-center gap-2 flex-wrap">
                <span>Bribe this turret to not attack you for</span>
                <Input
                    id="days"
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="bg-slate-800 border-slate-700 focus:border-purple-500 w-20 inline-block text-center font-bold text-xl text-purple-400"
                    placeholder="7"
                />
                <span>{Number(days) === 1 ? "day" : "days"}.</span>
              </p>
              <p className={`text-xs ${hasInsufficientBalance() ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                Cost: {getFormattedCost(days)} / {formattedBalance} Quantum tokens
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBribeSubmit}
              disabled={isBribing || !days || Number(days) < 1 || hasInsufficientBalance()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBribing ? "Processing..." : "Confirm Bribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
