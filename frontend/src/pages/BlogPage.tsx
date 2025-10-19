import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  PlayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';
import { PageHero, GradientCard } from '../components/ui';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  author_avatar?: string;
  published_at: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  user_has_interacted?: boolean;
}

interface Comment {
  id: number;
  post_id: number;
  author: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_liked?: boolean;
}

const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(newDarkMode);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'trends', label: 'Trends' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'tips', label: 'Beauty Tips' },
    { id: 'products', label: 'Products' },
    { id: 'celebrity', label: 'Celebrity' }
  ];

  // Fetch posts with engagement-based sorting
  const fetchPosts = async (pageNum: number, isRefresh = false) => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/blog/timeline?page=${pageNum}&limit=10&user_id=${user?.id || ''}`
      );
      const data = await response.json();

      if (data.success) {
        const newPosts = data.posts;

        if (isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        console.error('Error fetching posts:', data.message);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - pullStartY.current;

    if (pullDistance > 80) {
      setRefreshing(true);
    }
  };

  const handleTouchEnd = () => {
    if (refreshing) {
      setPage(1);
      fetchPosts(1, true);
    }
    isPulling.current = false;
  };

  // Post interactions
  const handleLike = async (postId: number) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          }
        : post
    ));

    try {
      await apiClient.post(`/blog/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count + 1 : post.likes_count - 1
            }
          : post
      ));
    }
  };

  const handleBookmark = async (postId: number) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, is_bookmarked: !post.is_bookmarked }
        : post
    ));

    try {
      await apiClient.post(`/blog/${postId}/bookmark`);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      // Revert on error
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, is_bookmarked: !post.is_bookmarked }
          : post
      ));
    }
  };

  const handleShare = async (post: BlogPost) => {
    try {
      // Track the share
      if (isAuthenticated) {
        await apiClient.post(`/blog/${post.id}/share`);
      }

      // Update UI
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, shares_count: p.shares_count + 1 }
          : p
      ));

      // Share or copy to clipboard
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: `${window.location.origin}/blog/${post.slug}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleComment = async (postId: number) => {
    if (!commentText[postId]?.trim() || !isAuthenticated) return;

    const commentContent = commentText[postId].trim();
    setCommentText(prev => ({ ...prev, [postId]: '' }));

    try {
      const response = await apiClient.post(`/blog/${postId}/comments`, {
        content: commentContent
      });

      if (response.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), response.comment]
        }));

        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentText(prev => ({ ...prev, [postId]: commentContent }));
    }
  };

  const loadComments = async (postId: number) => {
    if (comments[postId]) return; // Already loaded

    try {
      const response = await fetch(`/api/blog/${postId}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const toggleComments = (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      loadComments(postId);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Filter posts by search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      post.title.toLowerCase().includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Search */}
      <PageHero
        title="Beauty Blog"
        subtitle="Discover the latest trends, tips, and tutorials from beauty experts"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-14 pr-6 py-4 rounded-3xl focus:outline-none focus:ring-4 shadow-xl text-lg ${
                isDarkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500/50'
                  : 'bg-white text-gray-900 placeholder-gray-400 focus:ring-white/30'
              }`}
            />
          </div>
        </div>
      </PageHero>

      {/* Categories Filter */}
      <section className={`border-b py-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center py-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-8 w-8 border-4 border-t-pink-500 border-r-purple-500 border-b-blue-500 border-l-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              ref={index === filteredPosts.length - 1 ? lastPostRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GradientCard
                gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
                isDarkMode={isDarkMode}
                hoverable={true}
                className="h-full flex flex-col"
              >
                {/* Featured Image or Gradient Placeholder */}
                {post.media_url ? (
                  <div className="relative mb-4 rounded-3xl overflow-hidden aspect-video">
                    {post.media_type === 'video' ? (
                      <div className="relative bg-black w-full h-full">
                        <video
                          src={post.media_url}
                          controls
                          className="w-full h-full object-cover"
                          poster={`https://picsum.photos/seed/${post.id}/800/600`}
                        >
                          <source src={post.media_url} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                            <PlayIcon className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : (
                  <div className="mb-4 rounded-3xl overflow-hidden aspect-video bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center">
                    <div className="text-6xl">✨</div>
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-4">
                  {post.author_avatar ? (
                    <img
                      src={post.author_avatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {post.author}
                    </p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {formatTimeAgo(post.published_at)}
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>•</span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {calculateReadTime(post.content || post.excerpt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Title & Excerpt */}
                <h2 className={`text-2xl md:text-3xl font-serif font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {post.title}
                </h2>
                <p className={`mb-4 line-clamp-3 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {post.excerpt}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1 transition-all ${
                      post.is_liked ? 'text-pink-600' : isDarkMode ? 'text-gray-400 hover:text-pink-500' : 'text-gray-500 hover:text-pink-600'
                    }`}
                  >
                    {post.is_liked ? (
                      <HeartIconSolid className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm">{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-400 hover:text-purple-500' : 'text-gray-500 hover:text-purple-600'} transition-colors`}
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="text-sm">{post.comments_count}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post)}
                    className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'} transition-colors`}
                  >
                    <ShareIcon className="w-5 h-5" />
                    <span className="text-sm">{post.shares_count}</span>
                  </button>

                  <button
                    onClick={() => handleBookmark(post.id)}
                    className={`transition-colors ${
                      post.is_bookmarked ? 'text-yellow-600' : isDarkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'
                    }`}
                  >
                    {post.is_bookmarked ? (
                      <BookmarkIconSolid className="w-5 h-5" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Read More Button */}
                <button className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-3xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                  Read More
                </button>

                {/* Comments section */}
                <AnimatePresence>
                  {expandedPost === post.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      {/* Comments list */}
                      <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
                        {comments[post.id]?.map(comment => (
                          <div key={comment.id} className="flex space-x-3">
                            <img
                              src={comment.author_avatar || 'https://i.pravatar.cc/150?img=1'}
                              alt={comment.author}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className={`flex-1 rounded-3xl px-4 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {comment.author}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment input */}
                      {isAuthenticated ? (
                        <div className="flex space-x-3">
                          <img
                            src={user?.profile_picture_url || 'https://i.pravatar.cc/150?img=1'}
                            alt={user?.name || 'You'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={commentText[post.id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                              placeholder="Add a comment..."
                              className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                isDarkMode
                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!commentText[post.id]?.trim()}
                              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Link to="/login" className="text-purple-600 hover:underline">Sign in</Link> to comment
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GradientCard>
            </motion.article>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-12 w-12 border-4 border-t-pink-500 border-r-purple-500 border-b-blue-500 border-l-transparent"
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">📝</div>
            <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No posts found
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Try adjusting your search or filters
            </p>
            <motion.button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Clear filters
            </motion.button>
          </motion.div>
        )}

        {/* End of feed */}
        {!hasMore && posts.length > 0 && filteredPosts.length > 0 && (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">You're all caught up! ✨</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
