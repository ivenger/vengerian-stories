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
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags();
      await fetchTagsByLanguage(updatedPost.language[0]);
      await fetchAllPosts();
      await fetchPublishedPosts();
      await fetchAllTags
