
import { Link } from "react-router-dom";
import { BlogPost } from "../data/blogPosts";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <article className="mb-12">
      <Link to={`/blog/${post.id}`}>
        <h2 className="text-2xl font-semibold mb-2 hover:text-gray-700 transition-colors">
          {post.title}
        </h2>
      </Link>
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <span>{post.date}</span>
        <span className="mx-2">•</span>
        <span>{post.language}</span>
      </div>
      <p className="text-gray-700">{post.excerpt}</p>
      <Link 
        to={`/blog/${post.id}`}
        className="inline-block mt-4 text-sm font-medium text-gray-700 hover:text-black transition-colors"
      >
        Continue reading →
      </Link>
    </article>
  );
};

export default BlogCard;
