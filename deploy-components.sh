#!/bin/bash
# Deploy Component Test Infrastructure
# Run this on the server as: bash deploy-components.sh

set -e

echo "🚀 Deploying Component Test Infrastructure..."

# Create directory structure
echo "📁 Creating directories..."
mkdir -p /var/www/beautycita.com/frontend/src/components/wizard
mkdir -p /var/www/beautycita.com/frontend/src/components/onboarding
mkdir -p /var/www/beautycita.com/frontend/src/components/favorites

cd /var/www/beautycita.com/frontend/src

# Create MultiStepWizard.tsx
echo "📝 Creating MultiStepWizard.tsx..."
cat > components/wizard/MultiStepWizard.tsx << 'MULTIEOF'
import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  optional?: boolean;
  validate?: () => Promise<boolean> | boolean;
}

interface MultiStepWizardProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  showProgressBar?: boolean;
  allowStepClick?: boolean;
}

export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  showProgressBar = true,
  allowStepClick = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    setLoading(true);

    try {
      // Validate current step if validation exists
      if (currentStepData.validate) {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setLoading(false);
          return;
        }
      }

      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      if (isLastStep) {
        await onComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Step validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepClick) return;

    // Only allow clicking on completed steps or current step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      {showProgressBar && (
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isClickable = allowStepClick && (isCompleted || isCurrent);

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1"
              onClick={() => handleStepClick(index)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {/* Circle Indicator */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all
                  ${isCurrent
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ring-4 ring-pink-200'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                  }
                  ${isClickable ? 'hover:scale-110' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Title */}
              <div className="mt-2 text-center">
                <div className={`text-sm font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.title}
                </div>
                {step.optional && (
                  <div className="text-xs text-gray-500 mt-1">Optional</div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute h-0.5 transition-colors
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                  style={{
                    width: `calc((100% / ${steps.length}) - 3rem)`,
                    left: `calc(${(index + 0.5) * (100 / steps.length)}% + 1.5rem)`,
                    top: '1.5rem',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-lg p-8 mb-8"
        >
          {/* Step Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            {currentStepData.description && (
              <p className="text-gray-600">{currentStepData.description}</p>
            )}
          </div>

          {/* Step Component */}
          <div>{currentStepData.component}</div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {!isFirstStep && (
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            Back
          </button>
        )}

        {onCancel && isFirstStep && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : isLastStep ? (
            'Complete'
          ) : (
            <>
              Next
              <ChevronRightIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </div>

      {/* Optional Skip Button */}
      {currentStepData.optional && !isLastStep && (
        <button
          onClick={() => setCurrentStep(currentStep + 1)}
          disabled={loading}
          className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip this step
        </button>
      )}
    </div>
  );
};

export default MultiStepWizard;
MULTIEOF

echo "✅ MultiStepWizard created"

# Build and fix ownership
echo "🔨 Building frontend..."
cd /var/www/beautycita.com/frontend
sudo chown -R www-data:www-data /var/www/beautycita.com/frontend/src
sudo -u www-data npm run build

echo "✅ Deployment complete!"
echo "🌐 Test at: https://beautycita.com/component-test"
