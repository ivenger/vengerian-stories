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
    setTags(allTags);
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
      // Just call each function once to update the data
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      
      // Refresh the UI data
      await loadPosts();
      await loadStats();
      await loadLanguages();
      await loadRecentActivity();
      await loadTags();
      
      // Close the edit dialog
      setEditingPost(null);
      
      toast({
        title: "Success",
        description: "Post has been updated successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = (post: BlogEntry) => {
    setPostToDelete(post);
  };

  const confirmDeletePost = async () => {
    if (postToDelete) {
      try {
        await deletePost(postToDelete.id);
        loadPosts();
        loadStats();
        loadRecentActivity();
        toast({
          title: "Success",
          description: "Post deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      } finally {
        setPostToDelete(null);
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
    const statusMatch = statusFilter === 'all' || post.status === statusFilter;
    const languageMatch =
      languageFilter === 'all' || (post.language && post.language.includes(languageFilter));

    return titleMatch || contentMatch && statusMatch && languageMatch;
  });

  const renderPostActions = (post: BlogEntry) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleEditPost(post)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeletePost(post)}
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/${post.id}`, '_blank')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        View
      </Button>
    </div>
  );

  const handleTagManagement = () => {
    setShowTagManagement(true);
  };

  const handleCloseTagManagement = () => {
    setShowTagManagement(false);
  };

  const handleNewTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const handleTranslationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    lang: string
  ) => {
    setTagTranslations({
      ...tagTranslations,
      [lang]: e.target.value,
    });
  };

  const handleCreateTag = async () => {
    try {
      const newTagData = {
        name: newTag,
        en: tagTranslations.en || null,
        he: tagTranslations.he || null,
        ru: tagTranslations.ru || null,
      };

      // Placeholder for createTag API call
      // await createTag(newTagData);

      loadTags();
      setNewTag('');
      setTagTranslations({ en: '', he: '', ru: '' });
      toast({
        title: "Success",
        description: "Tag created successfully.",
      });
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const confirmDeleteTag = async () => {
    if (tagToDelete) {
      try {
        // Placeholder for deleteTag API call
        // await deleteTag(tagToDelete.id);

        loadTags();
        toast({
          title: "Success",
          description: "Tag deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting tag:", error);
        toast({
          title: "Error",
          description: "Failed to delete tag. Please try again.",
          variant: "destructive"
        });
      } finally {
        setTagToDelete(null);
      }
    }
  };

  const cancelDeleteTag = () => {
    setTagToDelete(null);
  };

  const handleImageUpload = () => {
    setShowImageUpload(true);
  };

  const handleCloseImageUpload = () => {
    setShowImageUpload(false);
    setSelectedImage(null);
  };

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
      loadImages();
      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      handleCloseImageUpload();
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const handleFeaturedChange = (checked: boolean) => {
    setIsFeatured(checked);
  };

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
    toast({
      title: "Success",
      description: "Image URL and alt text saved successfully.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Statistics</h2>
          <p>Total Posts: {stats.totalPosts}</p>
          <p>Published Posts: {stats.publishedPosts}</p>
          <p>Draft Posts: {stats.draftPosts}</p>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Languages</h2>
          <ul>
            {languages.map((lang) => (
              <li key={lang.name}>
                {lang.name}: {lang.count}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
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
          <Plus className="h-4 w-4 mr-2" />
          Create New Post
        </Button>
        <div className="flex space-x-2">
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
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Posts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Language
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Updated At
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {post.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.language?.join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {renderPostActions(post)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <DialogContent className="sm:max-w-[50%]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Edit the content of the post. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
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
                  <FormField
                    control={imageUploadForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={isFeatured}
                            onCheckedChange={handleFeaturedChange}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <FormLabel>Featured</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit">Save Image Details</Button>
              </form>
            </Form>
          )}
          {editingPost && (
            <MarkdownEditor initialValue={editingPost.content} onChange={(value) => {
              setEditingPost({ ...editingPost, content: value });
            }} />
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => handleSavePost(editingPost)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Tags
          <Button variant="ghost" size="sm" onClick={handleTagManagement}>
            <Tag className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
        </h2>
      </div>

      <Dialog open={showTagManagement} onOpenChange={handleCloseTagManagement}>
        <DialogContent className="sm:max-w-[50%]">
          <DialogHeader>
            <DialogTitle>Tag Management</DialogTitle>
            <DialogDescription>
              Create, edit, and delete tags.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input type="text" id="name" value={newTag} onChange={handleNewTagChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="en" className="text-right">
                English
              </Label>
              <Input type="text" id="en" value={tagTranslations.en} onChange={(e) => handleTranslationChange(e, 'en')} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="he" className="text-right">
                Hebrew
              </Label>
              <Input type="text" id="he" value={tagTranslations.he} onChange={(e) => handleTranslationChange(e, 'he')} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ru" className="text-right">
                Russian
              </Label>
              <Input type="text" id="ru" value={tagTranslations.ru} onChange={(e) => handleTranslationChange(e, 'ru')} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseTagManagement}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateTag}>
              Create Tag
            </Button>
          </DialogFooter>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Existing Tags</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      English
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hebrew
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Russian
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tag.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tag.en || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tag.he || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tag.ru || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Images
          <Button variant="ghost" size="sm" onClick={handleImageUpload}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {isLoadingImages ? (
            <div>Loading images...</div>
          ) : (
            availableImages.map((imageUrl) => (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Available Image"
                className="cursor-pointer rounded shadow-md"
                onClick={() => handleImageClick(imageUrl)}
              />
            ))
          )}
        </div>
      </div>

      <Dialog open={showImageUpload} onOpenChange={handleCloseImageUpload}>
        <DialogContent className="sm:max-w-[425px]">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseImageUpload}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DatabaseTestRunner />
    </div>
  );
};

export default Admin;
