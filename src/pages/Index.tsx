import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Sparkles, LogOut, History, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
        fetchCredits(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchCredits(session.user.id);
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
      toast({
        title: "Error",
        description: "Failed to fetch credits",
        variant: "destructive",
      });
      return;
    }

    // If no profile exists, create one with 5 credits
    if (!data) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, credits: 5 });
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        setCredits(0);
      } else {
        setCredits(5);
      }
      return;
    }

    setCredits(data.credits || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description for your image",
        variant: "destructive",
      });
      return;
    }

    if (credits <= 0) {
      toast({
        title: "No credits remaining",
        description: "Please upgrade to continue generating images",
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (error) {
        console.error("Error generating image:", error);
        toast({
          title: "Generation failed",
          description: error.message || "Failed to generate image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.image) {
        const imageBase64 = data.image;
        setGeneratedImage(imageBase64);

        // Save image to storage and database
        await saveImageToDatabase(imageBase64, prompt);

        // Deduct credit
        await supabase
          .from("profiles")
          .update({ credits: credits - 1 })
          .eq("user_id", user.id);
        
        setCredits(credits - 1);

        toast({
          title: "Image generated!",
          description: "Your AI image is ready",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveImageToDatabase = async (base64Image: string, promptText: string) => {
    try {
      if (!user) return;

      // Convert base64 to blob
      const base64Data = base64Image.split(",")[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      
      // Upload to storage
      const fileName = `${user.id}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(fileName, blob, {
          contentType: "image/png",
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("images")
        .insert({
          user_id: user.id,
          prompt: promptText,
          image_url: publicUrl,
        });

      if (dbError) {
        console.error("Error saving to database:", dbError);
      }
    } catch (error) {
      console.error("Error saving image:", error);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: "Image saved to your device",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isGenerating) {
      generateImage();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-hidden">
      {/* Header buttons */}
      <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
        <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <span className="text-sm font-medium">Credits: {credits}</span>
        </div>
        <Button
          onClick={() => navigate("/history")}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <History className="w-4 h-4" />
          History
        </Button>
        <Button
          onClick={() => navigate("/pricing")}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          Upgrade
        </Button>
        <Button
          onClick={() => navigate("/settings")}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent cosmic-gradient">
            AI Image Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your words into stunning visuals. Just type a description and watch the magic happen.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Describe your dream image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-lg h-14 bg-card border-border focus-visible:ring-primary"
              disabled={isGenerating}
            />
            <Button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              size="lg"
              className="h-14 px-8 cosmic-gradient hover:opacity-90 transition-smooth glow-primary"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Press Enter or click Generate to create your image
          </p>
        </div>

        {/* Generated Image Display */}
        {generatedImage && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-2 glow-primary">
              <img
                src={generatedImage}
                alt="AI Generated"
                className="w-full h-auto rounded-xl"
              />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Download Image
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && !generatedImage && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-lg text-muted-foreground animate-pulse">
              Creating your masterpiece...
            </p>
          </div>
        )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
