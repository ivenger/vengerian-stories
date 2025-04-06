
import React, { useState, useEffect, useRef } from "react";
import { Image, Save, X, FileImage, RefreshCw } from "lucide-react";
import { fetchAboutContent, saveAboutContent } from "../services/aboutService";
import { fetchBucketImages } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "./Navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const AboutEditor: React.FC = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const fetchRetryCount = useRef(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        if (fetchRetryCount.current > 0) {
          console.log(`AboutEditor: Retry attempt ${fetchRetryCount.current} of ${MAX_RETRIES}`);
        } else {
          console.log("AboutEditor: Loading about content");
        }
        
        const data = await fetchAboutContent();
        
        if (!isMountedRef.current) return;
        
        setContent(data.content || "");
        setImageUrl(data.image_url);
        setIsLoading(false);
        fetchRetryCount.current = 0;
        console.log("AboutEditor: About content loaded successfully");
      } catch (error) {
        console.error("AboutEditor: Error loading about content:", error);
        
        if (!isMountedRef.current) return;
        
        if (fetchRetryCount.current < MAX_RETRIES) {
          // Retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, fetchRetryCount.current), 5000);
          fetchRetryCount.current += 1;
          
          console.log(`AboutEditor: Retrying in ${retryDelay}ms (attempt ${fetchRetryCount.current}/${MAX_RETRIES})`);
          setLoadError(`Loading failed. Retrying in ${Math.round(retryDelay/1000)} seconds...`);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              loadAboutContent();
            }
          }, retryDelay);
        } else {
          // Max retries reached
          setLoadError("Failed to load about content. Please try again later.");
          setIsLoading(false);
          
          toast({
            title: "Error",
            description: "Failed to load about content after multiple attempts.",
            variant: "destructive"
          });
        }
      }
    };

    loadAboutContent();
  }, [toast]);

  const loadBucketImages = async () => {
    try {
      setIsLoadingImages(true);
      console.log("AboutEditor: Loading images from bucket");
      const images = await fetchBucketImages();
      if (!isMountedRef.current) return;
      
      setAvailableImages(images);
      console.log("AboutEditor: Loaded", images.length, "images from bucket");
    } catch (error) {
      console.error("AboutEditor: Error loading bucket images:", error);
      if (!isMountedRef.current) return;
      
      toast({
        title: "Error",
        description: "Failed to load images. Please try again later.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoadingImages(false);
      }
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      console.log("AboutEditor: Saving about content");
      
      await saveAboutContent({ 
        content: content,
        image_url: imageUrl
      });
      
      if (!isMountedRef.current) return;
      
      console.log("AboutEditor: About content saved successfully");
      toast({
        title: "Success",
        description: "About content saved successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("AboutEditor: Error saving about content:", error);
      
      if (!isMountedRef.current) return;
      
      toast({
        title: "Error",
        description: "Failed to save about content. Please try again later.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  const handleSelectImage = (url: string) => {
    setImageUrl(url);
    toast({
      title: "Image Selected",
      description: "The image has been selected. Don't forget to save your changes.",
    });
  };

  const handleRetry = () => {
    fetchRetryCount.current = 0;
    setIsLoading(true);
    setLoadError(null);
    
    // Using setTimeout to give visual feedback that retry was clicked
    setTimeout(() => {
      if (isMountedRef.current) {
        const loadAboutContent = async () => {
          try {
            console.log("AboutEditor: Retrying content load");
            const data = await fetchAboutContent();
            
            if (!isMountedRef.current) return;
            
            setContent(data.content || "");
            setImageUrl(data.image_url);
            setIsLoading(false);
            console.log("AboutEditor: About content loaded successfully on retry");
          } catch (error) {
            console.error("AboutEditor: Error on retry:", error);
            
            if (!isMountedRef.current) return;
            
            setLoadError("Failed to load content. Please try again.");
            setIsLoading(false);
            
            toast({
              title: "Error",
              description: "Failed to load about content on retry.",
              variant: "destructive"
            });
          }
        };
        
        loadAboutContent();
      }
    }, 500);
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-64">
            <Spinner 
              size="lg" 
              label={loadError ? loadError : "Loading content..."}
            />
            
            {loadError && !loadError.includes("Retrying") && (
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="mt-6 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Edit About Page</h2>
            <div className="flex space-x-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center"
                disabled={isSaving}
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                className="flex items-center bg-gray-900 hover:bg-gray-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the content for the About page..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[300px] focus:outline-none focus:ring-2 focus:ring-gray-200"
              rows={15}
              disabled={isSaving}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <Image size={16} className="mr-1" />
                Featured Image
              </div>
            </label>
            
            <div className="flex items-center space-x-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center"
                    onClick={loadBucketImages}
                    disabled={isSaving}
                  >
                    <FileImage size={16} className="mr-1" />
                    Choose from Storage
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Select Image</SheetTitle>
                    <SheetDescription>
                      Choose an image from your Supabase storage.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                    {isLoadingImages ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : availableImages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No images available. Upload some images first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {availableImages.map((url, index) => (
                          <div
                            key={index}
                            className="relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleSelectImage(url)}
                          >
                            <img
                              src={url}
                              alt={`Storage image ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <input
                type="text"
                value={imageUrl || ""}
                onChange={(e) => setImageUrl(e.target.value || null)}
                placeholder="Or enter image URL manually"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={isSaving}
              />
            </div>
          </div>

          {imageUrl && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Image Preview:</h3>
              <img
                src={imageUrl}
                alt="Featured"
                className="max-w-full max-h-[300px] object-contain rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutEditor;
