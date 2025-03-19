
// Test Runner for CI builds
import { runAllDatabaseTests } from '../utils/testUtils';

// Only run in certain environments or when explicitly called
if (process.env.NODE_ENV === 'test' || process.env.RUN_TESTS) {
  console.log('Starting database tests...');
  
  runAllDatabaseTests()
    .then(results => {
      console.log('Test results:', results);
      
      if (results.connection && results.crud) {
        console.log('All tests passed successfully!');
      } else {
        console.error('Some tests failed!');
        if (!results.connection) console.error('✗ Database connection test failed');
        if (!results.crud) console.error('✗ CRUD operations test failed');
      }
    })
    .catch(error => {
      console.error('Error running tests:', error);
    });
}

export {};
