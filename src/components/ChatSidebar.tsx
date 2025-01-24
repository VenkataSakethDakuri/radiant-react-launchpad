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
import type { Database } from "@/integrations/supabase/types";

type Chat = Database['public']['Tables']['conversations']['Row'];

export function ChatSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      console.log('Fetching chats...');
      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at, title')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }
      console.log('Fetched chats:', data);
      return data as Chat[];
    }
  });

  const handleNewChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: chat, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;

      refetchChats();
      navigate(`/?chat=${chat.id}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new chat",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/?chat=${chatId}`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Button 
          className="w-full flex items-center gap-2" 
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {chats?.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton onClick={() => handleChatSelect(chat.id)}>
                {chat.title} - {new Date(chat.created_at).toLocaleDateString()}
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