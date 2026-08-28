import React, { useState } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { runAutomatedTestSuite } from '../utils/verification';
import type { TestResult } from '../utils/verification';
import { CheckCircle2, XCircle, Play, ShieldCheck, RefreshCw, X } from 'lucide-react';

export const TestRunnerModal: React.FC = () => {
  const { setJourneyPhoto, clearJourneyPhoto, getJourneyPhotoUrl } = useBirthday();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const handleRunSuite = async () => {
    setIsRunning(true);
    try {
      const results = await runAutomatedTestSuite(
        setJourneyPhoto,
        clearJourneyPhoto,
        getJourneyPhotoUrl
      );
      setTestResults(results);
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  return (
    <>
      <button
        data-testid="open-test-suite-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 px-3 py-2 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider hover:border-amber-400 hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Run System Verification</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-amber-500/30 p-6 space-y-6 shadow-2xl my-8">
            
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-gold-gradient">
                    System Test & Verification Suite
                  </h2>
                  <p className="text-xs text-gray-400">
                    Automated tests for 25 Journey slots, IndexedDB persistence, Replace, Clear, and DOM frame rendering.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/50 p-4 rounded-2xl border border-amber-500/15">
              <div>
                <span className="text-xs font-mono text-amber-200 block">
                  {testResults.length > 0
                    ? `Executed ${testResults.length} automated test scenarios`
                    : 'Click run to execute all verification tests'}
                </span>
                {testResults.length > 0 && (
                  <span className={`text-xs font-semibold ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {allPassed ? '✓ All Tests Passed Successfully!' : '✖ Some tests failed'}
                  </span>
                )}
              </div>

              <button
                onClick={handleRunSuite}
                disabled={isRunning}
                data-testid="run-automated-tests-btn"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white font-semibold text-xs tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Running Tests...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Verification Tests</span>
                  </>
                )}
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {testResults.map((res) => (
                  <div
                    key={res.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                      res.passed
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-mono font-bold block">{res.id}: {res.name}</span>
                        <span className="text-gray-300 block text-[11px] mt-0.5">{res.message}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/40">
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-full bg-black/40 text-gray-300 text-xs font-semibold"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
