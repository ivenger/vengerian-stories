
import { BlogEntry } from "../types/blogTypes";

// This file is kept for backward compatibility, but we'll 
// be fetching data from Supabase instead of using this static data
export type BlogPost = BlogEntry;

// Empty array as we're now using Supabase for data storage
export const blogPosts: BlogPost[] = [];
