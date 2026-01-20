import { Link, useLocation } from "react-router-dom";
import { House, ChartBar, Trophy, User, SignOut } from "@phosphor-icons/react";

export default function Layout({ username, onLogout, children }) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: House, label: "Home" },
    { path: "/predictions", icon: Trophy, label: "Palpites" },
    { path: "/rankings", icon: ChartBar, label: "Rankings" },
    { path: "/profile", icon: User, label: "Perfil" }
  ];

  return (
    <div className="min-h-screen bg-bone">
      {/* Header Desktop */}
      <header className="bg-white border-b-2 border-paper shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pitch-green rounded-full flex items-center justify-center">
              <Trophy size={24} weight="fill" className="text-bone" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-pitch-green">
                CallClub
              </h1>
              <p className="text-xs text-text-secondary">Liga dos Palpiteiros</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-pitch-green text-bone"
                      : "text-text-secondary hover:bg-paper"
                  }`}
                >
                  <Icon size={20} weight={isActive ? "fill" : "regular"} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-text-primary">{username}</p>
              <p className="text-xs text-text-secondary">Membro</p>
            </div>
            <button
              onClick={onLogout}
              data-testid="logout-button"
              className="p-2 text-text-secondary hover:text-error transition-colors"
              title="Sair"
            >
              <SignOut size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-paper shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "text-pitch-green"
                    : "text-text-secondary"
                }`}
              >
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
