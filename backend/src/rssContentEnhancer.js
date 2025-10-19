const Parser = require('rss-parser');
const OpenAI = require('openai');
const { query } = require('./db');

class RSSContentEnhancer {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['pubDate', 'description', 'content:encoded']
      }
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.isProcessing = false;
  }

  // Generate URL-friendly slug from title
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Extract plain text content from HTML
  extractTextContent(html) {
    if (!html) return '';

    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // BeautyCita brand blogger who reads, forms opinions, and writes original content
  async enhanceContent(originalArticle) {
    const prompt = `You are writing as BeautyCita - the leading beauty booking platform brand that reads industry articles, forms opinions, and writes completely original blog posts about the same topics from your unique brand perspective.

YOUR BRAND PERSONA:
- BeautyCita: The authority on Mexican beauty trends and booking
- Expert voice with 8+ years in the Mexican beauty market
- Passionate about making beauty accessible to all Mexican women
- Has strong opinions and isn't afraid to share them as a brand
- Professional yet fun, trendy yet authentic
- Always ends posts with signature sign-off: "Keep slaying, bellezas! 💋 -BeautyCita"

YOUR MISSION:
Read this source article, form your own opinion about the topic, then write a completely original blog post about the SAME SUBJECT but with YOUR perspective, insights, and professional opinion.

WRITING STYLE:
🎯 TONE: Professional blogger with personality - opinionated but approachable
💫 VOICE: Confident beauty expert sharing insider knowledge and personal takes
✨ LANGUAGE: Mix English with natural Spanish (belleza, estilo, maquillaje, tendencias)
💄 STRUCTURE: Professional blog format with clear sections and personal insights
🌟 OPINION: Don't be neutral - have a clear stance and share your professional view

BLOG POST FORMAT:
1. Catchy headline about the topic (your angle, not theirs)
2. "¡Hola, bellezas!" opening with your take on why this topic matters
3. Your professional opinion and analysis of the subject
4. 3-4 main points with your insights and Mexican beauty market perspective
5. Practical advice and tips based on your expertise
6. Personal anecdotes or professional observations where relevant
7. Call-to-action connecting to BeautyCita services when appropriate
8. ALWAYS end with: "Keep slaying, bellezas! 💋 -BeautyCita"

SOURCE ARTICLE TO READ AND FORM OPINION ON:
Title: ${originalArticle.title}
Content: ${originalArticle.content}

Now write YOUR original blog post about this same topic, sharing YOUR professional opinion and perspective as BeautyCita's expert blogger:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error enhancing content with OpenAI:', error);
      throw error;
    }
  }

  // Generate excerpt from enhanced content
  generateExcerpt(content) {
    const plainText = this.extractTextContent(content);
    const sentences = plainText.split('. ');
    const excerpt = sentences.slice(0, 2).join('. ');
    return excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt + '.';
  }

  // Generate image prompt from article content
  async generateImagePrompt(title, content) {
    const prompt = `Based on this beauty blog article, create a detailed DALL-E image prompt for a stunning, eye-catching featured image.

ARTICLE TITLE: ${title}
ARTICLE CONTENT: ${content.substring(0, 1000)}

Create a DALL-E prompt that:
- Captures the main visual theme of the article
- Is vibrant, modern, and trendy (Gen-Z aesthetic)
- Features beauty elements (makeup, hair, skincare, fashion)
- Feels professional yet fun and engaging
- Avoids text/words in the image
- Uses bright, Instagram-worthy colors

Return ONLY the DALL-E prompt, nothing else.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.8,
        max_tokens: 150
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating image prompt:', error);
      // Fallback simple prompt
      return `Professional beauty and makeup photography, vibrant colors, modern aesthetic, ${title}`;
    }
  }

  // Generate image using DALL-E 3
  async generateImage(imagePrompt) {
    try {
      console.log('Generating image with DALL-E 3...');
      console.log('Prompt:', imagePrompt);

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard" // Use "hd" for higher quality at $0.08/image
      });

      const imageUrl = response.data[0].url;
      console.log('✅ Image generated:', imageUrl);

      return {
        url: imageUrl,
        type: 'image'
      };
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      return null;
    }
  }

  // Process a single RSS feed
  async processFeed(feedUrl, feedName) {
    try {
      console.log(`Processing feed: ${feedName} (${feedUrl})`);

      // Get last processed date for this feed
      const trackingResult = await query(
        'SELECT last_processed_item_date FROM rss_feed_tracking WHERE feed_url = $1',
        [feedUrl]
      );

      if (trackingResult.rows.length === 0) {
        console.log(`Feed ${feedUrl} not found in tracking table`);
        return 0;
      }

      const lastProcessedDate = trackingResult.rows[0].last_processed_item_date;
      console.log(`Last processed date for ${feedName}: ${lastProcessedDate}`);

      // Parse RSS feed
      const feed = await this.parser.parseURL(feedUrl);
      console.log(`Found ${feed.items.length} items in ${feedName}`);

      let processedCount = 0;
      let latestItemDate = new Date(lastProcessedDate);

      // Process items in reverse order (oldest first)
      const sortedItems = feed.items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));

      for (const item of sortedItems) {
        const itemDate = new Date(item.pubDate);

        // Only process items published after our last processed date
        if (itemDate <= lastProcessedDate) {
          console.log(`Skipping item from ${itemDate} (before cutoff ${lastProcessedDate})`);
          continue;
        }

        console.log(`Processing: "${item.title}" from ${itemDate}`);

        try {
          // Extract content (prefer content:encoded over description)
          const originalContent = this.extractTextContent(
            item['content:encoded'] || item.description || item.content || ''
          );

          if (!originalContent || originalContent.length < 100) {
            console.log(`Skipping item "${item.title}" - insufficient content`);
            continue;
          }

          // Check if we already processed this item
          const existingPost = await query(
            'SELECT id FROM blog_posts WHERE original_source_url = $1',
            [item.link]
          );

          if (existingPost.rows.length > 0) {
            console.log(`Already processed: "${item.title}"`);
            continue;
          }

          // Enhance the content
          console.log('Enhancing content with AI...');
          const enhancedContent = await this.enhanceContent({
            title: item.title,
            content: originalContent
          });

          // Generate slug and excerpt
          const slug = this.generateSlug(item.title);
          const excerpt = this.generateExcerpt(enhancedContent);

          // Generate image for the article
          let mediaUrl = null;
          let mediaType = null;

          try {
            const imagePrompt = await this.generateImagePrompt(item.title, enhancedContent);
            const imageResult = await this.generateImage(imagePrompt);

            if (imageResult) {
              mediaUrl = imageResult.url;
              mediaType = imageResult.type;
            }
          } catch (imageError) {
            console.error('Error generating image, continuing without:', imageError);
          }

          // Save to database
          await query(`
            INSERT INTO blog_posts (
              title, slug, content, excerpt, author, author_avatar, status,
              original_source_url, source_feed, original_title, original_content,
              published_at, enhancement_date, media_url, media_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            item.title,
            slug,
            enhancedContent,
            excerpt,
            'BeautyCita',
            'https://i.pravatar.cc/150?img=45', // BeautyCita avatar
            'published',
            item.link,
            feedName,
            item.title,
            originalContent,
            itemDate,
            new Date(),
            mediaUrl,
            mediaType
          ]);

          console.log(`✅ Successfully processed and enhanced: "${item.title}"`);
          processedCount++;
          latestItemDate = itemDate > latestItemDate ? itemDate : latestItemDate;

          // Add small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error processing item "${item.title}":`, error);
          continue;
        }
      }

      // Update tracking information
      await query(`
        UPDATE rss_feed_tracking
        SET last_check = CURRENT_TIMESTAMP,
            last_processed_item_date = $1,
            total_processed = total_processed + $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE feed_url = $3
      `, [latestItemDate, processedCount, feedUrl]);

      console.log(`✅ Completed ${feedName}: ${processedCount} new articles processed`);
      return processedCount;

    } catch (error) {
      console.error(`Error processing feed ${feedName}:`, error);
      throw error;
    }
  }

  // Process all active RSS feeds
  async processAllFeeds() {
    if (this.isProcessing) {
      console.log('RSS processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Starting RSS content enhancement process...');

    try {
      // Get all active feeds
      const feedsResult = await query(
        'SELECT feed_url, feed_name FROM rss_feed_tracking WHERE status = $1',
        ['active']
      );

      let totalProcessed = 0;

      for (const feed of feedsResult.rows) {
        const processed = await this.processFeed(feed.feed_url, feed.feed_name);
        totalProcessed += processed;
      }

      console.log(`🎉 RSS processing completed! Total articles enhanced: ${totalProcessed}`);
      return { success: true, totalProcessed };

    } catch (error) {
      console.error('Error in RSS processing:', error);
      return { success: false, error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      lastRun: new Date().toISOString()
    };
  }
}

// Export singleton instance
const rssEnhancer = new RSSContentEnhancer();
module.exports = rssEnhancer;