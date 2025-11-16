-- Supabase Database Schema for 360Auto MVP
-- Run these SQL commands in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE public.cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  location TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_cars_user_id ON public.cars(user_id);
CREATE INDEX idx_cars_created_at ON public.cars(created_at DESC);
CREATE INDEX idx_cars_brand_model ON public.cars(brand, model);
CREATE INDEX idx_cars_location ON public.cars(location);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('car-videos', 'car-videos', true),
  ('car-images', 'car-images', true);

-- Row Level Security Policies

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cars policies
CREATE POLICY "Anyone can view cars" ON public.cars
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own cars" ON public.cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars" ON public.cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars" ON public.cars
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for car-videos bucket
CREATE POLICY "Anyone can view car videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-videos');

CREATE POLICY "Users can upload their own car videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own car videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'car-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own car videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for car-images bucket
CREATE POLICY "Anyone can view car images" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

CREATE POLICY "Users can upload their own car images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own car images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'car-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own car images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment counters
CREATE OR REPLACE FUNCTION increment_car_counter(
  car_id UUID,
  counter_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF counter_type = 'views' THEN
    UPDATE public.cars SET views = views + 1 WHERE id = car_id;
  ELSIF counter_type = 'likes' THEN
    UPDATE public.cars SET likes = likes + 1 WHERE id = car_id;
  ELSIF counter_type = 'saves' THEN
    UPDATE public.cars SET saves = saves + 1 WHERE id = car_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.cars TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
