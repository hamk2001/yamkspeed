import React, { useState, useEffect } from 'react';
import { CoreSpeedEngine } from '@/engine/orchestrator';
import type { TestResult, SpeedSample, Phase } from '@/engine/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const DevEngineHarness: React.FC = () => {
  const [engine] = useState(() => new CoreSpeedEngine());
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentLatency, setCurrentLatency] = useState<number>(0);
  const [currentJitter, setCurrentJitter] = useState<number>(0);
  const [resultsLog, setResultsLog] = useState<TestResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubPhase = engine.on('phase', (p) => setPhase(p));
    const unsubSample = engine.on('sample', (s: SpeedSample) => setCurrentSpeed(s.mbps));
    const unsubLat = engine.on('latencySample', (lat, jit) => {
      setCurrentLatency(lat);
      setCurrentJitter(jit);
    });
    const unsubResult = engine.on('result', (res) => {
      setResultsLog((prev) => [res, ...prev]);
    });
    const unsubError = engine.on('error', (err) => {
      setErrorMsg(`[${err.code}] ${err.message} in phase: ${err.phase}`);
    });

    return () => {
      unsubPhase();
      unsubSample();
      unsubLat();
      unsubResult();
      unsubError();
      engine.dispose();
    };
  }, [engine]);

  const handleStart = async (light = false) => {
    setErrorMsg(null);
    setCurrentSpeed(0);
    try {
      await engine.start({ light });
    } catch {
      // Handled in error event
    }
  };

  const handleExportCsv = () => {
    if (resultsLog.length === 0) return;
    const headers = [
      'StartedAt',
      'Engine',
      'ServerCity',
      'ServerCountry',
      'LatencyMs',
      'JitterMs',
      'DownloadMbps',
      'UploadMbps',
      'DownBytes',
      'UpBytes',
      'Quality',
    ];

    const rows = resultsLog.map((r) => [
      r.startedAt,
      r.engine,
      r.server.city || 'Unknown',
      r.server.country || 'Unknown',
      r.latencyMs.toFixed(1),
      r.jitterMs.toFixed(1),
      r.downloadMbps.toFixed(2),
      r.uploadMbps.toFixed(2),
      r.bytes.down,
      r.bytes.up,
      r.quality,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `speed_test_validation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 font-mono text-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">🔬 Engine Dev Harness</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Diagnostic testbed for verifying measurement streams, telemetry, and accuracy.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStart(false)}
            disabled={engine.isRunning}
          >
            Run Normal Test
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleStart(true)}
            disabled={engine.isRunning}
          >
            Run Light Test (≤10MB)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => engine.abort()}
            disabled={!engine.isRunning}
          >
            Abort
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[var(--danger)]/20 border border-[var(--danger)] text-[var(--danger)] rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Live Telemetry Display */}
      <Card variant="glass" className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase">Engine Phase</div>
          <div className="text-lg font-bold text-[var(--accent-down)] uppercase">{phase}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase">Live Throughput</div>
          <div className="text-lg font-bold text-[var(--text)]">
            {currentSpeed.toFixed(1)} Mbps
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase">Live Latency</div>
          <div className="text-lg font-bold text-[var(--accent-lat)]">
            {currentLatency.toFixed(0)} ms
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase">Live Jitter</div>
          <div className="text-lg font-bold text-[var(--accent-lat)]">
            {currentJitter.toFixed(1)} ms
          </div>
        </div>
      </Card>

      {/* Results Log & CSV Export */}
      <Card variant="glass" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text)]">
            Test Runs Log ({resultsLog.length})
          </h2>
          {resultsLog.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              Export CSV
            </Button>
          )}
        </div>

        {resultsLog.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] py-4 text-center">
            No test runs yet. Run a test to collect validation samples.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="pb-2 text-start">Engine</th>
                  <th className="pb-2 text-start">Server</th>
                  <th className="pb-2 text-start">Down (Mbps)</th>
                  <th className="pb-2 text-start">Up (Mbps)</th>
                  <th className="pb-2 text-start">Ping (ms)</th>
                  <th className="pb-2 text-start">Data (MB)</th>
                  <th className="pb-2 text-start">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {resultsLog.map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-2)]">
                    <td className="py-2">{r.engine}</td>
                    <td className="py-2">
                      {r.server.city}, {r.server.country}
                    </td>
                    <td className="py-2 font-bold text-[var(--accent-down)]">
                      {r.downloadMbps.toFixed(1)}
                    </td>
                    <td className="py-2 font-bold text-[var(--accent-up)]">
                      {r.uploadMbps.toFixed(1)}
                    </td>
                    <td className="py-2">{r.latencyMs.toFixed(0)}</td>
                    <td className="py-2">
                      {((r.bytes.down + r.bytes.up) / (1024 * 1024)).toFixed(1)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          r.quality === 'stable'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
