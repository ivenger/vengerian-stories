
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchBucketImages } from "@/services/imageService";
import DatabaseTestRunner from '@/components/DatabaseTestRunner';
import PostList from '@/components/admin/PostList';
import PostEditor from '@/components/admin/PostEditor';
import FilterBar from '@/components/admin/FilterBar';
import AdminStats from '@/components/admin/AdminStats';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import TagManager from '@/components/admin/TagManager';
import ImageUploader from '@/components/admin/ImageUploader';

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
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
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

    return (titleMatch || contentMatch) && statusMatch && languageMatch;
  });

  const handleTagManagement = () => {
    setShowTagManagement(true);
  };

  const handleCloseTagManagement = () => {
    setShowTagManagement(false);
  };

  const handleCreateTag = async (tagName: string, translations: { en: string, he: string, ru: string }) => {
    try {
      // Placeholder for createTag API call - would be implemented in an actual app
      // await createTag({ name: tagName, ...translations });
      loadTags();
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
        // Placeholder for deleteTag API call - would be implemented in an actual app
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
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const handleFeaturedChange = (checked: boolean) => {
    setIsFeatured(checked);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <AdminStats 
        stats={stats} 
        languages={languages} 
        recentActivity={recentActivity} 
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        languageFilter={languageFilter}
        onLanguageFilterChange={setLanguageFilter}
        availableLanguages={availableLanguages}
        onCreatePost={handleCreatePost}
      />

      <PostList 
        posts={filteredPosts} 
        onEditPost={handleEditPost} 
        onDeletePost={handleDeletePost} 
      />

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
          <TagManager 
            tags={tags}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            onClose={handleCloseTagManagement}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={tagToDelete !== null} onOpenChange={(open) => !open && cancelDeleteTag()}>
        <DialogContent className="sm:max-w-[425px]">
          <DeleteConfirmDialog
            title="Delete Tag"
            description="Are you sure you want to delete this tag? This action cannot be undone."
            onConfirm={confirmDeleteTag}
            onCancel={cancelDeleteTag}
          />
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Images
          <Button variant="ghost" size="sm" onClick={handleImageUpload}>
            <Tag className="h-4 w-4 mr-2" />
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
          <ImageUploader
            isOpen={showImageUpload}
            onClose={handleCloseImageUpload}
            availableImages={availableImages}
            onImageSelect={handleImageClick}
            isLoadingImages={isLoadingImages}
            refreshImages={loadImages}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={postToDelete !== null} onOpenChange={(open) => !open && cancelDeletePost()}>
        <DialogContent className="sm:max-w-[425px]">
          <DeleteConfirmDialog
            title="Delete Post"
            description="Are you sure you want to delete this post? This action cannot be undone."
            onConfirm={confirmDeletePost}
            onCancel={cancelDeletePost}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingPost !== null} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-[50%]">
          {editingPost && (
            <PostEditor
              post={editingPost}
              onSave={handleSavePost}
              onCancel={() => setEditingPost(null)}
              isFeatured={isFeatured}
              onFeaturedChange={handleFeaturedChange}
              selectedImageUrl={selectedImageUrl}
            />
          )}
        </DialogContent>
      </Dialog>

      <DatabaseTestRunner />
    </div>
  );
};

export default Admin;
