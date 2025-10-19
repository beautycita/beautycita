import React, { useState, useEffect } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';

const gf = new GiphyFetch('Gc7131jiJuvI7IdN0HZ1D7nh0ow5BH6g'); // Public beta key

interface BeautyGifProps {
  keywords: string[];
  index: number;
  onLoad?: () => void;
}

interface GifData {
  url: string;
  width: number;
  height: number;
  title: string;
}

const BeautyGif: React.FC<BeautyGifProps> = ({ keywords, index, onLoad }) => {
  const [gif, setGif] = useState<GifData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBeautyGif = async () => {
      try {
        setLoading(true);

        // Beauty-focused search terms
        const beautyKeywords = [
          'makeup application',
          'beauty routine',
          'lipstick',
          'mascara',
          'skincare',
          'hair styling',
          'nail art',
          'beauty transformation',
          'makeup artist',
          'glam'
        ];

        // Combine content keywords with beauty terms
        const searchTerm = keywords.length > 0
          ? `${keywords[0]} beauty makeup`
          : beautyKeywords[index % beautyKeywords.length];

        const { data } = await gf.search(searchTerm, {
          limit: 10,
          rating: 'g',
          lang: 'es'
        });

        if (data.length > 0) {
          // Pick a random GIF from results to add variety
          const randomIndex = Math.floor(Math.random() * Math.min(data.length, 5));
          const selectedGif = data[randomIndex];

          setGif({
            url: selectedGif.images.fixed_width.url,
            width: parseInt(selectedGif.images.fixed_width.width),
            height: parseInt(selectedGif.images.fixed_width.height),
            title: selectedGif.title
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching beauty GIF:', err);
        setError(true);
      } finally {
        setLoading(false);
        onLoad?.();
      }
    };

    fetchBeautyGif();
  }, [keywords, index, onLoad]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-pulse bg-gradient-to-r from-pink-200 to-purple-200 rounded-3xl h-32 w-48"></div>
      </div>
    );
  }

  if (error || !gif) {
    return null; // Fail gracefully, don't break the layout
  }

  return (
    <div className="flex justify-center py-6">
      <div className="relative group">
        <img
          src={gif.url}
          alt={gif.title}
          className="rounded-3xl shadow-lg max-w-xs hover:shadow-xl transition-all duration-300
            border-2 border-white group-hover:scale-105"
          style={{ maxHeight: '200px', width: 'auto' }}
          loading="lazy"
        />

        {/* Fun decorative elements around GIF */}
        <div className="absolute -top-2 -right-2 text-xl animate-bounce">
          ✨
        </div>
        <div className="absolute -bottom-2 -left-2 text-lg opacity-70">
          💄
        </div>

        {/* Subtle attribution */}
        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
          via GIPHY
        </div>
      </div>
    </div>
  );
};

// Smart GIF insertion based on content analysis
export const insertBeautyGifs = (content: string): JSX.Element[] => {
  const paragraphs = content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-600 font-bold">$1</strong>')
    .replace(/### (.*?)\n/g, '<h3 class="text-xl font-bold text-primary-600 mb-4">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-2xl font-bold text-primary-600 mb-6">$1</h2>')
    .split('\n\n')
    .filter(p => p.trim().length > 0);

  const elements: JSX.Element[] = [];

  // Analyze content for beauty keywords
  const beautyKeywordMap: { [key: string]: string[] } = {
    lipstick: ['lipstick', 'lip', 'rouge', 'labial'],
    makeup: ['makeup', 'maquillaje', 'cosmetics', 'base'],
    skincare: ['skincare', 'skin', 'piel', 'facial'],
    hair: ['hair', 'cabello', 'pelo', 'styling'],
    nails: ['nails', 'uñas', 'manicure', 'nail art'],
    eyeshadow: ['eyeshadow', 'eye', 'ojos', 'shadow'],
    mascara: ['mascara', 'eyelash', 'pestañas'],
    blush: ['blush', 'rubor', 'cheek', 'mejillas']
  };

  // Extract keywords from content
  const extractKeywords = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const foundKeywords: string[] = [];

    Object.entries(beautyKeywordMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundKeywords.push(category);
      }
    });

    return foundKeywords;
  };

  paragraphs.forEach((paragraph, index) => {
    elements.push(
      <div key={`paragraph-${index}`} className="paragraph-content">
        <div dangerouslySetInnerHTML={{ __html: paragraph }} />
      </div>
    );

    // Insert GIF strategically: after paragraph 1, middle paragraph, and second-to-last
    const shouldInsertGif =
      index === 1 || // After intro
      index === Math.floor(paragraphs.length / 2) || // Middle
      index === paragraphs.length - 2; // Near end

    if (shouldInsertGif && index < paragraphs.length - 1) {
      const keywords = extractKeywords(paragraph);
      elements.push(
        <BeautyGif
          key={`gif-${index}`}
          keywords={keywords}
          index={index}
        />
      );
    }
  });

  return elements;
};

export default BeautyGif;