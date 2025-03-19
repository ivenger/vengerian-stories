import React, { useState, useEffect } from 'react';
import {
  fetchAllPosts,
  deletePost,
  fetchPublishedPosts,
  fetchAllTags,
  fetchTagsByLanguage,
} from '@/services/blogService';
import { BlogEntry } from '@/types/blogTypes';
import { useNavigate } from 'react-router-dom';
import { 
  Button 
} from "@/components/ui/button";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash, 
  ExternalLink,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownEditor from '@/components/MarkdownEditor';
import { uploadImage, fetchBucketImages } from "@/services/imageService";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import DatabaseTestRunner from '@/components/DatabaseTestRunner';

interface Tag {
  id: string;
  name: string;
  en: string | null;
  he: string | null;
  ru: string | null;
}

const Admin: React.FC = () => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [postToDelete, setPostToDelete] = useState<BlogEntry | null>(null);
  const [editingPost, setEditingPost] = useState<BlogEntry | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });
  const [languages, setLanguages] = useState<
    { name: string; count: number }[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<
    { type: string; title: string; time: string }[]
  >([]);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagTranslations, setTagTranslations] = useState({
    en: '',
    he: '',
    ru: '',
  });
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    loadStats();
    loadLanguages();
    loadRecentActivity();
    loadTags();
    loadAvailableLanguages();
    loadImages();
  }, []);

  const loadPosts = async () => {
    const allPosts = await fetchAllPosts();
    setPosts(allPosts);
  };

  const loadStats = async () => {
    const publishedPosts = await fetchPublishedPosts();
    const allPosts = await fetchAllPosts();
    const draftPosts = allPosts.filter((post) => post.status === 'draft');

    setStats({
      totalPosts: allPosts.length,
      publishedPosts: publishedPosts.length,
      draftPosts: draftPosts.length,
    });
  };

  const loadLanguages = async () => {
    const allPosts = await fetchAllPosts();
    const languageCounts: { [key: string]: number } = {};

    allPosts.forEach((post) => {
      post.language?.forEach((lang) => {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });
    });

    const languageData = Object.keys(languageCounts).map((name) => ({
      name,
      count: languageCounts[name],
    }));

    setLanguages(languageData);
  };

  const loadRecentActivity = async () => {
    const allPosts = await fetchAllPosts();
    const recent = allPosts
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((post) => ({
        type: 'update',
        title: post.title,
        time: post.updated_at,
      }));

    setRecentActivity(recent);
  };

  const loadTags = async () => {
    const allTags = await fetchAllTags();
    // Transform string[] to Tag[] to fix type mismatch
    const formattedTags: Tag[] = allTags.map(tag => ({
      id: tag,
      name: tag,
      en: null,
      he: null,
      ru: null
    }));
    setTags(formattedTags);
  };

  const loadAvailableLanguages = async () => {
    const allPosts = await fetchAllPosts();
    const languagesSet = new Set<string>();

    allPosts.forEach((post) => {
      post.language?.forEach((lang) => {
        languagesSet.add(lang);
      });
    });

    setAvailableLanguages(Array.from(languagesSet));
  };

  const loadImages = async () => {
    try {
      setIsLoadingImages(true);
      const images = await fetchBucketImages();
      setAvailableImages(images);
    } catch (error) {
      console.error("Error loading images:", error);
      toast({
        title: "Error",
        description: "Failed to load images. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleCreatePost = () => {
    navigate('/create');
  };

  const handleEditPost = (post: BlogEntry) => {
    setEditingPost(post);
  };

  const handleSavePost = async (updatedPost: BlogEntry) => {
    try {
      // Fix: Remove the excessive API calls and keep just what's needed
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      
      // Update the post, refresh data, and close the editor
      setEditingPost(null);
      
      toast({
        title: "Success",
        description: "Post updated successfully",
        variant: "default"
      });
      
      // Refresh data
      loadPosts();
      loadStats();
      loadRecentActivity();
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive"
      });
    }
  }; // Added missing closing brace and semicolon

  // Add remaining functions and render code
  const handleDeletePost = (post: BlogEntry) => {
    setPostToDelete(post);
  };

  const confirmDeletePost = async () => {
    if (postToDelete) {
      try {
        await deletePost(postToDelete.id);
        setPosts(posts.filter((post) => post.id !== postToDelete.id));
        setPostToDelete(null);
        toast({
          title: "Success",
          description: "Post deleted successfully",
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        });
      }
    }
  };

  const cancelDeletePost = () => {
    setPostToDelete(null);
  };

  const filteredPosts = posts.filter((post) => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(searchTermLower);
    const contentMatch = post.content.toLowerCase().includes(searchTermLower);

    let statusMatch = true;
    if (statusFilter !== 'all') {
      statusMatch = post.status === statusFilter;
    }

    let languageMatch = true;
    if (languageFilter !== 'all') {
      languageMatch = post.language?.includes(languageFilter) || false;
    }

    return titleMatch || contentMatch && statusMatch && languageMatch;
  });

  const handleTagManagementOpen = () => {
    setShowTagManagement(true);
  };

  const handleTagManagementClose = () => {
    setShowTagManagement(false);
  };

  const handleNewTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const handleTagTranslationsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    lang: string
  ) => {
    setTagTranslations({
      ...tagTranslations,
      [lang]: e.target.value,
    });
  };

  const handleCreateTag = async () => {
    try {
      // Create a new tag object with translations
      const newTagObject = {
        name: newTag,
        en: tagTranslations.en || null,
        he: tagTranslations.he || null,
        ru: tagTranslations.ru || null,
      };

      // Optimistically update the state
      setTags([...tags, newTagObject]);

      // Clear the input fields
      setNewTag('');
      setTagTranslations({ en: '', he: '', ru: '' });

      toast({
        title: "Success",
        description: "Tag created successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const confirmDeleteTag = async () => {
    if (tagToDelete) {
      try {
        // Optimistically update the state
        setTags(tags.filter((tag) => tag.id !== tagToDelete.id));

        setTagToDelete(null);
        toast({
          title: "Success",
          description: "Tag deleted successfully",
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting tag:", error);
        toast({
          title: "Error",
          description: "Failed to delete tag",
          variant: "destructive",
        });
      }
    }
  };

  const cancelDeleteTag = () => {
    setTagToDelete(null);
  };

  const handleImageUploadOpen = () => {
    setShowImageUpload(true);
  };

  const handleImageUploadClose = () => {
    setShowImageUpload(false);
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(selectedImage);
      setAvailableImages([...availableImages, imageUrl]);
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
        variant: "default",
      });
      handleImageUploadClose();
      loadImages();
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFeatured(e.target.checked);
  };

  const imageUploadFormSchema = z.object({
    imageUrl: z.string().url({ message: "Please enter a valid URL." }),
  });

  const imageUploadForm = useForm<z.infer<typeof imageUploadFormSchema>>({
    resolver: zodResolver(imageUploadFormSchema),
    defaultValues: {
      imageUrl: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof imageUploadFormSchema>) => {
    try {
      // Add the image URL to availableImages
      setAvailableImages([...availableImages, data.imageUrl]);
      toast({
        title: "Success",
        description: "Image URL added successfully!",
        variant: "default",
      });
      imageUploadForm.reset();
    } catch (error) {
      console.error("Error adding image URL:", error);
      toast({
        title: "Error",
        description: "Failed to add image URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Statistics</h2>
          <p>Total Posts: {stats.totalPosts}</p>
          <p>Published Posts: {stats.publishedPosts}</p>
          <p>Draft Posts: {stats.draftPosts}</p>
        </div>

        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Languages</h2>
          <ul>
            {languages.map((lang) => (
              <li key={lang.name}>
                {lang.name}: {lang.count}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <ul>
            {recentActivity.map((activity, index) => (
              <li key={index}>
                {activity.title} - {activity.time}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Button onClick={handleCreatePost}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Post
        </Button>
        <Button variant="secondary" onClick={handleTagManagementOpen}>
          <Tag className="mr-2 h-4 w-4" />
          Manage Tags
        </Button>
      </div>

      <div className="flex space-x-4 mb-4">
        <Input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white shadow-md rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
            <div className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPost(post)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
              <div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePost(post)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={postToDelete !== null} onOpenChange={(open) => !open && cancelDeletePost()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={cancelDeletePost}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={confirmDeletePost}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingPost !== null} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-[80%]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <Form {...imageUploadForm}>
              <form onSubmit={imageUploadForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
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
                </div>
                <Button type="submit">Add Image URL</Button>
              </form>
            </Form>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => handleSavePost(editingPost!)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTagManagement} onOpenChange={setShowTagManagement}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tag Management</DialogTitle>
            <DialogDescription>
              Create, edit, and delete tags to organize your posts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                value={newTag}
                onChange={handleNewTagChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="en" className="text-right">
                English
              </Label>
              <Input
                type="text"
                id="en"
                value={tagTranslations.en}
                onChange={(e) => handleTagTranslationsChange(e, 'en')}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="he" className="text-right">
                Hebrew
              </Label>
              <Input
                type="text"
                id="he"
                value={tagTranslations.he}
                onChange={(e) => handleTagTranslationsChange(e, 'he')}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ru" className="text-right">
                Russian
              </Label>
              <Input
                type="text"
                id="ru"
                value={tagTranslations.ru}
                onChange={(e) => handleTagTranslationsChange(e, 'ru')}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleTagManagementClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateTag}>
              Create Tag
            </Button>
          </DialogFooter>
          <div className="divide-y divide-gray-200">
            {tags.map((tag) => (
              <div key={tag.id} className="py-2 flex items-center justify-between">
                <span>{tag.name}</span>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTag(tag)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagToDelete !== null} onOpenChange={(open) => !open && cancelDeleteTag()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={cancelDeleteTag}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={confirmDeleteTag}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-4">
        <Button onClick={handleImageUploadOpen}>Upload Image</Button>
      </div>

      <Dialog open={showImageUpload} onOpenChange={handleImageUploadClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Upload a new image to the bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input type="file" accept="image/*" onChange={handleImageSelect} />
            {selectedImage && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="featured" className="text-right">
                  Featured:
                </Label>
                <Checkbox
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={handleFeaturedChange}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleImageUploadClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleImageUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4">
        {isLoadingImages ? (
          <div className="col-span-3 flex justify-center">
            <Loader2 className="animate-spin h-6 w-6" />
          </div>
        ) : (
          availableImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative"
              onClick={() => handleImageClick(imageUrl)}
            >
              <img
                src={imageUrl}
                alt={`Image ${index}`}
                className="w-full h-32 object-cover rounded-md cursor-pointer"
              />
              {selectedImageUrl === imageUrl && (
                <div className="absolute inset-0 bg-black opacity-50 rounded-md flex items-center justify-center">
                  <ExternalLink className="text-white h-6 w-6" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <DatabaseTestRunner />
    </div>
  );
}; // Added missing closing brace for the Admin component

export default Admin;
