const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id || null;
    const result = await query(`
      SELECT c.*, u.username, u.avatar_url, u.role,
        CASE WHEN cl.id IS NOT NULL THEN true ELSE false END as user_has_liked
      FROM blog_comments c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $2
      WHERE c.post_id = $1 AND c.is_deleted = false
      ORDER BY c.created_at ASC
    `, [postId, userId]);
    const comments = result.rows;
    const commentMap = {};
    const rootComments = [];
    comments.forEach(comment => { comment.replies = []; commentMap[comment.id] = comment; });
    comments.forEach(comment => {
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(comment);
      } else if (!comment.parent_comment_id) {
        rootComments.push(comment);
      }
    });
    res.json({ success: true, comments: rootComments, total: comments.length });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
});

router.post('/posts/:postId/comments', validateJWT, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment too long (max 2000 characters)' });
    }
    const result = await query(`INSERT INTO blog_comments (post_id, user_id, parent_comment_id, content) VALUES ($1, $2, $3, $4) RETURNING *`, 
      [postId, userId, parentCommentId || null, content.trim()]);
    const comment = result.rows[0];
    const userResult = await query('SELECT username, avatar_url, role FROM users WHERE id = $1', [userId]);
    comment.username = userResult.rows[0].username;
    comment.avatar_url = userResult.rows[0].avatar_url;
    comment.role = userResult.rows[0].role;
    comment.user_has_liked = false;
    comment.replies = [];
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Error posting comment' });
  }
});

router.put('/comments/:commentId', validateJWT, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }
    const checkResult = await query('SELECT user_id, created_at FROM blog_comments WHERE id = $1', [commentId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const diffMinutes = (new Date() - new Date(checkResult.rows[0].created_at)) / 1000 / 60;
    if (diffMinutes > 5) {
      return res.status(403).json({ success: false, message: 'Edit window expired (5 minutes)' });
    }
    await query(`UPDATE blog_comments SET content = $1, is_edited = true, edited_at = NOW(), updated_at = NOW() WHERE id = $2`, 
      [content.trim(), commentId]);
    res.json({ success: true, message: 'Comment updated' });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ success: false, message: 'Error editing comment' });
  }
});

router.delete('/comments/:commentId', validateJWT, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const checkResult = await query('SELECT user_id FROM blog_comments WHERE id = $1', [commentId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await query(`UPDATE blog_comments SET is_deleted = true, deleted_at = NOW(), content = '[deleted]' WHERE id = $1`, [commentId]);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
});

router.post('/comments/:commentId/like', validateJWT, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const existingLike = await query('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
    if (existingLike.rows.length > 0) {
      await query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
      res.json({ success: true, liked: false });
    } else {
      await query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
});

router.post('/comments/:commentId/report', validateJWT, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }
    await query(`INSERT INTO comment_reports (comment_id, reporter_user_id, reason) VALUES ($1, $2, $3)`, [commentId, userId, reason.trim()]);
    res.json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ success: false, message: 'Error submitting report' });
  }
});

module.exports = router;
