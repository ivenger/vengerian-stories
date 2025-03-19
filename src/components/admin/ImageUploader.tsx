
import React, { useState } from 'react';
import { 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/services/imageService";

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  availableImages: string[];
  onImageSelect: (imageUrl: string) => void;
  isLoadingImages: boolean;
  refreshImages: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  isOpen,
  onClose,
  availableImages,
  onImageSelect,
  isLoadingImages,
  refreshImages
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      await uploadImage(selectedImage);
      refreshImages();
      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      });
      onClose();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getImageFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Select an image from your computer to upload.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={uploading}
        />
        {selectedImage && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="image-name">
              Selected Image:
            </Label>
            <span>{selectedImage.name}</span>
          </div>
        )}
        
        {isLoadingImages ? (
          <div className="py-2 text-sm text-gray-500">Loading images...</div>
        ) : (
          availableImages.length > 0 && (
            <div>
              <Label>Or select an existing image:</Label>
              <Select onValueChange={onImageSelect}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select an image from storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableImages.map((url) => (
                      <SelectItem key={url} value={url}>
                        {getImageFileName(url)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default ImageUploader;
