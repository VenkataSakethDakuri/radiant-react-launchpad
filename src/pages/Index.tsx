import { Chat } from "@/components/Chat";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ChatSidebar />
        <main className="flex-1 relative">
          <div className="absolute top-4 left-4">
            <SidebarTrigger />
          </div>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent animate-fade-down">
              Personal AI Journal
            </h1>
            <Chat />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;