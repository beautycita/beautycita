/**
 * Contextual Help & Tooltips - BeautyCita UX Enhancement
 * For first-time users and feature discovery
 */

import React, { useState, useRef, useEffect } from 'react';

// ==================== TOOLTIP COMPONENT ====================

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  children: React.ReactElement;
  className?: string;
  maxWidth?: number;
  arrow?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  trigger = 'hover',
  delay = 200,
  children,
  className = '',
  maxWidth = 300,
  arrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) updatePosition();

    const handleScroll = () => {
      if (isVisible) updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isVisible]);

  const triggerProps: any = {};
  if (trigger === 'hover') {
    triggerProps.onMouseEnter = showTooltip;
    triggerProps.onMouseLeave = hideTooltip;
  } else if (trigger === 'click') {
    triggerProps.onClick = () => setIsVisible(!isVisible);
  } else if (trigger === 'focus') {
    triggerProps.onFocus = showTooltip;
    triggerProps.onBlur = hideTooltip;
  }

  return (
    <>
      {React.cloneElement(children, {
        ...triggerProps,
        ref: triggerRef,
      })}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg ${className}`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            maxWidth: `${maxWidth}px`,
          }}
          role="tooltip"
        >
          {content}
          {arrow && (
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
            />
          )}
        </div>
      )}
    </>
  );
};

// ==================== HELP BUTTON ====================

interface HelpButtonProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({
  content,
  position = 'top',
  className = '',
}) => {
  return (
    <Tooltip content={content} position={position}>
      <button
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors ${className}`}
        type="button"
        aria-label="Help"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    </Tooltip>
  );
};

// ==================== FEATURE TOUR ====================

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    });

    // Scroll to target
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight target
    target.classList.add('tour-highlight');

    return () => {
      target.classList.remove('tour-highlight');
    };
  }, [currentStep, isOpen, steps]);

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />

      {/* Tour Card */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl p-6 max-w-md"
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Skip tour"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">{step.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        <button
          onClick={onSkip}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
        >
          Skip tour
        </button>
      </div>
    </>
  );
};

// ==================== ONBOARDING CHECKLIST ====================

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingChecklistProps {
  tasks: OnboardingTask[];
  onTaskComplete: (taskId: string) => void;
  onDismiss: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  tasks,
  onTaskComplete,
  onDismiss,
}) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Get Started with BeautyCita
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {completedCount} of {tasks.length} completed
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border ${
              task.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {task.completed ? (
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>

            <div className="flex-1">
              <h4
                className={`text-sm font-medium ${
                  task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {task.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{task.description}</p>

              {!task.completed && task.action && (
                <button
                  onClick={task.action}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Complete task →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {completedCount === tasks.length && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            🎉 All done! You're ready to start using BeautyCita.
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== INLINE HELP TEXT ====================

interface InlineHelpProps {
  children: React.ReactNode;
  className?: string;
  icon?: 'info' | 'warning' | 'tip';
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  children,
  className = '',
  icon = 'info',
}) => {
  const iconSvg = {
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start space-x-2 p-3 rounded-lg bg-gray-50 ${className}`}>
      <div className="flex-shrink-0">{iconSvg[icon]}</div>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  );
};

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Simple tooltip
<Tooltip content="Click to edit your profile picture">
  <button>Edit Avatar</button>
</Tooltip>

// Example 2: Help button next to label
<div>
  <label>
    Booking Time
    <HelpButton content="Select your preferred appointment time. Times shown are in your local timezone." />
  </label>
  <input type="time" />
</div>

// Example 3: Feature tour
function Dashboard() {
  const [showTour, setShowTour] = useState(!hasSeenTour);

  const tourSteps: TourStep[] = [
    {
      id: '1',
      target: '#create-booking-button',
      title: 'Create Your First Booking',
      content: 'Click here to book an appointment with your favorite stylist.',
    },
    {
      id: '2',
      target: '#upcoming-bookings',
      title: 'View Your Bookings',
      content: 'All your upcoming appointments will appear here.',
    },
    {
      id: '3',
      target: '#profile-menu',
      title: 'Manage Your Profile',
      content: 'Update your profile, preferences, and payment methods.',
    },
  ];

  return (
    <>
      <Dashboard Content />

      <FeatureTour
        steps={tourSteps}
        isOpen={showTour}
        onComplete={() => {
          setShowTour(false);
          markTourComplete();
        }}
        onSkip={() => setShowTour(false)}
      />
    </>
  );
}

// Example 4: Onboarding checklist
function Onboarding() {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Complete your profile',
      description: 'Add your photo and contact information',
      completed: false,
      action: () => navigate('/profile/edit'),
    },
    {
      id: '2',
      title: 'Add a payment method',
      description: 'Securely save a card for faster checkout',
      completed: false,
      action: () => navigate('/settings/payment'),
    },
    {
      id: '3',
      title: 'Book your first appointment',
      description: 'Find a stylist and book your first session',
      completed: false,
      action: () => navigate('/book'),
    },
  ]);

  return (
    <OnboardingChecklist
      tasks={tasks}
      onTaskComplete={(taskId) => {
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        ));
      }}
      onDismiss={() => {}}
    />
  );
}

// Example 5: Inline help
<InlineHelp icon="tip">
  Pro tip: Book appointments at least 24 hours in advance for the best availability.
</InlineHelp>
*/
