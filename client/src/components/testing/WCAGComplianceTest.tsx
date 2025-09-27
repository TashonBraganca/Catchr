import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import wcagUtils from '../../utils/wcagCompliance';

interface ComplianceResult {
  passed: number;
  total: number;
  results: Array<{
    fg: string;
    bg: string;
    purpose: string;
    level: string;
    contrast: {
      ratio: number;
      isAA: boolean;
      isAAA: boolean;
      level: 'FAIL' | 'AA' | 'AAA';
    };
    passed: boolean;
    actualLevel: string;
    expectedLevel: string;
  }>;
}

export default function WCAGComplianceTest(): React.ReactElement {
  const [complianceResults, setComplianceResults] = useState<ComplianceResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Validate all color combinations
    const results = wcagUtils.validateAllCombinations();
    setComplianceResults(results);

    // Log validation results to console
    wcagUtils.logWCAGValidation();

    // Show component after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!complianceResults || !isVisible) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="glass-medium p-8 rounded-xl">
          <div className="animate-spin w-8 h-8 border-4 border-orange-primary border-t-transparent rounded-full"></div>
          <p className="text-orange-bright mt-4 font-primary">Validating WCAG Compliance...</p>
        </div>
      </div>
    );
  }

  const { passed, total, results } = complianceResults;
  const passPercentage = Math.round((passed / total) * 100);

  return (
    <div className="min-h-screen bg-black p-6 font-primary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="glass-medium p-8 rounded-xl mb-8 text-center">
          <h1 className="text-4xl font-bold text-orange-bright mb-4">
            🎨 CATHCR Orange Palette
          </h1>
          <h2 className="text-2xl text-text-primary mb-6">
            WCAG 2.1 Compliance Report
          </h2>

          {/* Overall Score */}
          <div className="inline-flex items-center space-x-4">
            <div className="text-6xl">
              {passPercentage === 100 ? '🟢' : passPercentage >= 80 ? '🟡' : '🔴'}
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-primary">
                {passPercentage}%
              </div>
              <div className="text-text-secondary">
                {passed} of {total} combinations passed
              </div>
            </div>
          </div>
        </div>

        {/* Color Combinations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-light p-6 rounded-xl border-2 ${
                result.passed
                  ? 'border-green-500/30 bg-green-900/10'
                  : 'border-red-500/30 bg-red-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">
                  {result.passed ? '✅' : '❌'}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-mono ${
                  result.actualLevel === 'AAA'
                    ? 'bg-green-600 text-white'
                    : result.actualLevel === 'AA'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {result.actualLevel}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {result.purpose}
              </h3>

              <div className="flex items-center space-x-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg border border-orange-light"
                  style={{ backgroundColor: result.fg }}
                  title={`Foreground: ${result.fg}`}
                />
                <span className="text-text-secondary">on</span>
                <div
                  className="w-12 h-12 rounded-lg border border-orange-light"
                  style={{ backgroundColor: result.bg }}
                  title={`Background: ${result.bg}`}
                />
              </div>

              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Contrast Ratio:</span>
                  <span className="text-orange-bright">
                    {result.contrast.ratio.toFixed(2)}:1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Expected:</span>
                  <span className="text-orange-glow">{result.expectedLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Actual:</span>
                  <span className={
                    result.actualLevel === 'AAA' ? 'text-green-400' :
                    result.actualLevel === 'AA' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {result.actualLevel}
                  </span>
                </div>
              </div>

              {/* Live Example */}
              <div
                className="mt-4 p-3 rounded-lg"
                style={{
                  backgroundColor: result.bg,
                  color: result.fg
                }}
              >
                <p className="font-primary">Sample text in this combination</p>
                <p className="text-xs opacity-75">This shows actual readability</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Orange Palette Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-medium p-8 rounded-xl"
        >
          <h3 className="text-2xl font-bold text-orange-bright mb-6 text-center">
            WCAG-Compliant Orange Palette
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(wcagUtils.ORANGE_PALETTE).map(([key, value]) => {
              if (typeof value !== 'string' || !value.startsWith('#')) return null;

              const contrast = wcagUtils.getContrastRatio(value, '#000000');
              const compliance = wcagUtils.checkWCAGCompliance(value, '#000000');

              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  className="glass-light p-4 rounded-xl text-center"
                >
                  <div
                    className="w-full h-16 rounded-lg mb-3 border border-orange-light"
                    style={{ backgroundColor: value }}
                  />
                  <h4 className="font-semibold text-text-primary mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-xs font-mono text-orange-bright mb-2">
                    {value}
                  </p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Ratio:</span>
                      <span className="text-orange-glow">
                        {contrast.toFixed(1)}:1
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-mono ${
                      compliance.level === 'AAA'
                        ? 'bg-green-600 text-white'
                        : compliance.level === 'AA'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {compliance.level}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-text-secondary"
        >
          <p className="text-sm">
            ✨ All colors tested for WCAG 2.1 Level AA & AAA compliance
          </p>
          <p className="text-xs mt-2 opacity-75">
            Open browser console to see detailed validation results
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}