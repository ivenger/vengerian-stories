import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-200",
          "border-t-gray-800",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export { Spinner };
