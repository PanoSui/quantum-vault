import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className="container mx-auto px-lg py-lg max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
