import React, { useState } from 'react';
import { MultiStepWizard, WizardStep } from '../components/wizard/MultiStepWizard';
import { PhoneVerification } from '../components/onboarding/PhoneVerification';
import { SMSConsent, SMSPreferences } from '../components/onboarding/SMSConsent';
import { FavoriteButton } from '../components/favorites/FavoriteButton';
import { usePageMeta } from '../hooks/usePageMeta';
import FormikOnboardingPage from './profile/FormikOnboardingPage';

/**
 * Component Test Page
 *
 * This page allows you to test all newly created components in isolation
 * Access at: /component-test
 */
export default function ComponentTestPage() {
  usePageMeta({
    title: 'Component Testing - BeautyCita',
    description: 'Test page for new components',
  });

  const [activeTest, setActiveTest] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test components
  const tests = [
    {
      id: 'phone-verification',
      name: 'Phone Verification',
      description: 'Test Twilio SMS verification flow',
      component: (
        <PhoneVerification
          onVerified={(phone) => {
            addResult(`✅ Phone verified: ${phone}`);
            alert(`Phone verified: ${phone}`);
          }}
          onCancel={() => {
            addResult('❌ Phone verification cancelled');
          }}
        />
      ),
    },
    {
      id: 'sms-consent',
      name: 'SMS Consent',
      description: 'Test SMS notification preferences',
      component: (
        <SMSConsent
          onSave={async (prefs: SMSPreferences) => {
            addResult(`✅ SMS preferences saved: ${JSON.stringify(prefs, null, 2)}`);
            console.log('SMS Preferences:', prefs);
          }}
          onSkip={() => {
            addResult('⏭️ SMS consent skipped');
          }}
        />
      ),
    },
    {
      id: 'wizard',
      name: 'Multi-Step Wizard',
      description: 'Test wizard with multiple steps',
      component: (
        <MultiStepWizard
          steps={[
            {
              id: 'step1',
              title: 'Step 1',
              description: 'This is the first step',
              component: (
                <div className="p-8 bg-gray-50 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Step 1 Content</h3>
                  <p className="text-gray-600">
                    This is a test step. Click Next to continue.
                  </p>
                </div>
              ),
            },
            {
              id: 'step2',
              title: 'Step 2',
              description: 'This is the second step',
              component: (
                <div className="p-8 bg-blue-50 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Step 2 Content</h3>
                  <p className="text-gray-600">
                    Middle step. You can go back or forward.
                  </p>
                </div>
              ),
              validate: async () => {
                // Simulate validation
                await new Promise(resolve => setTimeout(resolve, 1000));
                return true;
              },
            },
            {
              id: 'step3',
              title: 'Step 3',
              description: 'Final step (optional)',
              component: (
                <div className="p-8 bg-green-50 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Step 3 Content</h3>
                  <p className="text-gray-600">
                    This is an optional step. You can skip it.
                  </p>
                </div>
              ),
              optional: true,
            },
          ]}
          onComplete={() => {
            addResult('✅ Wizard completed!');
            alert('Wizard completed!');
          }}
          onCancel={() => {
            addResult('❌ Wizard cancelled');
          }}
        />
      ),
    },
    {
      id: 'favorite-button',
      name: 'Favorite Button',
      description: 'Test favorite button with different sizes',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Small Size</h3>
            <FavoriteButton stylistId={123} size="sm" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Medium Size (default)</h3>
            <FavoriteButton stylistId={123} size="md" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Large Size with Label</h3>
            <FavoriteButton stylistId={123} size="lg" showLabel={true} />
          </div>
          <div className="bg-gray-100 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">On a Card (example)</h3>
            <div className="relative bg-white rounded-3xl shadow-lg p-6 max-w-sm">
              <div className="absolute top-4 right-4">
                <FavoriteButton stylistId={456} />
              </div>
              <div className="h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-2xl mb-4"></div>
              <h4 className="font-semibold text-lg">Sample Stylist</h4>
              <p className="text-gray-600">Los Angeles, CA</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'integrated-wizard',
      name: 'Integrated Wizard',
      description: 'Test wizard with phone verification and SMS consent',
      component: (
        <IntegratedWizardTest onResult={addResult} />
      ),
    },
    {
      id: 'stylist-onboarding',
      name: 'Two-Part Stylist Onboarding',
      description: 'Complete stylist registration flow',
      component: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">💇</span>
              Two-Part Stylist Onboarding Flow
            </h3>
            <div className="space-y-3 text-sm text-purple-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <strong className="block mb-1">Part 1: Basic Registration (Client Access)</strong>
                  <p className="text-purple-700">
                    User creates account with email/phone, gets CLIENT role immediately.
                    Can browse stylists and book appointments right away.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <strong className="block mb-1">Part 2: Stylist Upgrade (Optional)</strong>
                  <p className="text-purple-700">
                    User completes stylist profile: business details, services, portfolio, pricing.
                    Role upgraded to STYLIST. Gets dashboard, booking management, Stripe Connect.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-xl">
              <p className="text-xs text-purple-700">
                <strong>Key Benefit:</strong> Reduces friction - users can start booking immediately,
                then upgrade to stylist when ready. No forced lengthy onboarding upfront.
              </p>
            </div>
          </div>
          <FormikOnboardingPage />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Component Testing Lab
          </h1>
          <p className="text-gray-600">
            Test all newly created components in isolation before integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Available Tests</h2>
              <div className="space-y-2">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => {
                      setActiveTest(test.id);
                      setTestResults([]);
                    }}
                    className={`
                      w-full text-left p-4 rounded-xl transition-all
                      ${activeTest === test.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <div className="font-semibold">{test.name}</div>
                    <div className={`text-sm mt-1 ${activeTest === test.id ? 'text-white/90' : 'text-gray-600'}`}>
                      {test.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Test Results Log */}
              {testResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Test Results</h3>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono max-h-64 overflow-y-auto">
                    {testResults.map((result, idx) => (
                      <div key={idx} className="mb-1">{result}</div>
                    ))}
                  </div>
                  <button
                    onClick={() => setTestResults([])}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear Results
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Test Display */}
          <div className="lg:col-span-2">
            {activeTest ? (
              <div className="bg-white rounded-3xl shadow-lg p-8">
                {tests.find(t => t.id === activeTest)?.component}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🧪</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Test
                </h3>
                <p className="text-gray-600">
                  Choose a component from the left to start testing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-3xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Testing Instructions</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <strong>Phone Verification:</strong> Requires Twilio backend to be running. Test with your actual phone number.</li>
            <li>• <strong>SMS Consent:</strong> Tests preference saving to backend API.</li>
            <li>• <strong>Wizard:</strong> Tests navigation, validation, and step completion.</li>
            <li>• <strong>Favorite Button:</strong> Requires authentication. Tests toggle functionality.</li>
            <li>• <strong>Integrated Wizard:</strong> Tests full onboarding flow with all components.</li>
          </ul>
        </div>

        {/* Backend Status */}
        <BackendStatus />
      </div>
    </div>
  );
}

// Integrated wizard test
function IntegratedWizardTest({ onResult }: { onResult: (msg: string) => void }) {
  const [phone, setPhone] = useState('');
  const [smsPrefs, setSmsPrefs] = useState<SMSPreferences | null>(null);

  const steps: WizardStep[] = [
    {
      id: 'info',
      title: 'Info',
      description: 'Basic information',
      component: (
        <div className="p-8 bg-gray-50 rounded-xl">
          <h3 className="text-xl font-bold mb-4">Welcome!</h3>
          <p className="text-gray-600">
            This wizard demonstrates the integration of phone verification and SMS consent.
          </p>
        </div>
      ),
    },
    {
      id: 'phone',
      title: 'Phone',
      description: 'Verify your phone number',
      component: (
        <PhoneVerification
          onVerified={(p) => {
            setPhone(p);
            onResult(`Phone verified: ${p}`);
          }}
        />
      ),
    },
    {
      id: 'sms',
      title: 'Notifications',
      description: 'SMS preferences',
      component: (
        <SMSConsent
          onSave={async (prefs) => {
            setSmsPrefs(prefs);
            onResult(`SMS preferences saved: ${Object.keys(prefs).filter(k => prefs[k as keyof SMSPreferences]).length} enabled`);
          }}
        />
      ),
      optional: true,
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'All done!',
      component: (
        <div className="p-8 bg-green-50 rounded-xl text-center">
          <h3 className="text-2xl font-bold text-green-900 mb-4">✓ Setup Complete!</h3>
          <div className="text-left max-w-md mx-auto">
            <p className="text-gray-700 mb-4">Summary:</p>
            <ul className="space-y-2 text-sm">
              <li><strong>Phone:</strong> {phone || 'Not verified'}</li>
              <li><strong>SMS Preferences:</strong> {smsPrefs ? `${Object.values(smsPrefs).filter(Boolean).length} notifications enabled` : 'Not set'}</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MultiStepWizard
      steps={steps}
      onComplete={() => {
        onResult('✅ Integrated wizard completed!');
        alert('Onboarding complete!');
      }}
    />
  );
}

// Backend status checker
function BackendStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('https://beautycita.com/api/health')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ status: 'error' });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mt-8 bg-gray-100 rounded-3xl p-6">
        <div className="animate-pulse">Loading backend status...</div>
      </div>
    );
  }

  const isHealthy = status?.status === 'ok';

  return (
    <div className={`mt-8 rounded-3xl p-6 ${isHealthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <h3 className={`font-semibold mb-2 ${isHealthy ? 'text-green-900' : 'text-red-900'}`}>
        {isHealthy ? '✅ Backend Online' : '❌ Backend Offline'}
      </h3>
      <div className={`text-sm ${isHealthy ? 'text-green-800' : 'text-red-800'}`}>
        {isHealthy ? (
          <>
            <div>Database: {status.services?.database}</div>
            <div>Redis: {status.services?.redis}</div>
            <div>OAuth: {status.services?.oauth?.googleClientIdConfigured ? 'Configured' : 'Not configured'}</div>
          </>
        ) : (
          <div>Cannot connect to API. Make sure the backend is running.</div>
        )}
      </div>
    </div>
  );
}
