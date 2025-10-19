import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  SparklesIcon,
  HeartIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { insertBeautyGifs } from '../components/blog/BeautyGifInserter';
import CommentsSection from '../components/comments/CommentsSection';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  published_at: string;
  created_at: string;
  source_feed: string;
  enhancement_date: string;
}

// Fun visual elements for engaging content
const beautyEmojis = ['💄', '💅', '✨', '💖', '🌟', '👑', '🦄', '🌈', '💎', '🎀', '🌸', '🦋'];
const funStickers = ['💕', '🔥', '⭐', '💫', '🌺', '🍃', '💐', '🌙', '☀️', '🎊'];

// Component for fun, engaging blog content layout with GIFs
const FunBlogContent: React.FC<{ content: string }> = ({ content }) => {
  // Use the smart GIF insertion system
  const contentElements = insertBeautyGifs(content);

  const getRandomEmoji = () => beautyEmojis[Math.floor(Math.random() * beautyEmojis.length)];
  const getRandomSticker = () => funStickers[Math.floor(Math.random() * funStickers.length)];

  // Cute cartoon-style decorations
  const getDecorationForParagraph = (index: number) => {
    const decorations = [
      <div className="text-4xl opacity-20 absolute -top-2 -left-2">{getRandomEmoji()}</div>,
      <div className="flex space-x-2 text-2xl opacity-30 absolute -top-3 -right-3">
        <span>{getRandomSticker()}</span>
        <span>{getRandomEmoji()}</span>
      </div>,
      <div className="absolute -bottom-2 -right-2 text-3xl opacity-25 transform rotate-12">{getRandomEmoji()}</div>,
      <div className="absolute -top-1 -left-1 text-xl opacity-40">
        <SparklesIcon className="h-6 w-6 text-primary-400" />
      </div>,
      <div className="absolute -bottom-1 -left-2 text-2xl opacity-30">{getRandomSticker()}</div>
    ];
    return decorations[index % decorations.length];
  };

  // Fun background patterns for paragraphs
  const getBackgroundPattern = (index: number) => {
    const patterns = [
      'bg-gradient-to-br from-pink-50 to-purple-50',
      'bg-gradient-to-bl from-yellow-50 to-orange-50',
      'bg-gradient-to-tr from-blue-50 to-cyan-50',
      'bg-gradient-to-tl from-green-50 to-teal-50',
      'bg-gradient-to-r from-rose-50 to-pink-50',
      'bg-gradient-to-l from-purple-50 to-indigo-50'
    ];
    return patterns[index % patterns.length];
  };

  return (
    <div className="space-y-8">
      {contentElements.map((element, index) => {
        // Check if this is a paragraph or GIF element
        const isParagraph = element.key?.toString().includes('paragraph');

        if (isParagraph) {
          const paragraphIndex = parseInt(element.key?.toString().split('-')[1] || '0');
          const isEven = paragraphIndex % 2 === 0;
          const alignment = isEven ? 'text-left' : 'text-right';
          const justification = isEven ? 'justify-start' : 'justify-end';
          const marginClass = isEven ? 'mr-8 md:mr-16' : 'ml-8 md:ml-16';

          return (
            <motion.div
              key={element.key}
              initial={{ opacity: 0, x: isEven ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex ${justification}`}
            >
              <div
                className={`relative max-w-2xl ${marginClass} p-6 rounded-full ${getBackgroundPattern(paragraphIndex)}
                  border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300
                  transform hover:scale-105`}
              >
                {/* Cute decorative elements */}
                {getDecorationForParagraph(paragraphIndex)}

                {/* Content */}
                <div className={`${alignment} text-gray-800 leading-relaxed font-medium`}>
                  {element}
                </div>

                {/* Fun accent border */}
                <div className={`absolute ${isEven ? '-right-2' : '-left-2'} top-1/2 transform -translate-y-1/2
                  w-1 h-16 bg-gradient-to-b from-primary-400 to-secondary-400 rounded-full`} />

                {/* Floating hearts animation */}
                {paragraphIndex % 3 === 0 && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <motion.div
                      animate={{
                        y: [-5, -15, -5],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-pink-400 opacity-60"
                    >
                      <HeartIcon className="h-5 w-5" />
                    </motion.div>
                  </div>
                )}

                {/* Sparkle effects */}
                {paragraphIndex % 4 === 1 && (
                  <div className="absolute top-2 right-2">
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="text-yellow-400 opacity-50"
                    >
                      <StarIcon className="h-4 w-4" />
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        } else {
          // This is a GIF element, render it directly
          return (
            <motion.div
              key={element.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              {element}
            </motion.div>
          );
        }
      })}

      {/* Fun divider at the end */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: contentElements.length * 0.2 }}
        className="flex justify-center items-center py-8"
      >
        <div className="flex items-center space-x-4 text-3xl">
          <span className="animate-bounce">💖</span>
          <span className="animate-pulse">✨</span>
          <span className="animate-bounce delay-100">💄</span>
          <span className="animate-pulse delay-200">🌟</span>
          <span className="animate-bounce delay-300">💅</span>
        </div>
      </motion.div>
    </div>
  );
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const language = i18n.language === 'es-MX' || i18n.language === 'es' ? 'es' : 'en';
        const response = await fetch(`/api/blog/posts/${slug}?lang=${language}`);
        const data = await response.json();

        if (data.success) {
          setPost(data.post);
        } else {
          setError('Blog post not found');
        }
      } catch (err) {
        setError('Error loading blog post');
        console.error('Error fetching blog post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Re-fetch post when language changes
  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const language = i18n.language === 'es-MX' || i18n.language === 'es' ? 'es' : 'en';
          const response = await fetch(`/api/blog/posts/${slug}?lang=${language}`);
          const data = await response.json();

          if (data.success) {
            setPost(data.post);
          } else {
            setError('Blog post not found');
          }
        } catch (err) {
          setError('Error loading blog post');
          console.error('Error fetching blog post:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [i18n.language, slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'es-MX' || i18n.language === 'es' ? 'es-MX' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">{t('pages.blog.loadingArticle')}</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-full p-8 max-w-md mx-auto">
            <p className="text-red-600 mb-4">{error || t('pages.blog.postNotFound')}</p>
            <Link
              to="/blog"
              className="btn btn-primary rounded-full"
            >
              {t('pages.blog.backToBlog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <section className="relative py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/blog"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors mb-8"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>{t('pages.blog.backToBlog')}</span>
          </Link>
        </div>
      </section>

      {/* Article */}
      <article className="pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-full shadow-lg overflow-hidden"
          >
            {/* Article Header */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <CalendarDaysIcon className="h-4 w-4" />
                <time>{formatDate(post.published_at)}</time>
                <span className="text-gray-300">•</span>
                <UserIcon className="h-4 w-4" />
                <span>{post.author}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Enhanced by AI Badge */}
              <div className="flex items-center space-x-2 text-xs text-purple-600 bg-purple-50 rounded-full px-3 py-1 inline-flex">
                <SparklesIcon className="h-3 w-3" />
                <span>{t('pages.blog.createdForBeautyCita')}</span>
              </div>
            </div>

            {/* Article Content - Fun & Engaging Layout */}
            <div className="p-8 max-w-none">
              <FunBlogContent content={post.content} />
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full p-8 text-center text-white"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('pages.blog.readyForTransformation')}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {t('pages.blog.discoverStylists')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="btn btn-white rounded-full"
              >
                {t('pages.blog.viewServices')}
              </Link>
              <Link
                to="/stylists"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 rounded-full"
              >
                {t('pages.blog.findStylists')}
              </Link>
            </div>
          </motion.div>

          {/* Comments Section */}
          <CommentsSection postId={post.id} />
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;