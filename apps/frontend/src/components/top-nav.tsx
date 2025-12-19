'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard, FileText, TrendingUp, Mail, Key, ShieldCheck, ShieldOff, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { API_ENDPOINTS } from '@/lib/api';
import { HoverCard } from '@/components/ui/hover-card';
import { SettingsModal } from '@/components/settings-modal';

interface UserProfile {
  userId: string;
  email: string;
  dhanClientId: string | null;
  riskThreshold: number;
  killSwitchEnabled: boolean;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: FileText,
  },
];

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUser = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.PROFILE);
      if (response.data?.success) {
        setUser(response.data.user);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsSettingsModalOpen(true);
    };

    window.addEventListener('openSettings', handleOpenSettings);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      router.push('/login');
    } catch (err) {
    }
  };

  const handleToggleKillSwitch = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    try {
      const newState = e?.target.checked ?? !user.killSwitchEnabled;
      const response = await api.put(API_ENDPOINTS.USER.SETTINGS, {
        killSwitchEnabled: newState,
      });
      
      if (response.data?.success) {
        setUser({ ...user, killSwitchEnabled: newState });
      }
    } catch (err) {
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Risk Engine</h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <HoverCard
              content={
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {user?.killSwitchEnabled ? (
                      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="font-medium">Kill Switch</p>
                  </div>
                  <p className="text-muted-foreground">
                    {user?.killSwitchEnabled 
                      ? 'Kill switch is active. MTM monitoring and risk checks are running.' 
                      : 'Kill switch is inactive. MTM monitoring and risk checks are disabled.'}
                  </p>
                </div>
              }
              side="bottom"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Kill Switch</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={user?.killSwitchEnabled ?? false}
                    onChange={handleToggleKillSwitch}
                    disabled={isLoading}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
                    "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2",
                    "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                    user?.killSwitchEnabled
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-all duration-200 ease-in-out shadow-sm flex items-center justify-center",
                      user?.killSwitchEnabled ? "translate-x-5" : "translate-x-0"
                    )}>
                      {user?.killSwitchEnabled ? (
                        <ShieldCheck className="h-3 w-3 text-green-600" />
                      ) : (
                        <ShieldOff className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </label>
                <span className={cn(
                  "text-xs font-medium hidden sm:inline min-w-[50px] text-right",
                  user?.killSwitchEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )}>
                  {user?.killSwitchEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </HoverCard>
          </div>

          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50">
              <div className="py-2">
                {isLoading ? (
                  <div className="px-3 py-2 space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Email</span>
                      </div>
                      <p className="text-sm font-medium ml-5 break-all">{user?.email || 'N/A'}</p>
                    </div>
                    {user?.dhanClientId && (
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Client ID</span>
                        </div>
                        <p className="text-sm font-mono font-medium ml-5 break-all">{user.dhanClientId}</p>
                      </div>
                    )}
                    <div className="border-t my-1"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        onSettingsUpdate={() => {
          fetchUser();
        }}
      />
    </header>
  );
}


