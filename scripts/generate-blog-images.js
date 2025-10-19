#!/usr/bin/env node

/**
 * Generate DALL-E 3 Images for Existing Blog Posts
 * Backfills images for posts that don't have AI-generated images
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { query } = require('../backend/src/db');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate image prompt from article content
async function generateImagePrompt(title, content) {
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
    const response = await openai.chat.completions.create({
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
    return `Professional beauty and makeup photography, vibrant colors, modern aesthetic, ${title}`;
  }
}

// Generate image using DALL-E 3
async function generateImage(imagePrompt) {
  try {
    console.log('  🎨 Generating image with DALL-E 3...');
    console.log('  📝 Prompt:', imagePrompt.substring(0, 100) + '...');

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const imageUrl = response.data[0].url;
    console.log('  ✅ Image generated successfully');

    return {
      url: imageUrl,
      type: 'image'
    };
  } catch (error) {
    console.error('  ❌ Error generating image:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Blog Image Generation...\n');

  try {
    // Find posts without AI-generated images (stock images or null)
    const result = await query(`
      SELECT id, title, content, media_url
      FROM blog_posts
      WHERE media_url IS NULL
         OR media_url LIKE '%picsum.photos%'
      ORDER BY id ASC
    `);

    const posts = result.rows;
    console.log(`📊 Found ${posts.length} posts needing images\n`);

    let successCount = 0;
    let failCount = 0;
    let totalCost = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n[${i + 1}/${posts.length}] Processing: "${post.title}"`);
      console.log(`  ID: ${post.id}`);

      try {
        // Generate image prompt
        const imagePrompt = await generateImagePrompt(post.title, post.content);

        // Generate image
        const imageResult = await generateImage(imagePrompt);

        if (imageResult) {
          // Update database
          await query(
            'UPDATE blog_posts SET media_url = $1, media_type = $2 WHERE id = $3',
            [imageResult.url, imageResult.type, post.id]
          );

          console.log(`  💾 Database updated`);
          successCount++;
          totalCost += 0.04; // $0.04 per standard quality image

          // Add delay to avoid rate limits
          if (i < posts.length - 1) {
            console.log('  ⏳ Waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          console.log(`  ⚠️  Skipping - image generation failed`);
          failCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing post:`, error.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Image Generation Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`💰 Estimated Cost: $${totalCost.toFixed(2)}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
