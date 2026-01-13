"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Users, Check } from "lucide-react";

/**
 * ProfileSwitcher - PRD 41 "Act As" Context Switcher
 * 
 * Allows managers to switch between their own profile and their managed proxies.
 * Shows a visual indicator when acting as a proxy.
 * 
 * Usage:
 * ```tsx
 * <ProfileSwitcher />
 * ```
 */
export function ProfileSwitcher() {
  const {
    user,
    activeProfile,
    isActingAsProxy,
    managedProxies,
    switchProfile,
    proxiesLoading,
  } = useAuth();

  // Don't render if no user or no proxies
  if (!user || managedProxies.length === 0) {
    return null;
  }

  const currentName = activeProfile?.display_name || user.email?.split('@')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`
          flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
          ${isActingAsProxy
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
            : 'bg-muted hover:bg-muted/80 text-foreground'
          }
        `}
      >
        {isActingAsProxy ? (
          <Users className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="max-w-[120px] truncate">{currentName}</span>
        {isActingAsProxy && (
          <span className="text-xs opacity-75">(Acting As)</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Profile
        </DropdownMenuLabel>
        
        {/* Self option */}
        <DropdownMenuItem
          onClick={() => switchProfile(null)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{user.email?.split('@')[0] || 'My Account'}</span>
          </div>
          {!isActingAsProxy && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {managedProxies.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Managed Profiles ({managedProxies.length})
            </DropdownMenuLabel>
            
            {proxiesLoading ? (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">Loading...</span>
              </DropdownMenuItem>
            ) : (
              managedProxies.map((proxy: any) => (
                <DropdownMenuItem
                  key={proxy.id}
                  onClick={() => switchProfile(proxy.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                      {(proxy.display_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[140px]">
                      {proxy.display_name || 'Unnamed Proxy'}
                    </span>
                  </div>
                  {activeProfile?.id === proxy.id && (
                    <Check className="h-4 w-4 text-amber-500" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ActingAsBanner - Shows when user is acting as a proxy
 * 
 * Place this at the top of pages where context matters (submit, dashboard)
 */
export function ActingAsBanner() {
  const { isActingAsProxy, activeProfile, switchProfile } = useAuth();

  if (!isActingAsProxy || !activeProfile) {
    return null;
  }

  return (
    <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <Users className="h-4 w-4" />
          <span>
            Acting as <strong>{activeProfile.display_name}</strong>
          </span>
        </div>
        <button
          onClick={() => switchProfile(null)}
          className="text-xs text-amber-400 hover:text-amber-300 underline"
        >
          Switch back to my account
        </button>
      </div>
    </div>
  );
}

/**
 * Compact profile indicator for navigation
 */
export function ProfileIndicator() {
  const { isActingAsProxy, activeProfile } = useAuth();

  if (!isActingAsProxy || !activeProfile) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-400 border border-amber-500/30">
      <Users className="h-3 w-3" />
      <span className="max-w-[80px] truncate">{activeProfile.display_name}</span>
    </div>
  );
}
