import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const AboutUs: React.FC = () => {
  const teamMembers = [
    {
      name: 'Sofia Martinez',
      role: 'CEO & Founder',
      image: '👩‍💼',
      bio: 'Former beauty industry executive with 15+ years experience building platforms that connect professionals with clients.'
    },
    {
      name: 'Marcus Chen',
      role: 'CTO',
      image: '👨‍💻',
      bio: 'Tech leader specializing in marketplace platforms and mobile-first experiences for service industries.'
    },
    {
      name: 'Isabella Rodriguez',
      role: 'Head of Beauty Operations',
      image: '💄',
      bio: 'Licensed cosmetologist and former salon owner who ensures our platform meets real industry needs.'
    },
    {
      name: 'David Kim',
      role: 'Head of Trust & Safety',
      image: '🛡️',
      bio: 'Former compliance officer focused on building safe, verified marketplaces for personal services.'
    }
  ]

  const values = [
    {
      icon: '🌟',
      title: 'Excellence',
      description: 'We maintain the highest standards for beauty professionals and service quality'
    },
    {
      icon: '🤝',
      title: 'Trust',
      description: 'Building a safe, verified platform where clients and professionals can connect confidently'
    },
    {
      icon: '📱',
      title: 'Innovation',
      description: 'Using technology to make beauty services more accessible and convenient for everyone'
    },
    {
      icon: '💎',
      title: 'Empowerment',
      description: 'Helping beauty professionals build thriving businesses while serving their communities'
    }
  ]

  const milestones = [
    { year: '2023', event: 'BeautyCita founded with a vision to revolutionize beauty booking' },
    { year: '2024', event: 'Launched MVP and onboarded first 100 verified beauty professionals' },
    { year: '2024', event: 'Processed 10,000+ successful bookings across 50+ cities' },
    { year: '2025', event: 'Expanded to medical spa services and luxury beauty experiences' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            About BeautyCita
          </h1>
          <p className="text-gray-600">
            Connecting beauty professionals with clients through technology
          </p>
        </div>
      </div>

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Revolutionizing Beauty Services
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-8">
              BeautyCita is more than a booking platform – we're building the future of beauty services.
              Our mission is to empower beauty professionals while making exceptional services accessible
              to everyone, anywhere, anytime.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2.8K+</div>
                <div className="text-gray-600">Verified Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
                <div className="text-gray-600">Cities Served</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Our Story */}
        <motion.div
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  BeautyCita was born from a simple frustration: booking quality beauty services was too complicated,
                  time-consuming, and often unreliable. As consumers, we wanted convenience and confidence. As
                  industry insiders, we knew talented professionals were struggling to reach new clients.
                </p>
                <p>
                  We realized technology could solve both problems. By creating a platform that prioritizes trust,
                  quality, and user experience, we could help beauty professionals grow their businesses while
                  giving clients the confidence to try new services and stylists.
                </p>
                <p>
                  Today, BeautyCita serves thousands of clients and professionals across multiple cities, from
                  everyday salon services to luxury spa experiences and medical aesthetics. But we're just getting started.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Our Vision</h3>
              <p className="text-gray-600">
                To become the world's most trusted platform for beauty and wellness services,
                empowering professionals and delighting clients everywhere.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Our Values */}
        <motion.div
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            What Drives Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              >
                <div className="text-5xl mb-4">{member.image}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Milestones */}
        <motion.div
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Journey
          </h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                >
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-3xl text-sm font-bold min-w-max">
                    {milestone.year}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{milestone.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Why Choose Us */}
        <motion.div
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Why Beauty Professionals Choose BeautyCita
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="text-3xl mb-3">📈</div>
                <h3 className="text-lg font-bold mb-2">Grow Your Business</h3>
                <p className="text-white/90 text-sm">
                  Access new clients, manage bookings, and increase revenue with our all-in-one platform
                </p>
              </div>
              <div>
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-lg font-bold mb-2">Safe & Secure</h3>
                <p className="text-white/90 text-sm">
                  Verified clients, secure payments, and professional protection for peace of mind
                </p>
              </div>
              <div>
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-bold mb-2">Simple Tools</h3>
                <p className="text-white/90 text-sm">
                  Easy-to-use dashboard, automated scheduling, and seamless client communication
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Link
                to="/register/stylist"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-3xl font-bold hover:bg-gray-100 transition-colors"
              >
                Join Our Network
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          className="text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Experience BeautyCita?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Whether you're looking for your next beauty appointment or want to grow your professional practice,
              we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register/client"
                className="bg-blue-600 text-white px-8 py-3 rounded-3xl font-medium hover:bg-blue-700 transition-colors"
              >
                Book Services
              </Link>
              <Link
                to="/contact"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="px-4 py-6 max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-3">
            © 2025 BeautyCita. All rights reserved.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms/client" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs