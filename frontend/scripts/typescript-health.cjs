#!/usr/bin/env node

/**
 * TypeScript Health Monitoring Script
 * Tracks TypeScript errors and provides improvement recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.join(__dirname, '../typescript-health-report.json');

class TypeScriptHealthMonitor {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            errors: [],
            summary: {},
            recommendations: []
        };
    }

    async runTypeScriptCheck() {
        console.log('🔍 Running TypeScript health check...');

        try {
            execSync('npx tsc --noEmit --skipLibCheck', {
                cwd: path.dirname(__dirname),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            console.log('✅ No TypeScript errors found');
            return [];
        } catch (error) {
            const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
            return this.parseTypeScriptErrors(errorOutput);
        }
    }

    parseTypeScriptErrors(output) {
        const errors = [];
        const lines = output.split('\n');

        for (const line of lines) {
            const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
            if (match) {
                const [, file, line, column, code, message] = match;
                errors.push({
                    file: file.replace(process.cwd() + '/', ''),
                    line: parseInt(line),
                    column: parseInt(column),
                    code,
                    message
                });
            }
        }

        return errors;
    }

    categorizeErrors(errors) {
        const categories = {
            'Missing types': [],
            'Unused variables': [],
            'Type mismatches': [],
            'Missing properties': [],
            'Other': []
        };

        errors.forEach(error => {
            if (error.code === 'TS2307') {
                categories['Missing types'].push(error);
            } else if (error.code === 'TS6133' || error.code === 'TS6196') {
                categories['Unused variables'].push(error);
            } else if (error.code === 'TS2322' || error.code === 'TS2345') {
                categories['Type mismatches'].push(error);
            } else if (error.code === 'TS2339') {
                categories['Missing properties'].push(error);
            } else {
                categories['Other'].push(error);
            }
        });

        return categories;
    }

    generateRecommendations(categories) {
        const recommendations = [];

        if (categories['Missing types'].length > 0) {
            const packageNames = new Set();
            categories['Missing types'].forEach(error => {
                const match = error.message.match(/Cannot find module '([^']+)'/);
                if (match) packageNames.add(match[1]);
            });

            if (packageNames.size > 0) {
                recommendations.push({
                    priority: 'High',
                    action: 'Install missing type definitions',
                    details: `Run: npm install --save-dev ${Array.from(packageNames).map(pkg => '@types/' + pkg.replace(/^@/, '').replace('/', '__')).join(' ')}`,
                    count: categories['Missing types'].length
                });
            }
        }

        if (categories['Unused variables'].length > 0) {
            recommendations.push({
                priority: 'Medium',
                action: 'Clean up unused imports and variables',
                details: 'Remove unused imports and variables to improve code quality',
                count: categories['Unused variables'].length
            });
        }

        if (categories['Type mismatches'].length > 0) {
            recommendations.push({
                priority: 'High',
                action: 'Fix type mismatches',
                details: 'Update types to match actual usage and fix any type casting issues',
                count: categories['Type mismatches'].length
            });
        }

        if (categories['Missing properties'].length > 0) {
            recommendations.push({
                priority: 'High',
                action: 'Update interfaces and types',
                details: 'Add missing properties to interfaces or make them optional',
                count: categories['Missing properties'].length
            });
        }

        return recommendations;
    }

    generateReport(errors) {
        const categories = this.categorizeErrors(errors);
        const recommendations = this.generateRecommendations(categories);

        this.report.errors = errors;
        this.report.summary = {
            totalErrors: errors.length,
            categories: Object.keys(categories).reduce((acc, key) => {
                acc[key] = categories[key].length;
                return acc;
            }, {})
        };
        this.report.recommendations = recommendations;

        // Save report
        fs.writeFileSync(REPORT_FILE, JSON.stringify(this.report, null, 2));

        return this.report;
    }

    displayReport(report) {
        console.log('\n📊 TypeScript Health Report');
        console.log('═'.repeat(50));
        console.log(`Total Errors: ${report.summary.totalErrors}`);
        console.log('\nError Categories:');

        Object.entries(report.summary.categories).forEach(([category, count]) => {
            if (count > 0) {
                console.log(`  • ${category}: ${count}`);
            }
        });

        if (report.recommendations.length > 0) {
            console.log('\n🔧 Recommendations:');
            report.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
                console.log(`     ${rec.details}`);
                console.log(`     Affects ${rec.count} errors\n`);
            });
        }

        console.log(`Report saved to: ${REPORT_FILE}`);
    }

    async run() {
        const errors = await this.runTypeScriptCheck();
        const report = this.generateReport(errors);
        this.displayReport(report);

        return errors.length === 0;
    }
}

// CLI usage
if (require.main === module) {
    const monitor = new TypeScriptHealthMonitor();
    monitor.run().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error running TypeScript health check:', error);
        process.exit(1);
    });
}

module.exports = TypeScriptHealthMonitor;