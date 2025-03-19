
import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";

/**
 * Database Test Utility
 * 
 * This utility provides functions for testing database operations with Supabase.
 */

// Connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('entries').select('id').limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test passed');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};

// Test CRUD operations
export const testCRUDOperations = async (): Promise<boolean> => {
  try {
    // Test post
    const testPost: Partial<BlogEntry> = {
      title: `Test Post ${new Date().toISOString()}`,
      content: 'This is a test post content',
      excerpt: 'Test excerpt',
      date: new Date().toLocaleDateString(),
      language: ['English'],
      title_language: ['en'],
      status: 'draft',
      tags: ['test', 'automation']
    };
    
    // Create
    console.log('Testing CREATE operation...');
    const { data: createdPost, error: createError } = await supabase
      .from('entries')
      .insert(testPost)
      .select()
      .maybeSingle();
    
    if (createError || !createdPost) {
      console.error('CREATE test failed:', createError);
      return false;
    }
    
    const testId = createdPost.id;
    console.log(`CREATE test passed. Created post with ID: ${testId}`);
    
    // Read
    console.log('Testing READ operation...');
    const { data: readPost, error: readError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', testId)
      .maybeSingle();
    
    if (readError || !readPost) {
      console.error('READ test failed:', readError);
      return false;
    }
    
    console.log('READ test passed');
    
    // Update
    console.log('Testing UPDATE operation...');
    const updatedTitle = `Updated Test Post ${new Date().toISOString()}`;
    const { data: updatedPost, error: updateError } = await supabase
      .from('entries')
      .update({ title: updatedTitle })
      .eq('id', testId)
      .select()
      .maybeSingle();
    
    if (updateError || !updatedPost || updatedPost.title !== updatedTitle) {
      console.error('UPDATE test failed:', updateError);
      return false;
    }
    
    console.log('UPDATE test passed');
    
    // Test translations array
    console.log('Testing translations array...');
    const { data: translationsPost, error: translationsError } = await supabase
      .from('entries')
      .update({ translations: ['test-id-1', 'test-id-2'] })
      .eq('id', testId)
      .select()
      .maybeSingle();
    
    if (translationsError || !translationsPost || !translationsPost.translations) {
      console.error('Translations test failed:', translationsError);
      return false;
    }
    
    console.log('Translations test passed');
    
    // Delete
    console.log('Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .eq('id', testId);
    
    if (deleteError) {
      console.error('DELETE test failed:', deleteError);
      return false;
    }
    
    console.log('DELETE test passed');
    
    return true;
  } catch (error) {
    console.error('CRUD test error:', error);
    return false;
  }
};

// Run all tests
export const runAllDatabaseTests = async (): Promise<{
  connection: boolean;
  crud: boolean;
}> => {
  const connectionResult = await testDatabaseConnection();
  const crudResult = await testCRUDOperations();
  
  return {
    connection: connectionResult,
    crud: crudResult
  };
};
