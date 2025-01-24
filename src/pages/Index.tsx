import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Chat } from "@/components/Chat";

const Index = () => {
  const { toast } = useToast();

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
    <main className="min-h-screen">
      <div className="absolute top-4 right-4">
        <Button onClick={handleLogout} variant="outline">
          Sign out
        </Button>
      </div>
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <Chat />
      </div>
      <Features />
    </main>
  );
};

export default Index;