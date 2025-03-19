
import React, { useState } from 'react';
import { runAllDatabaseTests } from '../utils/testUtils';
import { Button } from './ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DatabaseTestRunner: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    connection: boolean | null;
    crud: boolean | null;
  }>({
    connection: null,
    crud: null
  });

  const runTests = async () => {
    setIsRunning(true);
    setResults({
      connection: null,
      crud: null
    });
    
    try {
      const testResults = await runAllDatabaseTests();
      setResults(testResults);
      
      if (testResults.connection && testResults.crud) {
        toast({
          title: "All tests passed",
          description: "Database operations are working correctly",
          variant: "default"
        });
      } else {
        toast({
          title: "Some tests failed",
          description: "Check the console for more details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error running tests:', error);
      toast({
        title: "Test Error",
        description: "An error occurred while running tests. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const renderStatus = (status: boolean | null) => {
    if (status === null) return null;
    return status ? (
      <Check className="text-green-500" size={18} />
    ) : (
      <X className="text-red-500" size={18} />
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">Database Test Runner</h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span>Connection Test</span>
          {isRunning ? <Loader2 className="animate-spin" size={18} /> : renderStatus(results.connection)}
        </div>
        
        <div className="flex items-center justify-between">
          <span>CRUD Operations Test</span>
          {isRunning ? <Loader2 className="animate-spin" size={18} /> : renderStatus(results.crud)}
        </div>
      </div>
      
      <Button 
        onClick={runTests} 
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Tests...
          </>
        ) : (
          'Run Database Tests'
        )}
      </Button>
    </div>
  );
};

export default DatabaseTestRunner;
