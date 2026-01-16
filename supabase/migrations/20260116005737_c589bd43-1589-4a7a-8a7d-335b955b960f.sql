-- Create thoughts table
CREATE TABLE public.thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own thoughts"
ON public.thoughts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own thoughts"
ON public.thoughts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own thoughts"
ON public.thoughts FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own thoughts"
ON public.thoughts FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_thoughts_updated_at
BEFORE UPDATE ON public.thoughts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();