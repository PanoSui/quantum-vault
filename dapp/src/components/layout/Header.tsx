import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { Link, NavLink } from "react-router";
import {LayoutDashboard, Map} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/map", label: "Map", icon: Map },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-full blur-md opacity-70 group-hover:opacity-100 group-hover:blur-lg transition-all" />
              <img
                src="/logo.png"
                alt="Quantum Vault"
                className="h-10 w-10 relative"
              />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Quantum Vault
            </h1>
          </Link>

          <div className="h-6 w-px bg-slate-800" />

          <nav className="flex items-center gap-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                      isActive
                        ? "bg-slate-800/80 text-slate-100 shadow-inner"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <ConnectButton />
      </div>
    </header>
  );
}
