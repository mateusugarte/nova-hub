-- 1. Create implementation_prompts table for storing prompts per implementation
CREATE TABLE public.implementation_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementation_id UUID NOT NULL REFERENCES public.implementations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.implementation_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (access through parent implementation ownership)
CREATE POLICY "Users can view prompts of their implementations"
  ON public.implementation_prompts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM implementations
    WHERE implementations.id = implementation_prompts.implementation_id
    AND implementations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert prompts for their implementations"
  ON public.implementation_prompts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM implementations
    WHERE implementations.id = implementation_prompts.implementation_id
    AND implementations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update prompts of their implementations"
  ON public.implementation_prompts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM implementations
    WHERE implementations.id = implementation_prompts.implementation_id
    AND implementations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete prompts of their implementations"
  ON public.implementation_prompts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM implementations
    WHERE implementations.id = implementation_prompts.implementation_id
    AND implementations.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_implementation_prompts_updated_at
  BEFORE UPDATE ON public.implementation_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. FIX SECURITY ISSUES

-- Fix profiles table - restrict to own profile only
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Fix operacoes table - restrict to own operations
DROP POLICY IF EXISTS "Authenticated users can view all operations" ON public.operacoes;
DROP POLICY IF EXISTS "Authenticated users can insert operations" ON public.operacoes;
DROP POLICY IF EXISTS "Authenticated users can update all operations" ON public.operacoes;
DROP POLICY IF EXISTS "Authenticated users can delete all operations" ON public.operacoes;

CREATE POLICY "Users can view their own operations"
  ON public.operacoes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own operations"
  ON public.operacoes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own operations"
  ON public.operacoes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own operations"
  ON public.operacoes FOR DELETE
  USING (user_id = auth.uid());

-- Fix usuarios table - restrict to own data
DROP POLICY IF EXISTS "Authenticated users can view usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can update usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can delete usuarios" ON public.usuarios;

-- Create a more secure approach - only allow access through edge functions
-- For now, disable all direct access since this is sensitive PII data
CREATE POLICY "No direct access to usuarios"
  ON public.usuarios FOR SELECT
  USING (false);

CREATE POLICY "No direct insert to usuarios"
  ON public.usuarios FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update to usuarios"
  ON public.usuarios FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete to usuarios"
  ON public.usuarios FOR DELETE
  USING (false);

-- Fix usuarios_crm table - add basic policies for users to manage their own credentials
CREATE POLICY "Users can view their own CRM credentials"
  ON public.usuarios_crm FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own CRM credentials"
  ON public.usuarios_crm FOR UPDATE
  USING (id = auth.uid());