-- Test the is_admin RPC call with a valid admin user ID
SELECT * FROM rpc('is_admin', user_id => '32820eff-8c80-4fa4-916b-a2116d3e351a');

-- Test the is_admin RPC call with a non-admin user ID
SELECT * FROM rpc('is_admin', user_id => 'non-admin-user-id');

-- Test the is_admin RPC call with a NULL user ID
SELECT * FROM rpc('is_admin', user_id => NULL);
