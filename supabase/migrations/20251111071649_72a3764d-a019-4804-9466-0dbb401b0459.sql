-- Enable RLS on tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create policies for admins to view all data
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscription plans"
ON public.subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscription plans"
ON public.subscription_plans
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all income history"
ON public.income_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all images"
ON public.images
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to view their own profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view their own subscription plans
CREATE POLICY "Users can view own subscription plan"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view their own images
CREATE POLICY "Users can view own images"
ON public.images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);