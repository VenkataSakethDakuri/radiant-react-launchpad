import { Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type Chat = {
  id: string;
  created_at: string;
}

export function ChatSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Chat[];
    }
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Button 
          className="w-full flex items-center gap-2" 
          onClick={() => navigate("/")}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {chats?.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton>
                Chat from {new Date(chat.created_at).toLocaleDateString()}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}