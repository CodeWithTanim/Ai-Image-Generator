import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Home, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
}

const History = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchImages();
        fetchCredits(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching credits:", error);
      return;
    }

    // If no profile exists, create one with 5 credits
    if (!data) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, credits: 5 });
      
      if (!insertError) {
        setCredits(5);
      } else {
        setCredits(0);
      }
      return;
    }

    setCredits(data.credits || 0);
  };

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching images:", error);
        toast({
          title: "Error",
          description: "Failed to load your image history",
          variant: "destructive",
        });
        return;
      }

      setImages(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 30)}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: "Image saved to your device",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("images")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting image:", error);
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive",
        });
        return;
      }

      setImages(images.filter(img => img.id !== id));
      toast({
        title: "Deleted",
        description: "Image removed from history",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent cosmic-gradient">
              Your Image History
            </h1>
            <p className="text-muted-foreground mt-2">
              All your AI-generated masterpieces
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
              <span className="text-sm font-medium">Credits: {credits}</span>
            </div>
            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="gap-2"
            >
              Upgrade
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Generate New
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading your images...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <p className="text-xl text-muted-foreground">
              No images generated yet
            </p>
            <Button onClick={() => navigate("/")} className="cosmic-gradient">
              Generate Your First Image
            </Button>
          </div>
        )}

        {/* Images Grid */}
        {!isLoading && images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="relative rounded-xl overflow-hidden border border-border bg-card p-2 glow-primary group">
                  <img
                    src={image.image_url}
                    alt={image.prompt}
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      onClick={() => handleDownload(image.image_url, image.prompt)}
                      size="sm"
                      variant="secondary"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(image.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(image.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
