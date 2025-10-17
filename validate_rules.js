/**
 * Application Rules Validation Script
 * Validates that all code follows the established application rules
 */

class ApplicationRulesValidator {
    constructor() {
        this.rules = {
            arrayHandling: {
                name: "Array Handling Rules",
                checks: [
                    "Array.isArray() validation before array methods",
                    "Paginated response handling with response.results || response",
                    "Fallback empty arrays for failed API calls"
                ]
            },
            errorHandling: {
                name: "Error Handling Rules", 
                checks: [
                    "Try-catch blocks around all API calls",
                    "User-friendly error messages",
                    "Detailed error logging for debugging",
                    "Loading states during API calls"
                ]
            },
            roleBasedAccess: {
                name: "Role-Based Access Control",
                checks: [
                    "User permission checks before showing UI",
                    "Role validation on frontend and backend",
                    "Admin features hidden from non-admin users",
                    "Proper authentication checks"
                ]
            },
            apiTesting: {
                name: "API Testing Rules",
                checks: [
                    "All API endpoints tested",
                    "Response structure validation",
                    "Error scenario testing",
                    "Authentication flow testing"
                ]
            },
            userExperience: {
                name: "User Experience Rules",
                checks: [
                    "Clear feedback for user actions",
                    "Loading indicators for async operations",
                    "Consistent error message styling",
                    "Helpful error descriptions"
                ]
            }
        };
        
        this.validationResults = {};
    }

    /**
     * Validate array handling in JavaScript code
     */
    validateArrayHandling(code) {
        const issues = [];
        
        // Check for direct array method calls without validation
        const arrayMethodPatterns = [
            /\.find\(/g,
            /\.filter\(/g, 
            /\.map\(/g,
            /\.reduce\(/g,
            /\.forEach\(/g
        ];
        
        arrayMethodPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                // Check if Array.isArray() is used before these methods
                const lines = code.split('\n');
                matches.forEach(match => {
                    const lineIndex = code.indexOf(match);
                    const beforeLine = code.substring(0, lineIndex);
                    if (!beforeLine.includes('Array.isArray') && !beforeLine.includes('response.results')) {
                        issues.push(`Array method ${match} used without validation`);
                    }
                });
            }
        });
        
        return {
            rule: 'arrayHandling',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Validate error handling patterns
     */
    validateErrorHandling(code) {
        const issues = [];
        
        // Check for API calls without try-catch
        const apiCallPatterns = [
            /await\s+\w+\.\w+\(/g,
            /fetch\(/g,
            /axios\./g
        ];
        
        apiCallPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const lineIndex = code.indexOf(match);
                    const beforeLine = code.substring(0, lineIndex);
                    if (!beforeLine.includes('try') && !beforeLine.includes('catch')) {
                        issues.push(`API call ${match} not wrapped in try-catch`);
                    }
                });
            }
        });
        
        return {
            rule: 'errorHandling',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Validate role-based access control
     */
    validateRoleBasedAccess(code) {
        const issues = [];
        
        // Check for admin features without permission checks
        const adminFeaturePatterns = [
            /admin/i,
            /can_view_all/i,
            /role.*admin/i
        ];
        
        adminFeaturePatterns.forEach(pattern => {
            if (code.match(pattern)) {
                // Check if permission is validated
                if (!code.includes('checkUserRole') && !code.includes('can_view_all')) {
                    issues.push('Admin features found without permission validation');
                }
            }
        });
        
        return {
            rule: 'roleBasedAccess',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Validate user experience patterns
     */
    validateUserExperience(code) {
        const issues = [];
        
        // Check for loading states
        if (code.includes('await') && !code.includes('loading') && !code.includes('spinner')) {
            issues.push('Async operations without loading indicators');
        }
        
        // Check for error messages
        if (code.includes('catch') && !code.includes('showAlert') && !code.includes('error')) {
            issues.push('Error handling without user feedback');
        }
        
        return {
            rule: 'userExperience',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Run all validations on a code file
     */
    validateFile(filePath, code) {
        console.log(`🔍 Validating ${filePath}...`);
        
        const results = {
            file: filePath,
            validations: {
                arrayHandling: this.validateArrayHandling(code),
                errorHandling: this.validateErrorHandling(code),
                roleBasedAccess: this.validateRoleBasedAccess(code),
                userExperience: this.validateUserExperience(code)
            },
            overallScore: 0,
            totalIssues: 0
        };
        
        // Calculate overall score
        const validationCount = Object.keys(results.validations).length;
        const passedCount = Object.values(results.validations).filter(v => v.passed).length;
        results.overallScore = Math.round((passedCount / validationCount) * 100);
        
        // Count total issues
        results.totalIssues = Object.values(results.validations)
            .reduce((total, validation) => total + validation.issues.length, 0);
        
        return results;
    }

    /**
     * Generate validation report
     */
    generateReport(validationResults) {
        console.log('\n📊 APPLICATION RULES VALIDATION REPORT');
        console.log('=====================================');
        
        validationResults.forEach(result => {
            console.log(`\n📁 ${result.file}`);
            console.log(`Overall Score: ${result.overallScore}%`);
            console.log(`Total Issues: ${result.totalIssues}`);
            
            Object.entries(result.validations).forEach(([rule, validation]) => {
                const status = validation.passed ? '✅' : '❌';
                console.log(`  ${status} ${this.rules[rule].name}`);
                
                if (!validation.passed && validation.issues.length > 0) {
                    validation.issues.forEach(issue => {
                        console.log(`    ⚠️  ${issue}`);
                    });
                }
            });
        });
        
        // Calculate overall application score
        const totalFiles = validationResults.length;
        const totalScore = validationResults.reduce((sum, result) => sum + result.overallScore, 0);
        const averageScore = Math.round(totalScore / totalFiles);
        
        console.log(`\n🎯 OVERALL APPLICATION SCORE: ${averageScore}%`);
        
        if (averageScore >= 90) {
            console.log('🏆 EXCELLENT: Application follows all rules!');
        } else if (averageScore >= 75) {
            console.log('✅ GOOD: Application mostly follows rules, minor improvements needed.');
        } else if (averageScore >= 60) {
            console.log('⚠️  FAIR: Application needs significant improvements.');
        } else {
            console.log('❌ POOR: Application needs major rule compliance improvements.');
        }
    }

    /**
     * Validate all application files
     */
    async validateApplication() {
        console.log('🚀 Starting Application Rules Validation...\n');
        
        // This would be expanded to validate all files in the application
        const filesToValidate = [
            'js/django-app.js',
            'js/django-auth.js',
            'index.html'
        ];
        
        const validationResults = [];
        
        // In a real implementation, this would read and validate actual files
        console.log('📝 Note: This is a demonstration of the validation system.');
        console.log('In production, this would validate actual application files.');
        
        return validationResults;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplicationRulesValidator;
}

// Make available globally
window.ApplicationRulesValidator = ApplicationRulesValidator;
