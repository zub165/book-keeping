/**
 * Development Standards Checker
 * Ensures all code follows established development standards
 */

class DevelopmentStandardsChecker {
    constructor() {
        this.standards = {
            // Code structure standards
            structure: {
                name: "Code Structure Standards",
                rules: [
                    "Functions should be under 50 lines",
                    "Classes should be under 200 lines", 
                    "Files should be under 500 lines",
                    "Consistent indentation (2 or 4 spaces)",
                    "No trailing whitespace"
                ]
            },
            
            // Naming conventions
            naming: {
                name: "Naming Conventions",
                rules: [
                    "Variables use camelCase",
                    "Functions use camelCase",
                    "Constants use UPPER_CASE",
                    "Classes use PascalCase",
                    "Descriptive names (no abbreviations)"
                ]
            },
            
            // Documentation standards
            documentation: {
                name: "Documentation Standards",
                rules: [
                    "All functions have JSDoc comments",
                    "Complex logic is commented",
                    "API endpoints are documented",
                    "README files are up to date"
                ]
            },
            
            // Security standards
            security: {
                name: "Security Standards",
                rules: [
                    "No hardcoded credentials",
                    "Input validation on all forms",
                    "SQL injection prevention",
                    "XSS protection implemented",
                    "CSRF protection enabled"
                ]
            },
            
            // Performance standards
            performance: {
                name: "Performance Standards",
                rules: [
                    "Efficient database queries",
                    "Minimal DOM manipulation",
                    "Proper caching strategies",
                    "Optimized API calls",
                    "Lazy loading where appropriate"
                ]
            }
        };
    }

    /**
     * Check code structure standards
     */
    checkStructure(code, filename) {
        const issues = [];
        const lines = code.split('\n');
        
        // Check file length
        if (lines.length > 500) {
            issues.push(`File ${filename} is too long (${lines.length} lines). Consider splitting.`);
        }
        
        // Check for consistent indentation
        const indentationPatterns = lines.map(line => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
        }).filter(length => length > 0);
        
        if (indentationPatterns.length > 0) {
            const mostCommon = this.getMostCommon(indentationPatterns);
            const inconsistent = indentationPatterns.filter(length => 
                length !== mostCommon && length % mostCommon !== 0
            );
            
            if (inconsistent.length > 0) {
                issues.push(`Inconsistent indentation found in ${filename}`);
            }
        }
        
        // Check for trailing whitespace
        const trailingWhitespace = lines.filter(line => line.match(/\s+$/));
        if (trailingWhitespace.length > 0) {
            issues.push(`Trailing whitespace found in ${filename}`);
        }
        
        return {
            standard: 'structure',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Check naming conventions
     */
    checkNaming(code, filename) {
        const issues = [];
        
        // Check variable naming (camelCase)
        const variablePattern = /(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = variablePattern.exec(code)) !== null) {
            const variableName = match[1];
            if (!this.isCamelCase(variableName) && !this.isUpperCase(variableName)) {
                issues.push(`Variable '${variableName}' should use camelCase or UPPER_CASE`);
            }
        }
        
        // Check function naming (camelCase)
        const functionPattern = /(?:function|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        while ((match = functionPattern.exec(code)) !== null) {
            const functionName = match[1];
            if (!this.isCamelCase(functionName)) {
                issues.push(`Function '${functionName}' should use camelCase`);
            }
        }
        
        // Check class naming (PascalCase)
        const classPattern = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        while ((match = classPattern.exec(code)) !== null) {
            const className = match[1];
            if (!this.isPascalCase(className)) {
                issues.push(`Class '${className}' should use PascalCase`);
            }
        }
        
        return {
            standard: 'naming',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Check documentation standards
     */
    checkDocumentation(code, filename) {
        const issues = [];
        
        // Check for JSDoc comments on functions
        const functionPattern = /(?:function|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = functionPattern.exec(code)) !== null) {
            const functionName = match[1];
            const functionIndex = match.index;
            
            // Look for JSDoc comment before function
            const beforeFunction = code.substring(0, functionIndex);
            if (!beforeFunction.includes('/**') && !beforeFunction.includes('* @')) {
                issues.push(`Function '${functionName}' should have JSDoc documentation`);
            }
        }
        
        // Check for complex logic comments
        const complexPatterns = [
            /if\s*\([^)]{50,}\)/g,  // Long if conditions
            /for\s*\([^)]{30,}\)/g,  // Complex for loops
            /while\s*\([^)]{30,}\)/g // Complex while loops
        ];
        
        complexPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push(`Complex logic found in ${filename} - should be commented`);
            }
        });
        
        return {
            standard: 'documentation',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Check security standards
     */
    checkSecurity(code, filename) {
        const issues = [];
        
        // Check for hardcoded credentials
        const credentialPatterns = [
            /password\s*=\s*['"][^'"]+['"]/gi,
            /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
            /secret\s*=\s*['"][^'"]+['"]/gi,
            /token\s*=\s*['"][^'"]+['"]/gi
        ];
        
        credentialPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push(`Hardcoded credentials found in ${filename}`);
            }
        });
        
        // Check for SQL injection vulnerabilities
        const sqlPattern = /(?:SELECT|INSERT|UPDATE|DELETE).*\+.*['"]/gi;
        if (sqlPattern.test(code)) {
            issues.push(`Potential SQL injection vulnerability in ${filename}`);
        }
        
        // Check for XSS vulnerabilities
        const xssPattern = /innerHTML\s*=\s*[^;]*\+/gi;
        if (xssPattern.test(code)) {
            issues.push(`Potential XSS vulnerability in ${filename}`);
        }
        
        return {
            standard: 'security',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Check performance standards
     */
    checkPerformance(code, filename) {
        const issues = [];
        
        // Check for inefficient DOM manipulation
        const domPatterns = [
            /document\.getElementById.*\.innerHTML/g,
            /document\.querySelector.*\.innerHTML/g
        ];
        
        domPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches && matches.length > 3) {
                issues.push(`Multiple DOM manipulations found in ${filename} - consider batching`);
            }
        });
        
        // Check for inefficient loops
        const loopPatterns = [
            /for\s*\([^)]*\.length[^)]*\)/g,
            /while\s*\([^)]*\.length[^)]*\)/g
        ];
        
        loopPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push(`Inefficient loop found in ${filename} - consider caching length`);
            }
        });
        
        return {
            standard: 'performance',
            issues: issues,
            passed: issues.length === 0
        };
    }

    /**
     * Run all standard checks on code
     */
    checkAllStandards(code, filename) {
        const results = {
            file: filename,
            checks: {
                structure: this.checkStructure(code, filename),
                naming: this.checkNaming(code, filename),
                documentation: this.checkDocumentation(code, filename),
                security: this.checkSecurity(code, filename),
                performance: this.checkPerformance(code, filename)
            },
            overallScore: 0,
            totalIssues: 0
        };
        
        // Calculate overall score
        const checkCount = Object.keys(results.checks).length;
        const passedCount = Object.values(results.checks).filter(check => check.passed).length;
        results.overallScore = Math.round((passedCount / checkCount) * 100);
        
        // Count total issues
        results.totalIssues = Object.values(results.checks)
            .reduce((total, check) => total + check.issues.length, 0);
        
        return results;
    }

    /**
     * Generate comprehensive standards report
     */
    generateStandardsReport(checkResults) {
        console.log('\n📋 DEVELOPMENT STANDARDS REPORT');
        console.log('===============================');
        
        checkResults.forEach(result => {
            console.log(`\n📁 ${result.file}`);
            console.log(`Overall Score: ${result.overallScore}%`);
            console.log(`Total Issues: ${result.totalIssues}`);
            
            Object.entries(result.checks).forEach(([standard, check]) => {
                const status = check.passed ? '✅' : '❌';
                console.log(`  ${status} ${this.standards[standard].name}`);
                
                if (!check.passed && check.issues.length > 0) {
                    check.issues.forEach(issue => {
                        console.log(`    ⚠️  ${issue}`);
                    });
                }
            });
        });
        
        // Calculate overall application score
        const totalFiles = checkResults.length;
        const totalScore = checkResults.reduce((sum, result) => sum + result.overallScore, 0);
        const averageScore = Math.round(totalScore / totalFiles);
        
        console.log(`\n🎯 OVERALL STANDARDS SCORE: ${averageScore}%`);
        
        if (averageScore >= 90) {
            console.log('🏆 EXCELLENT: Code follows all development standards!');
        } else if (averageScore >= 75) {
            console.log('✅ GOOD: Code mostly follows standards, minor improvements needed.');
        } else if (averageScore >= 60) {
            console.log('⚠️  FAIR: Code needs significant improvements.');
        } else {
            console.log('❌ POOR: Code needs major standards compliance improvements.');
        }
    }

    // Helper methods
    isCamelCase(str) {
        return /^[a-z][a-zA-Z0-9]*$/.test(str);
    }

    isPascalCase(str) {
        return /^[A-Z][a-zA-Z0-9]*$/.test(str);
    }

    isUpperCase(str) {
        return /^[A-Z_][A-Z0-9_]*$/.test(str);
    }

    getMostCommon(arr) {
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return parseInt(Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        ));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentStandardsChecker;
}

// Make available globally
window.DevelopmentStandardsChecker = DevelopmentStandardsChecker;
