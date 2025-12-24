-- Create email_templates table for favorite templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  content TEXT NOT NULL,
  cta TEXT,
  campaign_type TEXT,
  niche TEXT,
  tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_manuals table for brand settings
CREATE TABLE public.brand_manuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  brand_name TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT DEFAULT '#ffffff',
  heading_font TEXT DEFAULT 'Arial',
  body_font TEXT DEFAULT 'Arial',
  tone TEXT DEFAULT 'casual',
  language_style TEXT,
  key_phrases TEXT[],
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "Users can view their own templates" 
ON public.email_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.email_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.email_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on brand_manuals
ALTER TABLE public.brand_manuals ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_manuals
CREATE POLICY "Users can view their own brand manual" 
ON public.brand_manuals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand manual" 
ON public.brand_manuals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand manual" 
ON public.brand_manuals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand manual" 
ON public.brand_manuals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_manuals_updated_at
BEFORE UPDATE ON public.brand_manuals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();