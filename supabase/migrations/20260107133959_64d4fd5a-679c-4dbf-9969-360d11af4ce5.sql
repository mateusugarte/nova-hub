-- Add new fields to prospects table
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS faturamento text,
ADD COLUMN IF NOT EXISTS principal_dor text,
ADD COLUMN IF NOT EXISTS nicho text,
ADD COLUMN IF NOT EXISTS nome_dono text,
ADD COLUMN IF NOT EXISTS socios jsonb DEFAULT '[]'::jsonb;

-- Create inbound_leads table for leads that come from forms/marketing
CREATE TABLE public.inbound_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number text,
  instagram_link text,
  email text,
  nome_lead text,
  faturamento text,
  principal_dor text,
  nicho text,
  nome_dono text,
  socios jsonb DEFAULT '[]'::jsonb,
  meeting_date timestamp with time zone,
  status text NOT NULL DEFAULT 'form_filled',
  notes text,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbound_leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inbound_leads
CREATE POLICY "Users can view their own inbound leads"
ON public.inbound_leads
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own inbound leads"
ON public.inbound_leads
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inbound leads"
ON public.inbound_leads
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own inbound leads"
ON public.inbound_leads
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_inbound_leads_updated_at
BEFORE UPDATE ON public.inbound_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();