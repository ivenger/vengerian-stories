
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Shield } from 'lucide-react';

const AuthNav: React.FC = () => {
  const { currentUser, signInWithGoogle, logout, isAdmin } = useAuth();

  return (
    <div>
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                <AvatarFallback>{currentUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Role: {isAdmin ? 'Admin' : 'Viewer'}</span>
              </div>
            </DropdownMenuLabel>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <a href="/admin" className="cursor-pointer">
                  Admin Dashboard
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={logout}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={signInWithGoogle} variant="outline" className="flex items-center gap-2">
          <User size={16} />
          Sign In
        </Button>
      )}
    </div>
  );
};

export default AuthNav;
