const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get blog posts for timeline feed (engagement-based sorting)
router.get('/timeline', async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id } = req.query;
    const offset = (page - 1) * limit;

    // If user is authenticated, personalize based on their interactions
    // For now, we'll just fetch posts with engagement metrics
    const result = await query(`
      SELECT
        bp.id,
        bp.title,
        bp.slug,
        bp.content,
        bp.excerpt,
        bp.author,
        bp.author_avatar,
        bp.published_at,
        bp.source_feed,
        bp.media_url,
        bp.media_type,
        COALESCE(bl.likes_count, 0) as likes_count,
        COALESCE(bc.comments_count, 0) as comments_count,
        COALESCE(bs.shares_count, 0) as shares_count,
        CASE WHEN bul.user_id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN bub.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
      FROM blog_posts bp
      LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count
        FROM blog_post_likes
        GROUP BY post_id
      ) bl ON bp.id = bl.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count
        FROM blog_post_comments
        GROUP BY post_id
      ) bc ON bp.id = bc.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as shares_count
        FROM blog_post_shares
        GROUP BY post_id
      ) bs ON bp.id = bs.post_id
      LEFT JOIN blog_post_likes bul ON bp.id = bul.post_id AND bul.user_id = $1
      LEFT JOIN blog_post_bookmarks bub ON bp.id = bub.post_id AND bub.user_id = $1
      WHERE bp.status = 'published'
      ORDER BY
        -- Engagement-based sorting: recent interactions weighted higher
        (COALESCE(bl.likes_count, 0) * 2 + COALESCE(bc.comments_count, 0) * 3 + COALESCE(bs.shares_count, 0)) DESC,
        bp.published_at DESC
      LIMIT $2 OFFSET $3
    `, [user_id || null, limit, offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM blog_posts WHERE status = $1',
      ['published']
    );

    res.json({
      success: true,
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog posts',
      error: error.message
    });
  }
});

// Like a post
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if already liked
    const existingLike = await query(
      'SELECT id FROM blog_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await query('DELETE FROM blog_post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      return res.json({ success: true, action: 'unliked' });
    } else {
      // Like
      await query('INSERT INTO blog_post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      return res.json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Error processing like', error: error.message });
  }
});

// Bookmark a post
router.post('/:postId/bookmark', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if already bookmarked
    const existingBookmark = await query(
      'SELECT id FROM blog_post_bookmarks WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingBookmark.rows.length > 0) {
      // Remove bookmark
      await query('DELETE FROM blog_post_bookmarks WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      return res.json({ success: true, action: 'unbookmarked' });
    } else {
      // Add bookmark
      await query('INSERT INTO blog_post_bookmarks (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      return res.json({ success: true, action: 'bookmarked' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ success: false, message: 'Error processing bookmark', error: error.message });
  }
});

// Share a post (track sharing)
router.post('/:postId/share', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    await query('INSERT INTO blog_post_shares (post_id, user_id) VALUES ($1, $2)', [postId, userId || null]);

    res.json({ success: true, message: 'Share tracked' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ success: false, message: 'Error tracking share', error: error.message });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const result = await query(`
      SELECT
        c.id,
        c.post_id,
        c.content,
        c.created_at,
        u.name as author,
        u.profile_picture_url as author_avatar,
        COALESCE(cl.likes_count, 0) as likes_count,
        CASE WHEN cul.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM blog_post_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as likes_count
        FROM blog_comment_likes
        GROUP BY comment_id
      ) cl ON c.id = cl.comment_id
      LEFT JOIN blog_comment_likes cul ON c.id = cul.comment_id AND cul.user_id = $2
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId, userId || null]);

    res.json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments', error: error.message });
  }
});

// Add a comment
router.post('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const result = await query(
      'INSERT INTO blog_post_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, content.trim()]
    );

    // Get user info for the response
    const userResult = await query('SELECT name, profile_picture_url FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      comment: {
        ...result.rows[0],
        author: userResult.rows[0].name,
        author_avatar: userResult.rows[0].profile_picture_url,
        likes_count: 0,
        is_liked: false
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Error adding comment', error: error.message });
  }
});

// Get single blog post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;

    const result = await query(`
      SELECT
        bp.id,
        bp.title,
        bp.slug,
        bp.content,
        bp.excerpt,
        bp.author,
        bp.author_avatar,
        bp.published_at,
        bp.source_feed,
        bp.media_url,
        bp.media_type,
        COALESCE(bl.likes_count, 0) as likes_count,
        COALESCE(bc.comments_count, 0) as comments_count,
        COALESCE(bs.shares_count, 0) as shares_count,
        CASE WHEN bul.user_id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN bub.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
      FROM blog_posts bp
      LEFT JOIN (SELECT post_id, COUNT(*) as likes_count FROM blog_post_likes GROUP BY post_id) bl ON bp.id = bl.post_id
      LEFT JOIN (SELECT post_id, COUNT(*) as comments_count FROM blog_post_comments GROUP BY post_id) bc ON bp.id = bc.post_id
      LEFT JOIN (SELECT post_id, COUNT(*) as shares_count FROM blog_post_shares GROUP BY post_id) bs ON bp.id = bs.post_id
      LEFT JOIN blog_post_likes bul ON bp.id = bul.post_id AND bul.user_id = $1
      LEFT JOIN blog_post_bookmarks bub ON bp.id = bub.post_id AND bub.user_id = $1
      WHERE bp.slug = $2 AND bp.status = 'published'
    `, [userId || null, slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({
      success: true,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ success: false, message: 'Error fetching blog post', error: error.message });
  }
});

module.exports = router;
