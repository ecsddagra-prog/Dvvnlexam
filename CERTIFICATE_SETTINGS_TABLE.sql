-- Create certificate_settings table
CREATE TABLE IF NOT EXISTS public.certificate_settings (
  id integer NOT NULL DEFAULT 1,
  page_size character varying(10) DEFAULT 'A4'::character varying,
  orientation character varying(20) DEFAULT 'portrait'::character varying,
  margins jsonb DEFAULT '{"top": 50, "bottom": 50, "left": 50, "right": 50}'::jsonb,
  custom_width numeric,
  custom_height numeric,
  logo_url text,
  logo_position character varying(20) DEFAULT 'top-center'::character varying,
  logo_width integer DEFAULT 150,
  logo_height integer DEFAULT 80,
  signature_url text,
  signature_position character varying(20) DEFAULT 'bottom-center'::character varying,
  signature_width integer DEFAULT 120,
  signature_height integer DEFAULT 60,
  title text DEFAULT 'CERTIFICATE OF COMPLETION'::text,
  subtitle text DEFAULT 'This is to certify that'::text,
  recipient_text text DEFAULT '{employee_name}'::text,
  achievement_text text DEFAULT 'has successfully completed the'::text,
  exam_text text DEFAULT '{exam_title}'::text,
  score_text text DEFAULT 'with a score of {percentage}%'::text,
  rank_text text DEFAULT 'Rank: {rank}'::text,
  date_text text DEFAULT 'Date: {date}'::text,
  signature_text text DEFAULT 'Authorized Signature'::text,
  title_font character varying(50) DEFAULT 'Arial'::character varying,
  title_size integer DEFAULT 24,
  title_color character varying(10) DEFAULT '#000000'::character varying,
  body_font character varying(50) DEFAULT 'Arial'::character varying,
  body_size integer DEFAULT 14,
  body_color character varying(10) DEFAULT '#333333'::character varying,
  background_color character varying(10) DEFAULT '#ffffff'::character varying,
  border_color character varying(10) DEFAULT '#000000'::character varying,
  accent_color character varying(10) DEFAULT '#0066cc'::character varying,
  show_border boolean DEFAULT true,
  show_signature boolean DEFAULT true,
  show_date boolean DEFAULT true,
  show_score boolean DEFAULT true,
  show_rank boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT certificate_settings_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_settings_id_check CHECK (id = 1)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_certificate_settings_id ON public.certificate_settings(id);

-- Insert default settings
INSERT INTO public.certificate_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.certificate_settings TO authenticated;
GRANT ALL ON public.certificate_settings TO service_role;
