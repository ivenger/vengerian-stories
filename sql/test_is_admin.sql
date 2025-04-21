-- Test the is_admin function with a valid admin user ID
SELECT is_admin('32820eff-8c80-4fa4-916b-a2116d3e351a');

-- Test the is_admin function with a non-admin user ID
SELECT is_admin('non-admin-user-id');

-- Test the is_admin function with a NULL user ID
SELECT is_admin(NULL);
