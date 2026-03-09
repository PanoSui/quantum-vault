import { useState } from "react";
import { useBuyQuantum } from "@/hooks/useBuyQuantum";
import { useSuiBalance } from "@/hooks/useSuiBalance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuyQuantum() {
  const { mutate: buyQuantum, isPending } = useBuyQuantum();
  const { formattedBalance: suiBalance, balance: rawSuiBalance } = useSuiBalance();
  const [amount, setAmount] = useState<string>("1");
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasInsufficientSui = () => {
    if (!amount || !rawSuiBalance) return false;
    return rawSuiBalance < Number(amount);
  };

  const handleBuy = () => {
    if (amount && Number(amount) > 0) {
      // Convert SUI amount to MIST (1 SUI = 10^9 MIST)
      buyQuantum(BigInt(amount), {
        onSuccess: () => {
          setDialogOpen(false);
          setAmount("1");
        },
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
      >
        Buy Quantum
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Buy Quantum Tokens
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-slate-300 text-sm text-center">
                Purchase Quantum tokens using SUI
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300">
                Amount (SUI)
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100 focus:border-green-500"
                placeholder="Enter SUI amount"
              />
              <div className="flex justify-between items-center text-xs">
                <p className={hasInsufficientSui() ? "text-red-400 font-semibold" : "text-slate-400"}>
                  Your SUI balance: <span className={`font-semibold ${hasInsufficientSui() ? "text-red-400" : "text-slate-300"}`}>{suiBalance} SUI</span>
                </p>
              </div>
              <p className={`text-xs ${hasInsufficientSui() ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                You will spend {amount || "0"} SUI to buy {amount || "0"} Quantum tokens
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuy}
              disabled={isPending || !amount || Number(amount) <= 0 || hasInsufficientSui()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
