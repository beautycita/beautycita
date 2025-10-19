import { useState } from 'react';
import axios from 'axios';

interface CommentFormProps {
  postId: number;
  parentCommentId?: number;
  onCommentAdded: (comment: any) => void;
  onCancel?: () => void;
}

export default function CommentForm({ postId, parentCommentId, onCommentAdded, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 2000;
  const isReply = !!parentCommentId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > maxLength) {
      setError(`Comment too long (max ${maxLength} characters)`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`/api/comments/posts/${postId}/comments`, {
        content: content.trim(),
        parentCommentId: parentCommentId || null
      });

      if (response.data.success) {
        setContent('');
        onCommentAdded(response.data.comment);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "Write your reply..." : "Share your thoughts..."}
          className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={isReply ? 3 : 4}
          maxLength={maxLength}
          disabled={submitting}
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm ${content.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
            {content.length} / {maxLength}
          </span>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn btn-primary rounded-full px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '✨ Posting...' : isReply ? '💬 Reply' : '✨ Post Comment'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary rounded-full px-6 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
