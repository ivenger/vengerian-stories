
import { supabase } from "@/integrations/supabase/client";
import { BlogEntry } from "@/types/blogTypes";
import { sanitizeHtml } from "../utils/sanitizeUtils";

// Cache for admin role checks
const adminRoleCheckCache = new Map<string, { timestamp: number, isAdmin: boolean }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchAllPosts = async (): Promise<BlogEntry[]> => {
  console.log('Fetching all posts as admin');
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error('No user ID found when checking admin role');
      throw new Error('Authentication required');
    }

    const cachedRole = adminRoleCheckCache.get(userId);
    if (cachedRole && (Date.now() - cachedRole.timestamp < CACHE_DURATION)) {
      if (!cachedRole.isAdmin) {
        throw new Error('Not authorized to view all posts');
      }
    } else {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('role', 'admin')
        .single();

      if (rolesError || !roles) {
        console.error('Error verifying admin role:', rolesError);
        adminRoleCheckCache.set(userId, { timestamp: Date.now(), isAdmin: false });
        throw new Error('Not authorized to view all posts');
      }

      adminRoleCheckCache.set(userId, { timestamp: Date.now(), isAdmin: true });
    }

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all posts:', error);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
    
    const sanitizedData = data?.map(post => ({
      ...post,
      title: sanitizeHtml(post.title),
      content: sanitizeHtml(post.content),
      excerpt: post.excerpt ? sanitizeHtml(post.excerpt) : null
    })) || [];
    
    console.log(`Successfully fetched ${sanitizedData.length} posts as admin`);
    return sanitizedData as BlogEntry[];
  } catch (error: any) {
    console.error('Failed to fetch all posts:', error);
    throw new Error(error.message || 'Failed to load posts');
  }
};
