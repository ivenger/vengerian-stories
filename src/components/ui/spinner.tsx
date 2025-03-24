
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid",
          "border-t-gray-800 border-r-gray-300 border-b-gray-300 border-l-gray-800",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export { Spinner };
