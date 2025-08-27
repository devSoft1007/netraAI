import { Link, useLocation } from "wouter";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [location] = useLocation();
  const { logoutAndRedirect, user } = useAuth();

  // Extract user details with fallbacks
  const userEmail = user?.email || '';
  const userMetadata = user?.user_metadata || {};
  const userName = userMetadata.full_name || userMetadata.name || userEmail.split('@')[0];
  const userInitials = userName
    .split(' ')
    .map((name: string) => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/patients", label: "Patients" },
    { path: "/appointments", label: "Appointments" },
    { path: "/procedures", label: "Procedures" },
    { path: "/ai-diagnosis", label: "AI Diagnosis" },
    { path: "/billing", label: "Billing" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  const handleLogout = async () => {
    try {
      const { error } = await logoutAndRedirect('/login');
      // Error handling is done in the logoutAndRedirect function
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-[82px]">
              <img src='/images/netra-AI-logo.png' alt="logo" className="w-full h-full" />
              {/* <Eye className="text-medical-blue text-2xl" />
              <h1 className="text-xl font-semibold text-professional-dark">EyeCare Pro</h1> */}
            </div>
            <nav className="hidden md:flex space-x-8 ml-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}
                  className={`font-medium pb-4 transition-colors ${
                    isActive(item.path)
                      ? "text-medical-blue border-b-2 border-medical-blue"
                      : "text-gray-500 hover:text-medical-blue"
                  }`}
                  >
                    {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="text-gray-400 text-lg cursor-pointer hover:text-medical-blue" />
              <span className="absolute -top-1 -right-1 bg-alert-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{userInitials}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{userName}</span>
                  <ChevronDown className="text-gray-400 text-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
