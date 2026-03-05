
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE public.transactions (
  id TEXT PRIMARY KEY,
  user_id_field TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  location_name TEXT NOT NULL,
  location_country TEXT NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  device_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'safe',
  risk_factors JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read transactions (dashboard is public)
CREATE POLICY "Anyone can read transactions"
  ON public.transactions FOR SELECT
  USING (true);

-- Anon can insert transactions (simulator runs without auth)
CREATE POLICY "Anon can insert transactions"
  ON public.transactions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated can insert transactions
CREATE POLICY "Authenticated can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update transaction status
CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_risk_level ON public.transactions(risk_level);
CREATE INDEX idx_transactions_status ON public.transactions(status);
