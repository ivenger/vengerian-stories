
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OAuthErrorAlertProps {
  error: string | null;
  onRetry: () => void;
}

export const OAuthErrorAlert = ({ error, onRetry }: OAuthErrorAlertProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div>{error}</div>
        <div className="mt-2 text-xs">
          If you're seeing network errors, please:
          <ul className="list-disc pl-5 mt-1">
            <li>Check your internet connection</li>
            <li>Verify redirect URLs are correctly configured in Google Console</li>
            <li>Ensure cookies are enabled in your browser</li>
          </ul>
        </div>
        <div className="mt-3">
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Retry Sign In
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default OAuthErrorAlert;
