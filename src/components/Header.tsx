import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, userData, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const baseNavItems = [
    { path: '/', label: t('nav.home') },
    { path: '/find-player', label: t('nav.findMatch') },
    { path: '/match-finder', label: t('matchFinder.title') },
    { path: '/create-match', label: t('nav.createMatch') },
    { path: '/courts', label: t('nav.courts') },
    { path: '/community', label: t('nav.community') },
    { path: '/profile', label: t('nav.profile') },
  ];

  // Add Admin link only for admin users
  const navItems = isAdmin 
    ? [...baseNavItems, { path: '/admin', label: t('nav.admin') || 'Admin' }]
    : baseNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'} 
              alt="PadelMate" 
              className="h-20 md:h-24 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Auth Buttons - Desktop */}
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Link to="/login">
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button asChild variant="hero" size="sm">
                  <Link to="/signup">
                    {t('nav.signup')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                      <User className="h-4 w-4 mr-2" />
                      <span className="max-w-[120px] truncate">
                        {userData?.displayName || user.email?.split('@')[0] || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {userData?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('auth.logout') || 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="glow-primary hover:bg-primary/10 hover:text-primary"
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glow-primary hover:bg-primary/10 hover:text-primary"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {/* Auth Buttons - Mobile */}
              {!user ? (
                <div className="flex flex-col gap-2 px-4 pt-2">
                  <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary/10 hover:text-primary">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      {t('nav.login')}
                    </Link>
                  </Button>
                  <Button asChild variant="hero" className="w-full">
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      {t('nav.signup')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4 pt-2 border-t border-border mt-2 pt-4">
                  <div className="px-4 py-2 text-sm">
                    <p className="font-medium text-foreground">
                      {userData?.displayName || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary/10 hover:text-primary">
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout') || 'Logout'}
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
