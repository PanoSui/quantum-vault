import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { Link } from "react-router";

export function Header() {
  return (
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur supports-[backdrop-filter]:bg-slate-950/30">
          <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
              <Link to="/" className="flex items-center gap-5xs">
              <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Quantum Vault" className="h-10 w-10" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Quantum Vault
                  </h1>
              </div>
              </Link>
              <ConnectButton />
          </div>
      </header>
  );
}
