
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Tabela de tarefas
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL DEFAULT 'other', -- meeting, content, prospecting, steps, other
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    contact_number TEXT,
    lead_source TEXT,
    steps JSONB, -- for multi-step tasks
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tabela de planejamento semanal
CREATE TABLE public.weekly_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_planning ENABLE ROW LEVEL SECURITY;

-- Tabela de ideias de conteúdo
CREATE TABLE public.content_ideas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'feed', -- reels, feed, story
    reference_link TEXT,
    is_posted BOOLEAN DEFAULT false,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

-- Tabela de posts realizados
CREATE TABLE public.posted_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'feed', -- reels, feed, story
    post_link TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'instagram', -- instagram, tiktok, youtube, other
    posted_date DATE NOT NULL,
    content_idea_id uuid REFERENCES public.content_ideas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.posted_content ENABLE ROW LEVEL SECURITY;

-- Tabela de prospects (leads)
CREATE TABLE public.prospects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT,
    instagram_link TEXT,
    profile_summary TEXT,
    contact_summary TEXT,
    approach_description TEXT,
    prospecting_method TEXT[], -- cold_call, instagram, door_to_door
    status TEXT NOT NULL DEFAULT 'follow_up', -- follow_up, scheduled, rejected, converted
    needs_follow_up BOOLEAN DEFAULT false,
    has_meeting_scheduled BOOLEAN DEFAULT false,
    meeting_date TIMESTAMP WITH TIME ZONE,
    was_rejected BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    objections TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Tabela de follow-ups
CREATE TABLE public.follow_ups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    follow_up_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Tabela de templates de tarefas
CREATE TABLE public.task_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    default_duration INTEGER DEFAULT 60,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Weekly planning policies
CREATE POLICY "Users can view their own weekly planning"
ON public.weekly_planning FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own weekly planning"
ON public.weekly_planning FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weekly planning"
ON public.weekly_planning FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own weekly planning"
ON public.weekly_planning FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Content ideas policies
CREATE POLICY "Users can view their own content ideas"
ON public.content_ideas FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own content ideas"
ON public.content_ideas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own content ideas"
ON public.content_ideas FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own content ideas"
ON public.content_ideas FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Posted content policies
CREATE POLICY "Users can view their own posted content"
ON public.posted_content FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own posted content"
ON public.posted_content FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posted content"
ON public.posted_content FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posted content"
ON public.posted_content FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Prospects policies
CREATE POLICY "Users can view their own prospects"
ON public.prospects FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own prospects"
ON public.prospects FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prospects"
ON public.prospects FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own prospects"
ON public.prospects FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Follow-ups policies
CREATE POLICY "Users can view their own follow-ups"
ON public.follow_ups FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own follow-ups"
ON public.follow_ups FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own follow-ups"
ON public.follow_ups FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own follow-ups"
ON public.follow_ups FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Task templates policies
CREATE POLICY "Users can view their own task templates"
ON public.task_templates FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own task templates"
ON public.task_templates FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task templates"
ON public.task_templates FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own task templates"
ON public.task_templates FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_planning_updated_at
BEFORE UPDATE ON public.weekly_planning
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_ideas_updated_at
BEFORE UPDATE ON public.content_ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posted_content_updated_at
BEFORE UPDATE ON public.posted_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at
BEFORE UPDATE ON public.follow_ups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
