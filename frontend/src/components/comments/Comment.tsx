import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import CommentForm from './CommentForm';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

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

interface CommentProps {
  comment: CommentType;
  onReplyAdded: () => void;
  depth?: number;
}

export default function Comment({ comment, onReplyAdded, depth = 0 }: CommentProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liked, setLiked] = useState(comment.user_has_liked);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const isOwnComment = user?.id === comment.user_id;
  const canEdit = isOwnComment && !comment.is_deleted;
  const maxDepth = 5; // Limit visual nesting depth

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.post(`/api/comments/comments/${comment.id}/like`);
      if (response.data.success) {
        setLiked(response.data.liked);
        setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      const response = await axios.put(`/api/comments/comments/${comment.id}`, {
        content: editContent
      });
      if (response.data.success) {
        setIsEditing(false);
        window.location.reload(); // Refresh to show updated comment
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error editing comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await axios.delete(`/api/comments/comments/${comment.id}`);
      if (response.data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    try {
      const response = await axios.post(`/api/comments/comments/${comment.id}/report`, {
        reason: reportReason
      });
      if (response.data.success) {
        alert('Report submitted. Thank you for helping keep our community safe.');
        setShowReportForm(false);
        setReportReason('');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full ml-2">Admin</span>;
    if (role === 'moderator') return <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-2">Mod</span>;
    return null;
  };

  if (comment.is_deleted) {
    return (
      <div className={`${depth > 0 ? 'ml-8' : ''}`}>
        <div className="bg-gray-100 rounded-3xl p-4 text-gray-500 italic">
          [Comment deleted]
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => (
              <Comment key={reply.id} comment={reply} onReplyAdded={onReplyAdded} depth={Math.min(depth + 1, maxDepth)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${depth > 0 && depth < maxDepth ? 'ml-8' : ''}`}>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {comment.avatar_url ? (
                <img loading="lazy" src={comment.avatar_url} alt={comment.username} className="w-10 h-10 rounded-full" />
              ) : (
                comment.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-900">{comment.username}</span>
                {getRoleBadge(comment.role)}
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                {comment.is_edited && <span className="ml-2 text-xs">(edited)</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              maxLength={2000}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                className="btn btn-primary rounded-full text-sm px-4 py-1"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="btn btn-secondary rounded-full text-sm px-4 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 text-sm rounded-full px-3 py-1 transition-colors ${
              liked
                ? 'bg-pink-100 text-pink-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{likesCount}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-gray-600 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-3 py-1 rounded-full transition-colors"
            >
              💬 Reply
            </button>
          )}

          {canEdit && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
              >
                🗑️ Delete
              </button>
            </>
          )}

          {isAuthenticated && !isOwnComment && (
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="text-sm text-gray-600 hover:text-orange-600 bg-gray-100 hover:bg-orange-50 px-3 py-1 rounded-full transition-colors"
            >
              🚩 Report
            </button>
          )}
        </div>

        {/* Report Form */}
        {showReportForm && (
          <div className="mt-4 bg-orange-50 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Report Comment</h4>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please describe why you're reporting this comment..."
              className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleReport}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-full text-sm transition-colors"
              >
                Submit Report
              </button>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setReportReason('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded-full text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-4 ml-8">
          <CommentForm
            postId={comment.post_id}
            parentCommentId={comment.id}
            onCommentAdded={() => {
              setShowReplyForm(false);
              onReplyAdded();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onReplyAdded={onReplyAdded}
              depth={Math.min(depth + 1, maxDepth)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
