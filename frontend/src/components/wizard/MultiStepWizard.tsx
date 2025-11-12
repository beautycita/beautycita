import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
  initialStep?: number;
  showProgress?: boolean;
  allowSkip?: boolean;
  className?: string;
}

/**
 * Reusable multi-step wizard component
 *
 * @example
 * const steps = [
 *   { id: 'step1', title: 'Basic Info', component: <Step1 /> },
 *   { id: 'step2', title: 'Verification', component: <Step2 /> },
 * ];
 *
 * <MultiStepWizard steps={steps} onComplete={handleComplete} />
 */
export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  initialStep = 0,
  showProgress = true,
  allowSkip = false,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    // Validate current step if validator exists
    if (currentStepData.validate) {
      setIsValidating(true);
      try {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Move to next step or complete
    if (isLastStep) {
      await onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (allowSkip && currentStepData.optional) {
      if (isLastStep) {
        onComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow jumping to completed steps
    if (completedSteps.has(stepIndex) || stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          {/* Steps Indicator */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;
              const isClickable = completedSteps.has(index) || index <= currentStep;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Circle */}
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={`
                      relative flex flex-col items-center
                      ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 font-semibold text-sm
                        ${isCurrent
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ring-4 ring-pink-200 scale-110'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : isPast
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-200 text-gray-500'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-medium text-center max-w-20
                        ${isCurrent ? 'text-purple-600' : 'text-gray-600'}
                      `}
                    >
                      {step.title}
                    </span>
                  </button>

                  {/* Connector Line */}
                  {index < totalSteps - 1 && (
                    <div
                      className={`
                        flex-1 h-1 mx-2 rounded transition-all duration-300
                        ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {/* Step Description */}
          {currentStepData.description && (
            <p className="text-gray-600 mb-6">{currentStepData.description}</p>
          )}

          {/* Step Component */}
          {currentStepData.component}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex gap-4">
          {/* Back Button */}
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isValidating}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </button>
          )}

          {/* Cancel Button */}
          {onCancel && isFirstStep && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isValidating}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex gap-4">
          {/* Skip Button */}
          {allowSkip && currentStepData.optional && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isValidating}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          )}

          {/* Next/Complete Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isValidating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validating...
              </>
            ) : (
              <>
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ArrowRightIcon className="h-5 w-5" />}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Step {currentStep + 1} of {totalSteps}
        {currentStepData.optional && (
          <span className="ml-2 text-gray-400">(Optional)</span>
        )}
      </div>
    </div>
  );
};

export default MultiStepWizard;
