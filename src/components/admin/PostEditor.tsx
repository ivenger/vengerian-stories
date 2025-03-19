
import React from 'react';
import { BlogEntry } from '@/types/blogTypes';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MarkdownEditor from '@/components/MarkdownEditor';

interface PostEditorProps {
  post: BlogEntry;
  onSave: (post: BlogEntry) => void;
  onCancel: () => void;
  isFeatured: boolean;
  onFeaturedChange: (checked: boolean) => void;
  selectedImageUrl: string | null;
}

const PostEditor: React.FC<PostEditorProps> = ({
  post,
  onSave,
  onCancel,
  isFeatured,
  onFeaturedChange,
  selectedImageUrl
}) => {
  const imageUploadFormSchema = z.object({
    imageUrl: z.string().url({ message: "Please enter a valid URL." }),
    altText: z.string().min(1, { message: "Alt text must be at least 1 character." }),
  });

  const imageUploadForm = useForm<z.infer<typeof imageUploadFormSchema>>({
    resolver: zodResolver(imageUploadFormSchema),
    defaultValues: {
      imageUrl: selectedImageUrl || "",
      altText: "",
    },
  });

  const onSubmitImageUpload = (values: z.infer<typeof imageUploadFormSchema>) => {
    console.log("Form values:", values);
    // Logic to handle image details
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Post</DialogTitle>
        <DialogDescription>
          Edit the content of the post. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <Form {...imageUploadForm}>
        <form onSubmit={imageUploadForm.handleSubmit(onSubmitImageUpload)} className="space-y-4">
          <FormField
            control={imageUploadForm.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={imageUploadForm.control}
            name="altText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Text</FormLabel>
                <FormControl>
                  <Textarea placeholder="A descriptive text for the image" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center space-x-2">
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={isFeatured}
                  onCheckedChange={onFeaturedChange}
                />
              </FormControl>
              <FormLabel>Featured</FormLabel>
            </FormItem>
          </div>
          <Button type="submit">Save Image Details</Button>
        </form>
      </Form>
      <MarkdownEditor 
        post={post} 
        onSave={(updatedPost) => onSave(updatedPost)} 
        onCancel={onCancel} 
      />
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" onClick={() => onSave(post)}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
};

export default PostEditor;
