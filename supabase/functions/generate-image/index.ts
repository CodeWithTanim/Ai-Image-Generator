import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Basic content moderation to prevent NSFW/illegal content
    const text = String(prompt).toLowerCase();
    const sexualTerms = [
      "fuck","sex","porn","nude","naked","blowjob","anal","rape","penetrat","cum","semen","sperm","boobs","breasts","vagina","penis"
    ];
    const minorTerms = [
      "child","kid","teen","minor","boy","girl","underage","youngster","schoolgirl","schoolboy"
    ];
    const hasSexual = sexualTerms.some((w) => text.includes(w));
    const hasMinor = minorTerms.some((w) => text.includes(w));
    if (hasSexual || (hasMinor && /(\bsex|\bfuck|\bnude|\bnaked|\bporn|\bexplicit)/.test(text))) {
      console.warn("Blocked prompt due to content policy:", prompt);
      return new Response(
        JSON.stringify({ error: "Prompt violates content policy. Please use non-explicit, safe content." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Generating image with prompt:", prompt);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI gateway for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate image", details: errorText?.slice(0, 500) }),
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64Url) {
      throw new Error("No image returned from AI");
    }
    
    console.log("Image generated successfully");

    return new Response(
      JSON.stringify({ image: base64Url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in generate-image function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
