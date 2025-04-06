import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { fetchAboutContent, saveAboutContent } from '../services/aboutService';
import AboutEditor from '../components/AboutEditor';
import { useAuth } from '../components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRequest } from '@/hooks/useSupabaseRequest';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const About = () => {
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const {
    execute: fetchContent,
    loading,
    error,
    data: aboutData
  } = useSupabaseRequest(
    () => fetchAboutContent(),
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load about content. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  const {
    execute: saveContent,
    loading: isSaving,
    error: saveError
  } = useSupabaseRequest(
    () => saveAboutContent(content, imageUrl),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Content saved successfully"
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save content. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (aboutData) {
      setContent(aboutData.content);
      setImageUrl(aboutData.image_url);
    }
  }, [aboutData]);

  const handleSave = async () => {
    await saveContent();
  };

  const handleCancel = () => {
    if (aboutData) {
      setContent(aboutData.content);
      setImageUrl(aboutData.image_url);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About</h1>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {isAdmin ? (
              <div className="space-y-4">
                <AboutEditor
                  content={content}
                  imageUrl={imageUrl}
                  onContentChange={setContent}
                  onImageChange={setImageUrl}
                  disabled={isSaving}
                />
                <div className="flex gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || loading}
                  >
                    {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving || loading}
                  >
                    Cancel
                  </Button>
                </div>
                {saveError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="prose max-w-none">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="About page"
                    className="w-full max-w-2xl mx-auto mb-6 rounded-lg shadow-lg"
                  />
                )}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
