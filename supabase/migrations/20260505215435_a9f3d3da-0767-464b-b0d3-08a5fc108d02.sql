
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX clients_user_id_idx ON public.clients(user_id);
CREATE POLICY "own clients select" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own clients insert" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own clients update" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own clients delete" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Haircuts
CREATE TABLE public.haircuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cut_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_courtesy BOOLEAN NOT NULL DEFAULT false,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.haircuts ENABLE ROW LEVEL SECURITY;
CREATE INDEX haircuts_user_id_idx ON public.haircuts(user_id);
CREATE INDEX haircuts_client_id_idx ON public.haircuts(client_id);
CREATE INDEX haircuts_cut_date_idx ON public.haircuts(cut_date);
CREATE POLICY "own haircuts select" ON public.haircuts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own haircuts insert" ON public.haircuts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own haircuts update" ON public.haircuts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own haircuts delete" ON public.haircuts FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
