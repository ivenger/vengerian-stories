
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "./AuthProvider";

interface FilterDialogProps {
  allTags: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  hasActiveFilters?: boolean;
  showUnreadOnly?: boolean;
  toggleUnreadFilter?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  allTags,
  selectedTags,
  toggleTag,
  clearFilters,
  hasActiveFilters = false,
  showUnreadOnly = false,
  toggleUnreadFilter,
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Use controlled or uncontrolled open state based on what's provided
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  const handleTagToggle = (tag: string) => {
    toggleTag(tag);
  };
  
  const handleClearFilters = () => {
    clearFilters();
    setIsOpen(false); // Close dialog after clearing
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={hasActiveFilters ? "border-blue-300 bg-blue-50 text-blue-700" : ""}
        >
          <Filter size={16} className="mr-2" />
          {hasActiveFilters ? "Filters Active" : "Filter Stories"}
          {hasActiveFilters && (
            <Badge className="ml-2 bg-blue-200 text-blue-800 hover:bg-blue-200">
              {selectedTags.length + (showUnreadOnly ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Stories</DialogTitle>
        </DialogHeader>
          
        <div className="py-4 space-y-4">
          {allTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">By Tag</h3>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {user && toggleUnreadFilter && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="unread-filter" className="text-sm font-medium">Show Unread Only</Label>
                  <p className="text-xs text-gray-500">Only display stories you haven't read yet</p>
                </div>
                <Switch 
                  id="unread-filter" 
                  checked={showUnreadOnly}
                  onCheckedChange={toggleUnreadFilter}
                />
              </div>
            </>
          )}
        </div>
          
        <DialogFooter className="sm:justify-between">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}
          <Button 
            type="button" 
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
