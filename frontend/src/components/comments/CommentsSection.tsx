import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Comment from './Comment';
import CommentForm from './CommentForm';
import axios from 'axios';

interface CommentType {
  id: number;
  post_id: number;
  user_id: number;
  parent_comment_id: number | null;
  content: string;
  username: string;
  avatar_url: string | null;
  role: string;
  likes_count: number;
  replies_count: number;
  user_has_liked: boolean;
  is_edited: boolean;
  created_at: string;
  replies: CommentType[];
}

interface CommentsSectionProps {
  postId: number;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/comments/posts/${postId}/comments`);
      if (response.data.success) {
        setComments(response.data.comments);
        setTotalComments(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment: CommentType) => {
    if (!newComment.parent_comment_id) {
      setComments(prev => [...prev, newComment]);
      setTotalComments(prev => prev + 1);
    }
  };

  const handleReplyAdded = () => {
    fetchComments();
    setTotalComments(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-full w-48 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        💬 Comments ({totalComments})
      </h2>

      {isAuthenticated ? (
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      ) : (
        <div className="bg-purple-50 rounded-3xl p-6 mb-8 text-center">
          <p className="text-gray-700">Sign in to join the conversation</p>
          <a href="/auth" className="btn btn-primary rounded-full mt-4 inline-block">
            Sign In
          </a>
        </div>
      )}

      <div className="space-y-6 mt-8">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Be the first to comment! 💬</p>
          </div>
        ) : (
          comments.map(comment => (
            <Comment 
              key={comment.id} 
              comment={comment}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>
    </div>
  );
}
