/**
 * Senior Frontend Engineer - Elena Rodriguez
 *
 * Expert in React 18, TypeScript, Vite, and modern frontend architecture
 */

class FrontendSenior {
  constructor() {
    this.name = 'Elena Rodriguez';
    this.role = 'Senior Frontend Engineer';
    this.id = 'frontend-senior';
  }

  /**
   * Review React component for best practices
   */
  reviewComponent(componentPath, code) {
    const issues = [];
    const suggestions = [];

    // Check for TypeScript usage
    if (!componentPath.endsWith('.tsx') && !componentPath.endsWith('.ts')) {
      suggestions.push({
        severity: 'medium',
        message: 'Consider converting to TypeScript for better type safety',
        category: 'TypeScript'
      });
    }

    // Check for proper prop types
    if (code.includes('function') && !code.includes('Props')) {
      suggestions.push({
        severity: 'high',
        message: 'Define explicit prop types interface for better type safety',
        category: 'TypeScript',
        example: `interface ComponentNameProps {\n  prop1: string;\n  prop2: number;\n}`
      });
    }

    // Check for accessibility
    if (code.includes('<button') || code.includes('<a')) {
      if (!code.includes('aria-')) {
        suggestions.push({
          severity: 'medium',
          message: 'Add ARIA labels for better accessibility',
          category: 'Accessibility'
        });
      }
    }

    // Check for proper error handling
    if (code.includes('fetch') || code.includes('axios')) {
      if (!code.includes('catch') && !code.includes('try')) {
        issues.push({
          severity: 'high',
          message: 'API calls should have proper error handling',
          category: 'Error Handling'
        });
      }
    }

    // Check for performance - memo usage
    if (code.includes('export default function') && code.includes('map(')) {
      suggestions.push({
        severity: 'low',
        message: 'Consider using React.memo() for components that render lists',
        category: 'Performance'
      });
    }

    return {
      componentPath,
      issues,
      suggestions,
      score: this.calculateScore(issues, suggestions)
    };
  }

  /**
   * Calculate component quality score
   */
  calculateScore(issues, suggestions) {
    let score = 100;

    issues.forEach(issue => {
      if (issue.severity === 'high') score -= 15;
      if (issue.severity === 'medium') score -= 10;
      if (issue.severity === 'low') score -= 5;
    });

    suggestions.forEach(suggestion => {
      if (suggestion.severity === 'high') score -= 10;
      if (suggestion.severity === 'medium') score -= 5;
      if (suggestion.severity === 'low') score -= 2;
    });

    return Math.max(0, score);
  }

  /**
   * Generate component template
   */
  generateComponent(name, type = 'functional') {
    return `import React from 'react';

interface ${name}Props {
  // Add your prop types here
}

/**
 * ${name} Component
 *
 * @description Add component description here
 */
const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
};

export default ${name};
`;
  }

  /**
   * Suggest performance optimizations
   */
  suggestOptimizations(bundleSize) {
    const recommendations = [];

    if (bundleSize > 1000) {
      recommendations.push({
        priority: 'high',
        area: 'Bundle Size',
        suggestion: 'Implement code splitting and lazy loading for large components',
        example: `const HeavyComponent = React.lazy(() => import('./HeavyComponent'));`
      });
    }

    recommendations.push({
      priority: 'medium',
      area: 'Images',
      suggestion: 'Use next-gen image formats (WebP) and implement lazy loading',
      example: `<img loading="lazy" src="image.webp" alt="description" />`
    });

    recommendations.push({
      priority: 'medium',
      area: 'State Management',
      suggestion: 'Consider using Zustand selectors to prevent unnecessary re-renders',
      example: `const specificValue = useStore(state => state.specificValue);`
    });

    return recommendations;
  }

  /**
   * Accessibility audit
   */
  auditAccessibility(component) {
    const checklist = [
      { check: 'Semantic HTML', passed: false },
      { check: 'ARIA labels', passed: false },
      { check: 'Keyboard navigation', passed: false },
      { check: 'Color contrast', passed: false },
      { check: 'Alt text for images', passed: false },
      { check: 'Focus indicators', passed: false }
    ];

    // Simple checks (in real implementation, would use AST parsing)
    if (component.includes('<main>') || component.includes('<header>')) {
      checklist[0].passed = true;
    }
    if (component.includes('aria-')) {
      checklist[1].passed = true;
    }
    if (component.includes('onKeyDown') || component.includes('tabIndex')) {
      checklist[2].passed = true;
    }
    if (component.includes('alt=')) {
      checklist[4].passed = true;
    }

    const passedCount = checklist.filter(item => item.passed).length;
    const score = (passedCount / checklist.length) * 100;

    return {
      score,
      checklist,
      recommendation: score < 70 ? 'Significant accessibility improvements needed' : 'Good accessibility practices'
    };
  }
}

module.exports = FrontendSenior;
