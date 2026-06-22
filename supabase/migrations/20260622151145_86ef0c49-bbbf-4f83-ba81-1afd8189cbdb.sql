CREATE TYPE public.item_kind AS ENUM ('email','summary','plan');

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind public.item_kind NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  starred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own items" ON public.items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX items_user_kind_idx ON public.items (user_id, kind, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER items_touch BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();