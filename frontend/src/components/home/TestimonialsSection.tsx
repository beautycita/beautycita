import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { StarIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { getMediaUrl } from '@/config/media'

interface TestimonialsSectionProps {
  isDarkMode: boolean
}

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Fashion Influencer',
    avatar: getMediaUrl('img/avatar/A6.png'),
    content: 'BeautyCita completely transformed how I manage my beauty routine. The AI recommendations are spot-on, and I love discovering new stylists!',
    rating: 5,
    service: 'Hair Styling',
    verified: true
  },
  {
    id: 2,
    name: 'Jessica Lee',
    role: 'Marketing Director',
    avatar: getMediaUrl('img/avatar/A7.png'),
    content: 'Finally, a platform that understands professional women. Quick bookings, amazing stylists, and the convenience I need for my busy schedule.',
    rating: 5,
    service: 'Makeup',
    verified: true
  },
  {
    id: 3,
    name: 'Maria Garcia',
    role: 'Med Student',
    avatar: getMediaUrl('img/avatar/A8.png'),
    content: 'Student-friendly prices and flexible booking times. Found my go-to nail artist here and she\'s absolutely amazing!',
    rating: 5,
    service: 'Nail Art',
    verified: true
  },
  {
    id: 4,
    name: 'Emily Thompson',
    role: 'Yoga Instructor',
    avatar: getMediaUrl('img/avatar/A9.png'),
    content: 'The mindfulness approach to beauty here is refreshing. Love the skincare specialists and the holistic treatment options.',
    rating: 5,
    service: 'Skincare',
    verified: true
  },
  {
    id: 5,
    name: 'Sophia Rodriguez',
    role: 'Event Planner',
    avatar: getMediaUrl('img/avatar/A10.png'),
    content: 'I book all my event styling through BeautyCita. The stylists are professional, punctual, and incredibly talented.',
    rating: 5,
    service: 'Event Styling',
    verified: true
  },
  {
    id: 6,
    name: 'Isabella Chen',
    role: 'Tech Entrepreneur',
    avatar: getMediaUrl('img/avatar/A11.png'),
    content: 'The tech-forward approach and seamless booking experience make this my favorite beauty platform. Highly recommend!',
    rating: 5,
    service: 'Lash Extensions',
    verified: true
  }
]

export default function TestimonialsSection({ isDarkMode }: TestimonialsSectionProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <section className={`py-20 relative overflow-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'
    }`}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-teal-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <HeartIcon className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} mr-2`} />
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Love Letters
            </h2>
            <HeartIcon className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} ml-2`} />
          </div>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Real stories from real beauty enthusiasts
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="group perspective-1000"
            >
              <div className={`h-full rounded-3xl overflow-hidden transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 hover:border-pink-500/50'
                  : 'bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl border border-white/50'
              } transform-gpu hover:rotate-y-5`}>
                {/* Card Header with Gradient */}
                <div className={`h-2 bg-gradient-to-r ${
                  index % 3 === 0 ? 'from-pink-500 to-purple-600' :
                  index % 3 === 1 ? 'from-purple-500 to-blue-600' :
                  'from-blue-500 to-teal-600'
                }`} />

                <div className="p-6">
                  {/* Profile Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="relative">
                        <img loading="lazy"
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-gray-800 shadow-lg"
                        />
                        {testimonial.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <SparklesIcon className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {testimonial.name}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDarkMode
                        ? 'bg-gray-800 text-pink-400'
                        : 'bg-pink-100 text-pink-600'
                    }`}>
                      {testimonial.service}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarSolid
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <blockquote className={`text-sm leading-relaxed italic ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    "{testimonial.content}"
                  </blockquote>

                  {/* Decorative Quote Mark */}
                  <div className="mt-4 flex justify-end">
                    <div className={`text-6xl font-serif opacity-10 ${
                      isDarkMode ? 'text-pink-400' : 'text-pink-600'
                    }`}>
                      "
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Join thousands of happy clients
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-pink-500/50 transition-all transform hover:scale-105">
            Start Your Beauty Journey
          </button>
        </motion.div>
      </div>
    </section>
  )
}