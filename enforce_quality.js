/**
 * Code Quality Enforcer
 * Automatically applies application rules to ensure consistent quality
 */

class CodeQualityEnforcer {
    constructor() {
        this.rules = {
            // Array handling patterns
            arrayHandling: {
                pattern: /(\w+)\.(find|filter|map|reduce|forEach)\(/g,
                replacement: (match, variable, method) => {
                    return `Array.isArray(${variable}) ? ${variable}.${method}(` : `[].${method}(`;
                },
                validation: (code) => {
                    return code.includes('Array.isArray') && code.includes('response.results');
                }
            },
            
            // Error handling patterns
            errorHandling: {
                pattern: /(async\s+\w+\([^)]*\)\s*\{[^}]*await[^}]*\})/g,
                replacement: (match) => {
                    if (!match.includes('try') && !match.includes('catch')) {
                        return match.replace(
                            /async\s+(\w+)\(([^)]*)\)\s*\{([^}]*)\}/,
                            'async $1($2) {\n    try {\n        $3\n    } catch (error) {\n        console.error(\'Error in $1:\', error);\n        throw error;\n    }\n}'
                        );
                    }
                    return match;
                },
                validation: (code) => {
                    return code.includes('try') && code.includes('catch');
                }
            },
            
            // User experience patterns
            userExperience: {
                pattern: /(await\s+\w+\([^)]*\))/g,
                replacement: (match) => {
                    return `console.log('Loading...');\n        ${match}\n        console.log('Loaded successfully');`;
                },
                validation: (code) => {
                    return code.includes('console.log') && code.includes('Loading');
                }
            }
        };
    }

    /**
     * Enforce array handling rules
     */
    enforceArrayHandling(code) {
        let improvedCode = code;
        
        // Add array validation before array methods
        const arrayMethodPattern = /(\w+)\.(find|filter|map|reduce|forEach)\(/g;
        improvedCode = improvedCode.replace(arrayMethodPattern, (match, variable, method) => {
            if (!improvedCode.includes(`Array.isArray(${variable})`)) {
                return `Array.isArray(${variable}) ? ${variable}.${method}(` : `[].${method}(`;
            }
            return match;
        });
        
        // Add paginated response handling
        const apiCallPattern = /const\s+(\w+)\s*=\s*await\s+(\w+)\.(\w+)\(/g;
        improvedCode = improvedCode.replace(apiCallPattern, (match, variable, api, method) => {
            if (!improvedCode.includes(`${variable}.results`)) {
                return `const response = await ${api}.${method}(\n        const ${variable} = response.results || response;\n        console.log('${method} response:', response);`;
            }
            return match;
        });
        
        return improvedCode;
    }

    /**
     * Enforce error handling rules
     */
    enforceErrorHandling(code) {
        let improvedCode = code;
        
        // Wrap API calls in try-catch
        const apiCallPattern = /(async\s+\w+\([^)]*\)\s*\{[^}]*await[^}]*\})/g;
        improvedCode = improvedCode.replace(apiCallPattern, (match) => {
            if (!match.includes('try') && !match.includes('catch')) {
                return match.replace(
                    /async\s+(\w+)\(([^)]*)\)\s*\{([^}]*)\}/,
                    'async $1($2) {\n    try {\n        $3\n    } catch (error) {\n        console.error(\'Error in $1:\', error);\n        app.utils.showAlert(`Error: ${error.message}`, \'danger\');\n        throw error;\n    }\n}'
                );
            }
            return match;
        });
        
        return improvedCode;
    }

    /**
     * Enforce user experience rules
     */
    enforceUserExperience(code) {
        let improvedCode = code;
        
        // Add loading indicators
        const asyncPattern = /(async\s+\w+\([^)]*\)\s*\{[^}]*await[^}]*\})/g;
        improvedCode = improvedCode.replace(asyncPattern, (match) => {
            if (!match.includes('loading') && !match.includes('spinner')) {
                return match.replace(
                    /async\s+(\w+)\(([^)]*)\)\s*\{([^}]*)\}/,
                    'async $1($2) {\n        console.log(\'Loading $1...\');\n        $3\n        console.log(\'$1 completed successfully\');\n    }'
                );
            }
            return match;
        });
        
        return improvedCode;
    }

    /**
     * Enforce role-based access control
     */
    enforceRoleBasedAccess(code) {
        let improvedCode = code;
        
        // Add permission checks for admin features
        const adminFeaturePattern = /(admin|Admin|ADMIN)/g;
        if (adminFeaturePattern.test(code)) {
            if (!code.includes('checkUserRole') && !code.includes('can_view_all')) {
                improvedCode = `// Check user permissions before showing admin features
        const userRole = await checkUserRole();
        if (!userRole || (!userRole.can_view_all && userRole.role !== 'admin')) {
            console.log('Access denied: Admin privileges required');
            return;
        }\n\n${improvedCode}`;
            }
        }
        
        return improvedCode;
    }

    /**
     * Apply all quality improvements to code
     */
    improveCode(code) {
        console.log('🔧 Applying code quality improvements...');
        
        let improvedCode = code;
        
        // Apply all rules
        improvedCode = this.enforceArrayHandling(improvedCode);
        improvedCode = this.enforceErrorHandling(improvedCode);
        improvedCode = this.enforceUserExperience(improvedCode);
        improvedCode = this.enforceRoleBasedAccess(improvedCode);
        
        console.log('✅ Code quality improvements applied');
        
        return improvedCode;
    }

    /**
     * Generate quality report
     */
    generateQualityReport(code) {
        const report = {
            arrayHandling: this.rules.arrayHandling.validation(code),
            errorHandling: this.rules.errorHandling.validation(code),
            userExperience: this.rules.userExperience.validation(code),
            roleBasedAccess: code.includes('checkUserRole') || code.includes('can_view_all')
        };
        
        const totalRules = Object.keys(report).length;
        const passedRules = Object.values(report).filter(Boolean).length;
        const qualityScore = Math.round((passedRules / totalRules) * 100);
        
        return {
            report,
            qualityScore,
            recommendations: this.generateRecommendations(report)
        };
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations(report) {
        const recommendations = [];
        
        if (!report.arrayHandling) {
            recommendations.push('Add Array.isArray() validation before array methods');
        }
        
        if (!report.errorHandling) {
            recommendations.push('Wrap API calls in try-catch blocks');
        }
        
        if (!report.userExperience) {
            recommendations.push('Add loading indicators for async operations');
        }
        
        if (!report.roleBasedAccess) {
            recommendations.push('Implement role-based access control');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeQualityEnforcer;
}

// Make available globally
window.CodeQualityEnforcer = CodeQualityEnforcer;
