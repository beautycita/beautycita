import React, { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  stylistId: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Favorite button component with heart icon
 *
 * @example
 * <FavoriteButton stylistId={123} />
 * <FavoriteButton stylistId={123} size="lg" showLabel={true} />
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  stylistId,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const favorited = isFavorite(stylistId);

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const iconSize = sizeClasses[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    // Toggle favorite
    try {
      await toggleFavorite(stylistId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 p-2 rounded-full
        transition-colors duration-200
        ${favorited ? 'text-pink-500 hover:bg-pink-50' : 'text-gray-400 hover:bg-gray-100'}
        ${className}
      `}
      whileTap={{ scale: 0.9 }}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.div
        animate={{
          scale: isAnimating ? [1, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {favorited ? (
          <HeartSolidIcon className={iconSize} />
        ) : (
          <HeartIcon className={iconSize} />
        )}
      </motion.div>

      {showLabel && (
        <span className="text-sm font-medium">
          {favorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </motion.button>
  );
};

export default FavoriteButton;
