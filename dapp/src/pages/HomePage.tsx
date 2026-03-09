import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useQuantumBalance } from "@/hooks/useQuantumBalance";
import { useAnchorTurret } from "@/hooks/useAnchorTurret";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {useQuantumMetadata} from "@/hooks/useQuantumMetadata.ts";
import { TurretsTable } from "@/components/TurretsTable";
import { MyCharacter } from "@/components/MyCharacter";
import { BuyQuantum } from "@/components/BuyQuantum";

export function HomePage() {
  const account = useCurrentAccount();
  const { formattedBalance, isPending, error } = useQuantumBalance();
  const { data: quantumMetadata } = useQuantumMetadata();
  const { mutate: anchorTurret, isPending: isAnchoring } = useAnchorTurret();

  return (
      <main className="container">
        {!account ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="rounded-full bg-gradient-to-br">
              <img src="/logo.png" alt="Quantum Vault" className="h-24 w-24" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-100">
                Welcome to Quantum Vault
              </h2>
              <p className="text-lg text-slate-400">
                Connect your wallet to view your Quantum token balance
              </p>
            </div>
            <div className="mt-4">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-100">
                Your Quantum Dashboard
              </h2>
              <p className="text-slate-400">
                Wallet: {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MyCharacter />

              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-300 text-lg font-medium text-center">
                    Quantum Token Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                      <p className="mt-4 text-slate-400">Loading balance...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">Error loading balance</p>
                      <p className="text-sm text-slate-500 mt-2">{error.message}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {formattedBalance}
                        </div>
                        {quantumMetadata?.iconUrl && (
                          <img
                            src={quantumMetadata.iconUrl}
                            alt="Quantum"
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                      </div>
                      <BuyQuantum />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-300 text-lg font-medium">
                    Quantum Turrets
                  </CardTitle>
                  <Button
                    onClick={() => anchorTurret()}
                    disabled={isAnchoring}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                  >
                    {isAnchoring ? "Anchoring..." : "Anchor Turret"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TurretsTable />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
  );
}
