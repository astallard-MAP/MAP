"use client";

import { UserCircle, ShieldAlert, LogOut } from 'lucide-react';
import { useImpersonation } from '@/context/ImpersonationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserProfile } from '@/lib/types';
import { UserRoleEnum } from '@/lib/schemas';
import { cn } from '@/lib/utils';

type Role = UserProfile['role'];

const allRoles = UserRoleEnum.options;

/**
 * @fileOverview Impersonate Role Feature for Global Administrators.
 */
export function UserRoleSwitcher({ originalRole }: { originalRole: Role }) {
  const { impersonatedRole, setImpersonatedRole } = useImpersonation();
  const currentRole = impersonatedRole || originalRole;

  const handleStopImpersonating = () => {
    setImpersonatedRole(null);
  };

  return (
    <div className="flex items-center gap-2">
      {impersonatedRole && (
         <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleStopImpersonating} 
            className="h-8 text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-lg"
        >
            <LogOut className="mr-1.5 h-3 w-3" />
            Stop Impersonating
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
                "h-8 text-[10px] font-bold uppercase tracking-widest border-2",
                impersonatedRole ? "border-destructive text-destructive bg-destructive/5" : "border-primary text-primary"
            )}
          >
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            Impersonate: {currentRole}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Select Persona
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto">
            {allRoles.map((role) => (
                <DropdownMenuItem
                key={role}
                onClick={() => setImpersonatedRole(role)}
                disabled={currentRole === role}
                className={cn(
                    "text-xs font-medium",
                    currentRole === role && "bg-muted font-bold"
                )}
                >
                {role}
                </DropdownMenuItem>
            ))}
          </div>
          {impersonatedRole && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleStopImpersonating} className="text-destructive font-bold focus:text-destructive">
                    Reset to {originalRole}
                </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
