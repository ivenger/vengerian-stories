
// Blog post types that align with our Supabase schema
export interface BlogEntry {
  id: string;
  title: string;
  title_language: string[];
  content: string | Record<string, string>;
  date: string;
  language: string[];
  status?: "draft" | "published";
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  excerpt?: string; // Add excerpt field used in the UI
  translations?: string[]; // Add translations field used in MarkdownEditor
}

// Helper type for blog content
export type BlogContent = string | Record<string, string>;
