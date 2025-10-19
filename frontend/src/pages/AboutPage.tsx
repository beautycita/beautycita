import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline'
import PageHero from '../components/ui/PageHero'
import PageSection from '../components/ui/PageSection'
import GradientCard from '../components/ui/GradientCard'
import StatsGrid from '../components/ui/StatsGrid'
import FeatureCard from '../components/ui/FeatureCard'
import CTASection from '../components/ui/CTASection'
import VideoSection from '../components/home/VideoSection'

export default function AboutPage() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
  }, [])

  const stats = [
    { icon: <SparklesIcon className="h-8 w-8" />, number: '2025', label: 'Plataforma Innovadora', gradient: 'from-pink-500 to-purple-600' },
    { icon: <ShieldCheckIcon className="h-8 w-8" />, number: '100%', label: 'Segura y Verificada', gradient: 'from-purple-500 to-blue-600' },
    { icon: <GlobeAmericasIcon className="h-8 w-8" />, number: '24/7', label: 'Soporte Disponible', gradient: 'from-blue-500 to-pink-600' },
    { icon: <HeartIcon className="h-8 w-8" />, number: 'AI', label: 'Asistente Aphrodite', gradient: 'from-pink-600 to-purple-500' }
  ]

  const values = [
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: t('pages.about.innovation'),
      description: t('pages.about.innovationText'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: t('pages.about.quality'),
      description: t('pages.about.qualityText'),
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: t('pages.about.accessibility'),
      description: t('pages.about.accessibilityText'),
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Empowerment",
      description: "Helping beauty professionals build thriving businesses",
      gradient: 'from-purple-600 to-pink-600'
    }
  ]

  // Team and milestone data removed - to be populated with real information

  return (
    <div className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.about.title')}
        subtitle={t('pages.about.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/dancing-optimized.mp4"
      />

      {/* Stats */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <StatsGrid stats={stats} columns={4} isDarkMode={isDarkMode} />
      </PageSection>

      {/* Mission & Story */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.about.mission')}
            </h2>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('pages.about.missionText')}
            </p>
          </motion.div>

          <GradientCard gradient="from-pink-500 to-purple-600" isDarkMode={isDarkMode}>
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                💡
              </motion.div>
              <h3 className="text-2xl font-bold mb-4 text-purple-600">Our Vision</h3>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                To become the world's most trusted platform for beauty and wellness services,
                empowering professionals and delighting clients everywhere.
              </p>
            </div>
          </GradientCard>
        </div>
      </PageSection>

      {/* Values */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        >
          What Drives Us
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, i) => (
            <FeatureCard
              key={value.title}
              icon={value.icon}
              title={value.title}
              description={value.description}
              gradient={value.gradient}
              isDarkMode={isDarkMode}
              index={i}
            />
          ))}
        </div>
      </PageSection>

      {/* Team section removed - to be populated with real team information */}

      {/* Journey timeline removed - to be populated with actual company milestones */}

      {/* Community Event Video Section */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/event-optimized.mp4"
        height="h-[60vh]"
        parallaxIntensity={0.3}
        overlayGradient="bg-gradient-to-b from-purple-900/60 via-pink-900/60 to-black/80"
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4 text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Building Community Together
            </h2>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              From local events to global connections, we're creating a movement that celebrates beauty professionals
            </p>
          </motion.div>
        </div>
      </VideoSection>

      {/* Why Choose Us CTA */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <CTASection
          title="Ready to Experience BeautyCita?"
          description="Whether you're looking for your next beauty appointment or want to grow your professional practice, we're here to help you succeed."
          primaryAction={{
            label: 'Find Your Stylist',
            to: '/stylists'
          }}
          secondaryAction={{
            label: 'Join as Stylist',
            to: '/register/stylist'
          }}
          gradient="from-pink-600 via-purple-600 to-blue-600"
          icon={<SparklesIcon className="h-16 w-16" />}
        />
      </PageSection>
    </div>
  )
}
