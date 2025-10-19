import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CodeBracketIcon, ChevronDownIcon, HeartIcon } from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const LicensesPage: React.FC = () => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedLicense, setExpandedLicense] = useState<number | null>(null);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const licenses = [
    {
      name: 'React',
      version: '18.2.0',
      license: 'MIT License',
      description: 'A JavaScript library for building user interfaces',
      gradient: 'from-cyan-500 to-blue-600',
      fullText: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`
    },
    {
      name: 'Tailwind CSS',
      version: '3.3.0',
      license: 'MIT License',
      description: 'A utility-first CSS framework for rapid UI development',
      gradient: 'from-teal-500 to-cyan-600',
      fullText: `MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...`
    },
    {
      name: 'Framer Motion',
      version: '10.16.0',
      license: 'MIT License',
      description: 'A production-ready motion library for React',
      gradient: 'from-pink-500 to-purple-600',
      fullText: `MIT License

Copyright (c) 2018 Framer B.V.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`
    },
    {
      name: 'Heroicons',
      version: '2.0.0',
      license: 'MIT License',
      description: 'Beautiful hand-crafted SVG icons by the makers of Tailwind CSS',
      gradient: 'from-purple-500 to-indigo-600',
      fullText: `MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software")...`
    },
    {
      name: 'TypeScript',
      version: '5.2.0',
      license: 'Apache License 2.0',
      description: 'TypeScript is a language for application-scale JavaScript',
      gradient: 'from-blue-500 to-indigo-600',
      fullText: `Apache License
Version 2.0, January 2004

Copyright (c) Microsoft Corporation.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License...`
    },
    {
      name: 'Vite',
      version: '4.5.0',
      license: 'MIT License',
      description: 'Next generation frontend tooling',
      gradient: 'from-yellow-500 to-orange-600',
      fullText: `MIT License

Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...`
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Open Source Licenses"
        subtitle="We stand on the shoulders of giants - honoring the open source community"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      />

      {/* Introduction */}
      <section className="container mx-auto px-4 max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
            <div className="flex items-start space-x-4">
              <HeartIcon className="h-8 w-8 text-pink-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Built with Open Source
                </h2>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  BeautyCita is built using amazing open source software. We're grateful to the developers and
                  contributors who make these tools available. This page lists the open source projects we use
                  and their respective licenses.
                </p>
              </div>
            </div>
          </GradientCard>
        </motion.div>
      </section>

      {/* Licenses List */}
      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Third-Party Licenses
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Click on any license to view the full text
          </p>
        </motion.div>

        <div className="space-y-4">
          {licenses.map((license, index) => (
            <motion.div
              key={license.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <GradientCard gradient={`${license.gradient}/10`} isDarkMode={isDarkMode}>
                <button
                  onClick={() => setExpandedLicense(expandedLicense === index ? null : index)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-3xl bg-gradient-to-r ${license.gradient} flex-shrink-0`}>
                        <CodeBracketIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {license.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            v{license.version}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            license.license.includes('MIT')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {license.license}
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {license.description}
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={`h-5 w-5 flex-shrink-0 ml-4 transition-transform ${
                        expandedLicense === index ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                  </div>
                </button>

                {expandedLicense === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t"
                    style={{
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Full License Text
                    </h4>
                    <pre className={`text-xs leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-full overflow-x-auto ${
                      isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {license.fullText}
                    </pre>
                  </motion.div>
                )}
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white relative z-10 px-4"
        >
          <HeartIcon className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Support Open Source
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            These projects make our work possible. Consider supporting them and contributing to the
            open source community.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Learn How to Contribute
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default LicensesPage;
