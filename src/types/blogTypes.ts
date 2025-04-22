
// Blog post types that align with our updated Supabase schema
export interface BlogEntry {
  id: string;
  title: string;
  title_language: string[];
  content: string;
  excerpt: string | null;
  date: string;
  language: string[];
  status?: "draft" | "published";
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  translations?: string[]; // Field used in MarkdownEditor
  tags?: string[]; // Added tags field
  user_id?: string; // Added user_id field
}
