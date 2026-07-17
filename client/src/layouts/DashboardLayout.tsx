import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Search,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Building,
  Activity,
  Layers,
  ArrowRight,
  Database
} from "lucide-react";
import { useDBStore } from "../store/dbStore";
import { useFilterStore } from "../store/filterStore";
import { AuthService } from "../services/authService";
import { Button } from "../components/ui/Button";

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { clients, campaigns, reports, isDemoSeeded, seedDemoData, clearAllData, currentUser, loadFromDatabase } = useDBStore();
  const {
    selectedClientId,
    selectedCampaignId,
    dateRange,
    setSelectedClientId,
    setSelectedCampaignId,
    setDateRange
  } = useFilterStore();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Fetch the latest tables from Supabase when the layout mounts or session updates
  useEffect(() => {
    if (currentUser) {
      loadFromDatabase();
    }
  }, [currentUser]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Close search/profile dropdowns on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    navigate("/login");
  };

  // Global Search logic
  const filteredClients = searchQuery
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredCampaigns = searchQuery
    ? campaigns.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.platform.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredReports = searchQuery
    ? reports.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalResults =
    filteredClients.length + filteredCampaigns.length + filteredReports.length;

  const handleResultClick = (url: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(url);
  };

  let navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Reports", icon: FileText, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  if (currentUser?.role === "client") {
    navItems = [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Campaigns", icon: Layers, path: "/campaigns" },
      { label: "Reports", icon: FileText, path: "/reports" },
    ];
  }

  const activeClientName = clients.find((c) => c.id === selectedClientId)?.name || "All Clients";
  const activeCampaignName = campaigns.find((c) => c.id === selectedCampaignId)?.name || "All Campaigns";

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      
      {/* 1. Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Marketing OS</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Demo Seed Controls Footer Removed */}
      </aside>

      {/* Mobile Sidebar overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative flex flex-col w-64 bg-background border-r border-border h-full p-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">M</span>
                </div>
                <span className="font-bold text-lg">Marketing OS</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer Removed */}
          </div>
        </div>
      )}

      {/* 2. Scrollable Content Layout wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background flex items-center px-4 md:px-6 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Global Search Input */}
            <div ref={searchRef} className="relative max-w-xs md:max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients, campaigns, reports..."
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                className="w-full bg-secondary/50 focus:bg-background border border-input rounded-md pl-9 pr-4 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              />
              {/* Search dropdown suggestions */}
              {showSearchResults && searchQuery && (
                <div className="absolute top-12 left-0 w-full max-w-md bg-background border border-border rounded-md shadow-lg p-2 z-50 text-sm max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  {totalResults === 0 ? (
                    <p className="p-3 text-center text-xs text-muted-foreground">
                      No matching records for "{searchQuery}"
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredClients.length > 0 && (
                        <div>
                          <div className="px-2 text-xxs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Building className="h-3 w-3" /> Clients
                          </div>
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => handleResultClick(`/clients/${client.id}`)}
                              className="px-3 py-1.5 hover:bg-secondary rounded cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-foreground">{client.name}</span>
                              <span className="text-xxs text-muted-foreground">{client.website}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {filteredCampaigns.length > 0 && (
                        <div>
                          <div className="px-2 text-xxs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Instagram Campaigns
                          </div>
                          {filteredCampaigns.map((camp) => (
                            <div
                              key={camp.id}
                              onClick={() => handleResultClick(`/clients/${camp.clientId}`)}
                              className="px-3 py-1.5 hover:bg-secondary rounded cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-foreground">{camp.name}</span>
                              <span className="text-xxs text-muted-foreground uppercase">{camp.platform}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {filteredReports.length > 0 && (
                        <div>
                          <div className="px-2 text-xxs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Reports
                          </div>
                          {filteredReports.map((rep) => (
                            <div
                              key={rep.id}
                              onClick={() => handleResultClick(`/reports`)}
                              className="px-3 py-1.5 hover:bg-secondary rounded cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-foreground">{rep.name}</span>
                              <span className="text-xxs text-muted-foreground">Generated</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Theme & Profile Panel */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 hover:bg-secondary text-sm font-medium"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center font-bold text-xs uppercase text-neutral-700 dark:text-neutral-300">
                  {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : "US"}
                </div>
                <span className="hidden sm:inline">{currentUser ? currentUser.firstName : "User"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

              {isProfileOpen && (
                <div className="absolute right-0 top-11 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="font-semibold text-foreground leading-tight">
                      {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser ? currentUser.email : "user@agency.com"}
                    </p>
                  </div>
                  {currentUser?.role !== "client" && (
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 hover:bg-secondary text-foreground w-full text-left"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 hover:bg-secondary text-destructive w-full text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Filter Bar (Only visible if database is seeded & not on settings/auth) */}
        {isDemoSeeded && !location.pathname.startsWith("/settings") && !location.pathname.startsWith("/login") && (
          <div className="bg-background border-b border-border px-4 md:px-6 py-2.5 flex flex-wrap gap-3 items-center text-xs justify-between">
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Client Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 border border-border rounded px-2.5 py-1">
                <span className="text-muted-foreground">Client:</span>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="bg-transparent border-none outline-none font-medium cursor-pointer"
                >
                  <option value="all">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Filter Dropdown (Filtered by selected client) */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 border border-border rounded px-2.5 py-1">
                <span className="text-muted-foreground">Campaign:</span>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="bg-transparent border-none outline-none font-medium cursor-pointer"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns
                    .filter((c) => selectedClientId === "all" || c.clientId === selectedClientId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 border border-border rounded px-2.5 py-1">
                <span className="text-muted-foreground">Range:</span>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-transparent border-none outline-none font-medium cursor-pointer text-xs"
                />
                <span className="text-muted-foreground font-light px-0.5">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-transparent border-none outline-none font-medium cursor-pointer text-xs"
                />
              </div>
            </div>

            {/* Quick aggregate view info */}
            <div className="hidden lg:block text-muted-foreground">
              Showing analytics for <span className="font-semibold text-foreground">{activeClientName}</span> &raquo; <span className="font-semibold text-foreground">{activeCampaignName}</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
