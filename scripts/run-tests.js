
/**
 * Database CI Tests
 * This script runs automated database tests during build
 */

const { testDatabaseConnection, testCRUDOperations } = require('../src/utils/testUtils');

const runTests = async () => {
  console.log('Running database tests...');
  
  try {
    // Test database connection
    const connectionResult = await testDatabaseConnection();
    console.log(`Database connection test: ${connectionResult ? 'PASSED' : 'FAILED'}`);
    
    // Test CRUD operations
    const crudResult = await testCRUDOperations();
    console.log(`CRUD operations test: ${crudResult ? 'PASSED' : 'FAILED'}`);
    
    // Exit with appropriate code
    if (connectionResult && crudResult) {
      console.log('All tests passed!');
      process.exit(0);
    } else {
      console.log('Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
};

runTests();
