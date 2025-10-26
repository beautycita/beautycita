/**
 * Blog System - Beauty tips, stylist interviews, trends
 *
 * Features:
 * - Blog post listing and single post views
 * - Categories and tags
 * - Search and filtering
 * - SEO-optimized
 * - Related posts
 * - Social sharing
 */

import React, { useState, useEffect } from 'react';
import { MetaTags, BlogPostMeta } from './MetaTags';
import { BlogPostStructuredData } from './StructuredData';
import { ShareMenu } from './SocialSharing';

// ==================== TYPES ====================

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: {
    id: number;
    name: string;
    avatar: string;
    bio: string;
    twitter?: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  publishedAt: string;
  updatedAt: string;
  readingTime: number; // in minutes
  views: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  postCount: number;
}

// ==================== SAMPLE BLOG POSTS ====================

export const sampleBlogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'top-10-hair-trends-2025',
    title: 'Top 10 Hair Trends for 2025: From Balayage to Bold Colors',
    excerpt: 'Discover the hottest hair trends taking over 2025. From subtle balayage to vibrant fashion colors, learn what styles are making waves in the beauty industry.',
    content: `# Top 10 Hair Trends for 2025

The beauty industry is constantly evolving, and 2025 is bringing some exciting new hair trends that are both innovative and timeless. Whether you're looking for a subtle change or a bold transformation, these trends offer something for everyone.

## 1. Dimensional Balayage

Balayage continues to dominate, but 2025 is all about dimension. Stylists are creating multi-tonal looks that add depth and movement to any hair color.

### Why it's popular:
- Low maintenance
- Natural-looking highlights
- Works on all hair types

## 2. Curtain Bangs

This face-framing style is flattering on virtually everyone and works with any hair length.

## 3. Lived-In Color

Say goodbye to harsh lines and hello to seamless blends that grow out beautifully.

## 4. Textured Bob

The classic bob gets a modern update with choppy layers and piece-y texture.

## 5. Money Piece Highlights

Bold face-framing highlights that brighten your complexion and add instant dimension.

## 6. Metallic Tones

From rose gold to silver, metallic hair colors are having a moment.

## 7. Shag Cuts

70s-inspired shags are back and more versatile than ever.

## 8. Natural Texture Enhancement

Embracing your natural curl pattern with targeted cuts and styling.

## 9. Rich Chocolate Browns

Deep, dimensional browns are replacing black as the go-to dark color.

## 10. Bold Reds

From copper to burgundy, red tones are making a major comeback.

## How to Choose the Right Trend

Consider your:
- Hair texture and type
- Lifestyle and maintenance preferences
- Face shape and features
- Personal style

## Booking Your Transformation

Ready to try one of these trends? Find a skilled stylist on BeautyCita who specializes in the look you want. View portfolios, read reviews, and book your appointment instantly.`,
    featuredImage: 'https://beautycita.com/blog/hair-trends-2025.jpg',
    author: {
      id: 1,
      name: 'Sarah Martinez',
      avatar: 'https://beautycita.com/authors/sarah.jpg',
      bio: 'Celebrity hairstylist and beauty industry expert with 15 years of experience.',
      twitter: '@sarahmartinezhair',
    },
    category: {
      id: 1,
      name: 'Hair Trends',
      slug: 'hair-trends',
    },
    tags: [
      { id: 1, name: 'Hair Color', slug: 'hair-color' },
      { id: 2, name: 'Trends 2025', slug: 'trends-2025' },
      { id: 3, name: 'Balayage', slug: 'balayage' },
    ],
    publishedAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    readingTime: 5,
    views: 1234,
  },
  {
    id: 2,
    slug: 'skincare-routine-for-glowing-skin',
    title: 'The Ultimate Skincare Routine for Glowing Skin',
    excerpt: 'Learn the essential steps and products for achieving radiant, healthy skin. Expert tips from top estheticians.',
    content: `# The Ultimate Skincare Routine for Glowing Skin

Achieving glowing skin doesn't have to be complicated. Follow these expert-recommended steps for a simple yet effective routine.

## Morning Routine

### 1. Gentle Cleanser
Start your day by removing overnight buildup.

### 2. Vitamin C Serum
Brighten and protect with antioxidants.

### 3. Moisturizer
Hydrate and prep for the day.

### 4. SPF
Never skip sun protection!

## Evening Routine

### 1. Double Cleanse
Remove makeup and daily grime.

### 2. Exfoliate (2-3x per week)
Promote cell turnover.

### 3. Treatment Serum
Target specific concerns like acne or aging.

### 4. Night Cream
Repair while you sleep.

## Pro Tips

- Consistency is key
- Don't forget your neck
- Patch test new products
- Drink plenty of water

## Find a Skincare Professional

Connect with licensed estheticians on BeautyCita for personalized skincare consultations and facial treatments.`,
    featuredImage: 'https://beautycita.com/blog/skincare-routine.jpg',
    author: {
      id: 2,
      name: 'Dr. Emily Chen',
      avatar: 'https://beautycita.com/authors/emily.jpg',
      bio: 'Board-certified dermatologist and skincare specialist.',
    },
    category: {
      id: 2,
      name: 'Skincare',
      slug: 'skincare',
    },
    tags: [
      { id: 4, name: 'Skincare Routine', slug: 'skincare-routine' },
      { id: 5, name: 'Glowing Skin', slug: 'glowing-skin' },
    ],
    publishedAt: '2025-01-10T14:00:00Z',
    updatedAt: '2025-01-10T14:00:00Z',
    readingTime: 4,
    views: 892,
  },
  {
    id: 3,
    slug: 'nail-art-spring-2025',
    title: 'Spring 2025 Nail Art: Fresh Designs to Try',
    excerpt: 'From minimalist French tips to bold floral designs, explore the nail art trends blooming this spring.',
    content: `# Spring 2025 Nail Art Trends

Spring is the perfect time to refresh your nail game with these trending designs.

## Trending Designs

### 1. Modern French Manicure
Updated with colored tips and geometric lines.

### 2. Floral Accents
Delicate pressed flowers embedded in gel.

### 3. Pastel Ombre
Soft color transitions perfect for spring.

### 4. Negative Space
Minimalist designs that show off natural nails.

### 5. Chrome Finishes
Mirror-like shine in soft spring colors.

## Care Tips

- Moisturize cuticles daily
- Use a base coat
- Avoid harsh chemicals
- Book regular manicures

## Book Your Nail Appointment

Find talented nail artists on BeautyCita and browse their portfolio of work before booking.`,
    featuredImage: 'https://beautycita.com/blog/nail-art-spring.jpg',
    author: {
      id: 3,
      name: 'Jessica Lee',
      avatar: 'https://beautycita.com/authors/jessica.jpg',
      bio: 'Award-winning nail artist and educator.',
      twitter: '@jessicaleenails',
    },
    category: {
      id: 3,
      name: 'Nail Art',
      slug: 'nail-art',
    },
    tags: [
      { id: 6, name: 'Nail Art', slug: 'nail-art' },
      { id: 7, name: 'Spring 2025', slug: 'spring-2025' },
    ],
    publishedAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-05T09:00:00Z',
    readingTime: 3,
    views: 654,
  },
];

export const blogCategories: BlogCategory[] = [
  {
    id: 1,
    name: 'Hair Trends',
    slug: 'hair-trends',
    description: 'Latest hairstyles, colors, and techniques',
    postCount: 24,
  },
  {
    id: 2,
    name: 'Skincare',
    slug: 'skincare',
    description: 'Expert skincare tips and product recommendations',
    postCount: 18,
  },
  {
    id: 3,
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Nail designs, trends, and care tips',
    postCount: 15,
  },
  {
    id: 4,
    name: 'Makeup',
    slug: 'makeup',
    description: 'Makeup tutorials and product reviews',
    postCount: 21,
  },
  {
    id: 5,
    name: 'Stylist Interviews',
    slug: 'stylist-interviews',
    description: 'Behind the scenes with top beauty professionals',
    postCount: 12,
  },
  {
    id: 6,
    name: 'Beauty Business',
    slug: 'beauty-business',
    description: 'Tips for beauty professionals and salon owners',
    postCount: 9,
  },
];

// ==================== COMPONENTS ====================

/**
 * Blog Post Card
 */
export const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={post.featuredImage}
        alt={post.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-blue-600 font-medium">{post.category.name}</span>
          <span className="text-sm text-gray-500">{post.readingTime} min read</span>
        </div>

        <h3 className="text-xl font-bold mb-2 hover:text-blue-600">
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">{post.author.name}</span>
          </div>

          <time className="text-sm text-gray-500">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map((tag) => (
            <a
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              #{tag.name}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

/**
 * Blog Post List
 */
export const BlogPostList: React.FC<{
  posts?: BlogPost[];
  category?: string;
  tag?: string;
}> = ({ posts = sampleBlogPosts, category, tag }) => {
  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let filtered = posts;

    if (category) {
      filtered = filtered.filter((post) => post.category.slug === category);
    }

    if (tag) {
      filtered = filtered.filter((post) =>
        post.tags.some((t) => t.slug === tag)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [posts, category, tag, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search */}
      <div className="mb-8">
        <input
          type="search"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

/**
 * Single Blog Post View
 */
export const BlogPostView: React.FC<{ post: BlogPost }> = ({ post }) => {
  const shareData = {
    url: `https://beautycita.com/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    image: post.featuredImage,
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <BlogPostMeta post={post} />
      <BlogPostStructuredData post={post} />

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-blue-600 font-medium">{post.category.name}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{post.readingTime} min read</span>
            <span className="text-gray-500">•</span>
            <time className="text-gray-600">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{post.author.name}</p>
                <p className="text-sm text-gray-600">{post.author.bio}</p>
              </div>
            </div>

            <ShareMenu shareData={shareData} variant="horizontal" size="md" />
          </div>
        </header>

        {/* Featured Image */}
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <a
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
              >
                #{tag.name}
              </a>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Share this article:</h3>
          <ShareMenu
            shareData={shareData}
            variant="horizontal"
            size="md"
            showLabels={true}
          />
        </div>

        {/* Author Bio */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h3 className="font-bold text-lg mb-1">About {post.author.name}</h3>
              <p className="text-gray-600 mb-2">{post.author.bio}</p>
              {post.author.twitter && (
                <a
                  href={`https://twitter.com/${post.author.twitter}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {post.author.twitter}
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

/**
 * Blog Categories Sidebar
 */
export const BlogCategoriesSidebar: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-bold text-lg mb-4">Categories</h3>
      <ul className="space-y-2">
        {blogCategories.map((category) => (
          <li key={category.id}>
            <a
              href={`/blog/category/${category.slug}`}
              className="flex items-center justify-between text-gray-700 hover:text-blue-600"
            >
              <span>{category.name}</span>
              <span className="text-sm text-gray-500">({category.postCount})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default {
  BlogPostCard,
  BlogPostList,
  BlogPostView,
  BlogCategoriesSidebar,
  sampleBlogPosts,
  blogCategories,
};
