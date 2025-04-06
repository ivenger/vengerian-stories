
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "primary";
  label?: string;
}

const Spinner = ({ 
  size = "md", 
  className, 
  variant = "default",
  label
}: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-3 h-3 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  const variantClasses = {
    default: "border-t-gray-800 border-r-gray-300 border-b-gray-300 border-l-gray-800",
    primary: "border-t-blue-600 border-r-blue-200 border-b-blue-200 border-l-blue-600",
  };

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center", 
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-transparent",
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span className="mt-4 text-gray-600 text-sm">{label}</span>
      )}
    </div>
  );
};

export { Spinner };
