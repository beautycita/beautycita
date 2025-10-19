import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Posts', count: 12 },
    { id: 'trends', name: t('pages.blog.trends'), count: 4 },
    { id: 'tips', name: t('pages.blog.tips'), count: 3 },
    { id: 'tutorials', name: t('pages.blog.tutorials'), count: 3 },
    { id: 'industry', name: t('pages.blog.industry'), count: 2 }
  ];

  const blogPosts = [
    {
      id: 1,
      title: t('pages.blog.post1'),
      excerpt: 'Discover the hottest beauty trends that are taking 2024 by storm, from glass skin to bold eye makeup.',
      category: 'trends',
      author: 'Sofia Martinez',
      date: 'March 10, 2024',
      readTime: '5 min read',
      image: '/api/placeholder/400/250',
      featured: true
    },
    {
      id: 2,
      title: t('pages.blog.post2'),
      excerpt: 'Learn how artificial intelligence is revolutionizing beauty recommendations and personalized skincare routines.',
      category: 'industry',
      author: 'Carlos Rodriguez',
      date: 'March 8, 2024',
      readTime: '7 min read',
      image: '/api/placeholder/400/250',
      featured: true
    },
    {
      id: 3,
      title: t('pages.blog.post3'),
      excerpt: 'Everything you need to know about finding the perfect beauty professional for your specific needs.',
      category: 'tips',
      author: 'Ana Garcia',
      date: 'March 5, 2024',
      readTime: '6 min read',
      image: '/api/placeholder/400/250',
      featured: false
    },
    {
      id: 4,
      title: 'The Ultimate Guide to Summer Skincare',
      excerpt: 'Protect and nourish your skin during the hot summer months with these expert-approved tips.',
      category: 'tips',
      author: 'Dr. Elena Vargas',
      date: 'March 3, 2024',
      readTime: '8 min read',
      image: '/api/placeholder/400/250',
      featured: false
    },
    {
      id: 5,
      title: 'Mastering the Art of Contouring',
      excerpt: 'Step-by-step tutorial on contouring techniques for different face shapes.',
      category: 'tutorials',
      author: 'Lucia Fernandez',
      date: 'March 1, 2024',
      readTime: '10 min read',
      image: '/api/placeholder/400/250',
      featured: false
    },
    {
      id: 6,
      title: 'Sustainable Beauty: Eco-Friendly Trends',
      excerpt: 'How the beauty industry is embracing sustainability and what it means for consumers.',
      category: 'trends',
      author: 'Miguel Santos',
      date: 'February 28, 2024',
      readTime: '6 min read',
      image: '/api/placeholder/400/250',
      featured: false
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <PencilSquareIcon className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {t('pages.blog.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('pages.blog.subtitle')}
          </p>
        </motion.div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-green-100'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Featured Articles
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[16/10] bg-gradient-to-br from-green-400 to-emerald-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full mb-2">
                        <TagIcon className="inline h-4 w-4 mr-1" />
                        {categories.find(c => c.id === post.category)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{post.date}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.blog.latestPosts')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[16/10] bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20"></div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 bg-white/90 text-green-700 text-xs font-medium rounded-full">
                        {categories.find(c => c.id === post.category)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{post.author}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;