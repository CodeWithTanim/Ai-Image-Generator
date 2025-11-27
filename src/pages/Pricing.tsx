import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [userCredits, setUserCredits] = useState<number | null>(null);

  const plans = [
    {
      name: "Silver",
      price: "$5",
      credits: 200,
      paymentLink: "https://rupantorpay.com/paymentlink/eyJ1aWQiOjMwMDgsImJyYW5kX2lkIjoiMTg0MyIsImN1c3RvbWVyX2Ftb3VudCI6IjY0NSJ9",
      features: [
        "200 image generations per month",
        "High quality images",
        "Download all images",
        "Monthly subscription",
      ],
    },
    {
      




      
      credits: 2500,
      paymentLink: "https://rupantorpay.com/paymentlink/eyJ1aWQiOjMwMDgsImJyYW5kX2lkIjoiMTg0MyIsImN1c3RvbWVyX2Ftb3VudCI6IjY0NTAifQ",
      features: [
        "2500 image generations per month",
        "High quality images",
        "Download all images",
        "Priority support",
        "Monthly subscription",
      ],
      popular: true,
    },
    {
      name: "Platinum",
      price: "$100",
      credits: 5500,
      paymentLink: "https://rupantorpay.com/paymentlink/eyJ1aWQiOjMwMDgsImJyYW5kX2lkIjoiMTg0MyIsImN1c3RvbWVyX2Ftb3VudCI6IjEyOTAwIn0",
      features: [
        "5500 image generations per month",
        "High quality images",
        "Download all images",
        "Priority support",
        "Early access to new features",
        "Monthly subscription",
      ],
    },
  ];

  useEffect(() => {
    const fetchUserCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          setUserCredits(profile.credits);
        }
      }
    };

    fetchUserCredits();
  }, []);

  const getCurrentPlan = (credits: number) => {
    if (credits >= 5500) return "Platinum";
    if (credits >= 2500) return "Gold";
    if (credits >= 200) return "Silver";
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          ← Back to Generator
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Pro</h1>
          <p className="text-muted-foreground text-lg">
            Choose the perfect plan for your creative needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              {userCredits !== null && getCurrentPlan(userCredits) === plan.name && (
                <div className="absolute -top-4 right-4 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-muted-foreground">per month</p>
                <p className="text-primary font-semibold mt-2">
                  {plan.credits} credits
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => window.open(plan.paymentLink, "_blank")}
              >
                Subscribe Now
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>All plans renew monthly. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
