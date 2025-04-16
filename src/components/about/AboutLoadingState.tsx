
import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from "lucide-react";

interface AboutLoadingStateProps {
  error: string | null;
  onRetry: () => void;
}

const AboutLoadingState: React.FC<AboutLoadingStateProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col justify-center items-center h-64">
      <Spinner 
        size="lg" 
        label={error ? error : "Loading content..."}
      />
      
      {error && !error.includes("Retrying") && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="mt-6 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default AboutLoadingState;
