-- Create table for tracking recurring billing/charges
CREATE TABLE public.implementation_billings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementation_id UUID NOT NULL REFERENCES public.implementations(id) ON DELETE CASCADE,
  billing_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.implementation_billings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view billings of their implementations" 
ON public.implementation_billings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM implementations 
  WHERE implementations.id = implementation_billings.implementation_id 
  AND implementations.user_id = auth.uid()
));

CREATE POLICY "Users can insert billings for their implementations" 
ON public.implementation_billings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM implementations 
  WHERE implementations.id = implementation_billings.implementation_id 
  AND implementations.user_id = auth.uid()
));

CREATE POLICY "Users can update billings of their implementations" 
ON public.implementation_billings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM implementations 
  WHERE implementations.id = implementation_billings.implementation_id 
  AND implementations.user_id = auth.uid()
));

CREATE POLICY "Users can delete billings of their implementations" 
ON public.implementation_billings 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM implementations 
  WHERE implementations.id = implementation_billings.implementation_id 
  AND implementations.user_id = auth.uid()
));