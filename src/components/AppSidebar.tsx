import { Shield, LayoutDashboard, List, BarChart3, Globe, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: List },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Fraud Map', url: '/fraud-map', icon: Globe },
  { title: 'Admin Panel', url: '/admin', icon: ShieldAlert },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, isAdmin, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Sentinel</h2>
              <p className="text-[10px] text-muted-foreground">Fraud Detection</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton onClick={signOut} className="hover:bg-muted/50 transition-colors">
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-xs">Sign Out</span>
                    {isAdmin && <span className="text-[10px] text-primary">Admin</span>}
                  </div>
                )}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild>
                <NavLink to="/login" className="hover:bg-muted/50 transition-colors" activeClassName="bg-primary/10 text-primary">
                  <LogIn className="mr-2 h-4 w-4" />
                  {!collapsed && <span className="text-xs">Admin Login</span>}
                </NavLink>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
