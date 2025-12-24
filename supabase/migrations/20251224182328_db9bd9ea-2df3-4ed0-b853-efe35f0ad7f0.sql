-- Create table for email sequences (funnel flows)
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  niche TEXT,
  tone TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual emails in a sequence
CREATE TABLE public.sequence_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  content TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  trigger_type TEXT NOT NULL DEFAULT 'time_delay',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for email builder blocks/templates
CREATE TABLE public.email_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_sequences
CREATE POLICY "Users can view their own sequences" ON public.email_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sequences" ON public.email_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sequences" ON public.email_sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sequences" ON public.email_sequences FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sequence_emails (via sequence ownership)
CREATE POLICY "Users can view emails in their sequences" ON public.sequence_emails FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create emails in their sequences" ON public.sequence_emails FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update emails in their sequences" ON public.sequence_emails FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete emails in their sequences" ON public.sequence_emails FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
);

-- RLS policies for email_blocks
CREATE POLICY "Users can view their own blocks" ON public.email_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own blocks" ON public.email_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blocks" ON public.email_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blocks" ON public.email_blocks FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on email_sequences
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on sequence_emails
CREATE TRIGGER update_sequence_emails_updated_at
  BEFORE UPDATE ON public.sequence_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();