
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid",
          "border-t-blue-600 border-r-gray-300 border-b-gray-300 border-l-blue-600",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export { Spinner };
