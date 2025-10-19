import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BriefcaseIcon,
  RocketLaunchIcon,
  HeartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  GlobeAltIcon,
  ChartBarIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard, PageSection, FeatureCard, CTASection } from '../components/ui'

const CareersPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const values = [
    {
      icon: <RocketLaunchIcon className="h-8 w-8" />,
      title: 'Grassroots Growth',
      description: 'We started small in Mexico City and grew organically. Every team member contributes to our community-first expansion from local to global.',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <HeartIcon className="h-8 w-8" />,
      title: 'Authenticity',
      description: 'Real connections, honest feedback, and genuine care for our beauty professional community. No corporate BS, just real people building real relationships.',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: 'Community First',
      description: 'We grow neighborhood by neighborhood, city by city, building trust locally before expanding globally. Bottom-up, not top-down.',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: 'Earn Together',
      description: 'Our commission-based model means we all succeed together. When stylists thrive, BeautyCita thrives. Everyone shares in our growth.',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const positions = [
    {
      icon: MegaphoneIcon,
      title: 'Growth Marketer (Regional)',
      type: 'Commission-based / Part-time → Full-time',
      compensation: 'High commission on bookings in your region + base after hitting milestones',
      description: 'Launch BeautyCita in new cities. Recruit stylists, drive client bookings, build local community. This is entrepreneurial - you own your market.',
      requirements: ['Marketing or sales experience', 'Strong local connections', 'Social media and community building skills', 'Fluent in Spanish and English'],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: HeartIcon,
      title: 'Customer Success Lead',
      type: 'Full-time / Remote',
      compensation: 'Base salary + performance bonuses',
      description: 'Help stylists succeed on our platform. Provide training, support, and retention strategies. Be the voice of our beauty professionals.',
      requirements: ['Customer service experience (2+ years)', 'Beauty industry knowledge preferred', 'Empathy, patience, and problem-solving skills', 'Data-driven approach to success metrics'],
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Operations Coordinator',
      type: 'Full-time / Part-time / Mexico City',
      compensation: 'Salary or hourly + growth incentives',
      description: 'Keep everything running smoothly. Verify stylists, manage payments, handle escalations. Be the operational backbone of BeautyCita.',
      requirements: ['Detail-oriented and organized', 'Multi-tasking and prioritization skills', 'Tech-savvy and quick learner', 'Problem solver with calm demeanor'],
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Beauty Specialist (Advisor)',
      type: 'Part-time / Contract / Remote',
      compensation: 'Hourly + commission on training programs',
      description: 'Licensed beauty professional to advise on industry standards, train stylists, and ensure quality. Help us understand the real needs of beauty pros.',
      requirements: ['Active beauty license', '5+ years industry experience', 'Teaching or training experience', 'Passion for elevating the profession'],
      gradient: 'from-purple-600 to-pink-600'
    }
  ]

  const benefits = [
    {
      icon: <GlobeAltIcon className="h-8 w-8" />,
      title: 'Remote-First',
      description: 'Work from anywhere. Most roles are fully remote with flexible hours and async communication.',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      title: 'Commission Opportunities',
      description: 'Many roles include commission based on platform success. Grow your income as BeautyCita grows.',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: 'Equity for Early Team',
      description: 'Early employees receive meaningful equity. Be an owner, not just an employee.',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: 'Growth Pathways',
      description: 'Start part-time or contract, grow into full-time leadership as we expand to new markets.',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  return (
    <div className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Hero Section */}
      <PageHero
        title="Join the BeautyCita Team"
        subtitle="Help us grow from Puerto Vallarta to the world - building trust one stylist, one client, one booking at a time"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/stylist-optimized.mp4"
        isDarkMode={isDarkMode}
        height="h-[500px]"
      >
        <div className={`inline-block px-6 py-3 rounded-full mt-6 ${
          isDarkMode
            ? 'bg-gray-800 text-gray-300'
            : 'bg-white/20 text-white backdrop-blur-sm'
        }`}>
          <p className="text-sm font-medium">
            Born in Puerto Vallarta 2023 • 10K Bookings & Counting • Aiming for 50K Clients
          </p>
        </div>
      </PageHero>

      {/* Our Story */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <GradientCard
              gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
              isDarkMode={isDarkMode}
              hoverable={false}
            >
              <h2 className={`text-3xl font-serif font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
                From Puerto Vallarta to the World: Our Story
              </h2>
              <div className="space-y-4">
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  BeautyCita was born in 2023 in <strong>Puerto Vallarta</strong> - not Silicon Valley, not a tech hub,
                  but a beautiful coastal city where real people face real problems booking beauty services. We started
                  with a laptop, hustle, and a simple belief: beauty professionals deserve better tools, and clients
                  deserve easier booking.
                </p>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  We didn't raise venture capital or launch with millions in funding. We couldn't afford fancy offices or
                  big marketing budgets. Instead, we walked door-to-door talking to salon owners, sat with stylists to
                  understand their pain points, and listened to clients who were frustrated with flaky booking systems.
                  Every line of code, every design, every video - <strong>we created it ourselves</strong>. We even wrote
                  our own theme song because we believe in authentic creativity over corporate branding.
                </p>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Today, we're approaching <strong>10,000 bookings processed</strong>, and we're aiming for 50,000 clients.
                  Not because of aggressive ads or paid influencers, but because stylists tell other stylists, and happy
                  clients tell their friends. That's grassroots growth - slow, authentic, sustainable.
                </p>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Our business model is built on partnership:</strong> We take a small commission (typically 3%)
                  from each booking. That's it. No hidden fees, no subscription traps. This lets us provide the platform,
                  handle payments securely, offer customer support, and market the service - all while letting stylists
                  keep 97% of what they earn. When they succeed, we succeed. It's honest, transparent, and built to last.
                </p>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  We're looking for people who believe in this approach - folks who understand that building something
                  meaningful takes time, that community trust beats viral growth, and that everyone should earn together.
                  If you're tired of corporate buzzwords and want to build something real with a scrappy, creative team,
                  you're in the right place.
                </p>
              </div>
            </GradientCard>
          </motion.div>
        </div>
      </PageSection>

      {/* Values */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        >
          Our Values
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

      {/* Open Positions */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
            Open Positions
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Multiple ways to earn: full-time, part-time, commission-only, contractor. We believe in flexible work arrangements.
          </p>
        </motion.div>

        <div className="space-y-6">
          {positions.map((position, index) => (
            <motion.div
              key={position.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={position.gradient}
                isDarkMode={isDarkMode}
                hoverable={true}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-4 rounded-full bg-gradient-to-br ${position.gradient} flex-shrink-0`}>
                        <position.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {position.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {position.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`mb-4 p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                      <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Compensation:
                      </p>
                      <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {position.compensation}
                      </p>
                    </div>

                    <p className={`leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {position.description}
                    </p>

                    <div className="space-y-2">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        What We're Looking For:
                      </p>
                      <ul className="space-y-2">
                        {position.requirements.map((req, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-br ${position.gradient}`}></div>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:ml-6 flex-shrink-0">
                    <a
                      href="mailto:careers@beautycita.com"
                      className={`block px-8 py-4 rounded-full font-semibold bg-gradient-to-r ${position.gradient} text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center`}
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* Benefits */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        >
          Benefits & Perks
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <FeatureCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              gradient={benefit.gradient}
              isDarkMode={isDarkMode}
              index={i}
            />
          ))}
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <CTASection
          title="Don't See Your Perfect Role?"
          description="We're always looking for talented people who share our values and want to build something meaningful. Send us your resume and tell us how you'd contribute to BeautyCita's grassroots-to-global journey."
          primaryAction={{
            label: 'Email Us',
            to: 'mailto:careers@beautycita.com'
          }}
          gradient="from-pink-600 via-purple-600 to-blue-600"
          icon={<BriefcaseIcon className="h-16 w-16" />}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <GradientCard
            gradient="from-purple-500/10 to-pink-500/10"
            isDarkMode={isDarkMode}
            hoverable={false}
          >
            <div className="text-center">
              <EnvelopeIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How to Apply
              </h3>
              <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Email:</strong> careers@beautycita.com</p>
                <p><strong>Subject Line:</strong> "Application - [Position Title] - [Your Name]"</p>
                <p className="text-sm mt-4">
                  Please include your resume, portfolio (if applicable), and a brief note about what excites you about BeautyCita.
                  Tell us about your experience with grassroots growth, community building, or commission-based work if relevant.
                </p>
              </div>
            </div>
          </GradientCard>
        </motion.div>
      </PageSection>

      {/* Footer Note */}
      <section className={`py-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`text-center text-sm space-y-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <p>
              <strong>About Our Commission Model:</strong> BeautyCita takes a small commission (typically 3%) from each booking
              to cover platform costs, payment processing, customer support, and marketing. This allows us to provide value to
              stylists while staying sustainable. Many of our team roles also include commission-based compensation tied to
              platform growth - we believe in earning together.
            </p>
            <p>
              BeautyCita is an equal opportunity employer. We celebrate diversity and are committed to creating
              an inclusive environment for all employees regardless of background, identity, or experience level.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CareersPage
