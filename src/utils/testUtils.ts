
import { supabase } from '../integrations/supabase/client';
import { BlogEntry } from '../types/blogTypes';

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simplest query to test connection
    const { data, error } = await supabase.from('entries').select('id').limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
    
    console.log('Database connection successful, received:', data);
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};

export const testCRUDOperations = async (): Promise<boolean> => {
  try {
    // Generate a unique test ID
    const testId = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a test entry
    const testEntry: Required<Pick<BlogEntry, 'title' | 'content' | 'language' | 'title_language' | 'date'>> = {
      title: `Test Entry ${testId}`,
      content: `This is a test entry with ID ${testId}`,
      language: ['en'],
      title_language: ['en'],
      date: new Date().toISOString()
    };
    
    // Insert test data
    const { data: insertData, error: insertError } = await supabase
      .from('entries')
      .insert(testEntry)
      .select();
    
    if (insertError) {
      console.error('CRUD test - Insert failed:', insertError.message);
      return false;
    }
    
    if (!insertData || insertData.length === 0) {
      console.error('CRUD test - Insert did not return data');
      return false;
    }
    
    const insertedId = insertData[0].id;
    console.log('CRUD test - Insert successful:', insertedId);
    
    // Read the inserted data
    const { data: readData, error: readError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', insertedId)
      .single();
    
    if (readError || !readData) {
      console.error('CRUD test - Read failed:', readError?.message);
      return false;
    }
    
    console.log('CRUD test - Read successful:', readData.id);
    
    // Update the data
    const { error: updateError } = await supabase
      .from('entries')
      .update({ content: `Updated content for ${testId}` })
      .eq('id', insertedId);
    
    if (updateError) {
      console.error('CRUD test - Update failed:', updateError.message);
      return false;
    }
    
    console.log('CRUD test - Update successful');
    
    // Delete the test data
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .eq('id', insertedId);
    
    if (deleteError) {
      console.error('CRUD test - Delete failed:', deleteError.message);
      return false;
    }
    
    console.log('CRUD test - Delete successful');
    
    return true;
  } catch (error) {
    console.error('CRUD test error:', error);
    return false;
  }
};

export const runAllDatabaseTests = async (): Promise<{
  connection: boolean;
  crud: boolean;
}> => {
  const connectionResult = await testDatabaseConnection();
  // Only run CRUD tests if connection is successful
  const crudResult = connectionResult ? await testCRUDOperations() : false;
  
  return {
    connection: connectionResult,
    crud: crudResult,
  };
};
