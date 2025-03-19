
import React from 'react';
import { BlogEntry } from '@/types/blogTypes';
import { 
  Button 
} from "@/components/ui/button";
import { 
  Edit, 
  Trash, 
  ExternalLink,
} from "lucide-react";

interface PostListProps {
  posts: BlogEntry[];
  onEditPost: (post: BlogEntry) => void;
  onDeletePost: (post: BlogEntry) => void;
}

const PostList: React.FC<PostListProps> = ({ 
  posts, 
  onEditPost, 
  onDeletePost 
}) => {
  const renderPostActions = (post: BlogEntry) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEditPost(post)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDeletePost(post)}
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

  return (
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
            {posts.map((post) => (
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
  );
};

export default PostList;
