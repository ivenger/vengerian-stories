-- Check if the user_roles table contains the correct role for a given user
SELECT * FROM user_roles WHERE user_id = '32820eff-8c80-4fa4-916b-a2116d3e351a';

-- Check if the user_roles table contains any roles for a non-existent user
SELECT * FROM user_roles WHERE user_id = 'non-existent-user-id';

-- Check if the user_roles table handles NULL user IDs
SELECT * FROM user_roles WHERE user_id IS NULL;
