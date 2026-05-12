/**
 * CyberSecTab — interactive cybersecurity scenario simulator for the OT
 * + IT layers of the refinery.
 *
 * Lets the user pick from a library of representative attacks (port scan,
 * ransomware on HMI, Modbus MITM, phishing on the engineering
 * workstation, exfiltration via DNS, ICS-CERT-style PLC ladder tamper),
 * then walks through a scripted DETECT → INVESTIGATE → CONTAIN → ERADICATE
 * → RECOVER flow with live SIEM alerts and a workflow board.
 *
 * Everything is mocked frontend; visually it reads like a real plant
 * SOC console.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ShieldAlert,
  Skull,
  Lock,
  Bug,
  Mail,
  Cog,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'
import { Panel, PanelHeader, Kpi, DataRow } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/* ─── scenario library ─────────────────────────────────────────────── */

type Severity = 'INFO' | 'LOW' | 'MED' | 'HIGH' | 'CRIT'
type Phase = 'IDLE' | 'DETECT' | 'INVESTIGATE' | 'CONTAIN' | 'ERADICATE' | 'RECOVER' | 'DONE'

const PHASE_ORDER: Phase[] = ['DETECT', 'INVESTIGATE', 'CONTAIN', 'ERADICATE', 'RECOVER', 'DONE']

interface Event {
  ts: string
  source: string
  message: string
  severity: Severity
  phase: Phase
}

interface Scenario {
  id: string
  title: string
  family: string
  icon: React.ReactNode
  vector: string
  target: string
  mitre: string  // ATT&CK reference
  summary: string
  events: { offsetSec: number; phase: Phase; severity: Severity; source: string; message: string }[]
  containment: string[]
  containmentRecommendation: string
  impactIfMissed: string
  /** ms between offsetSec units → speed multiplier 1.0 = real time */
  speed?: number
}

const SCENARIOS: Scenario[] = [
  {
    id: 'port-scan',
    title: 'External port scan · OT edge',
    family: 'RECON',
    icon: <Bug className="w-3.5 h-3.5" />,
    vector: '203.0.113.42 → OT edge firewall',
    target: 'fw-dn (OT Edge Firewall)',
    mitre: 'TA0043 · Reconnaissance · T1595 Active Scanning',
    summary: 'External actor sweeps the OT edge firewall on Modbus (502), DNP3 (20000) and EtherNet/IP (44818) ports. No connections succeed; Cortex anomaly fires on the scan signature.',
    events: [
      { offsetSec: 0, phase: 'DETECT',     severity: 'INFO', source: 'fw-dn',  message: 'TCP SYN scan detected · 14 ports · 203.0.113.42' },
      { offsetSec: 2, phase: 'DETECT',     severity: 'LOW',  source: 'siem',   message: 'Suricata rule 2024.04 · OT port enumeration' },
      { offsetSec: 4, phase: 'DETECT',     severity: 'MED',  source: 'cortex', message: 'CORTEX.ANOMALY · scan rate × 9 vs baseline · score 0.81' },
      { offsetSec: 6, phase: 'INVESTIGATE', severity: 'MED', source: 'soc',    message: 'Analyst pulls 24h netflow for 203.0.113.42 — no successful conns' },
      { offsetSec: 9, phase: 'CONTAIN',    severity: 'MED',  source: 'fw-up',  message: 'Auto-rule pushed: drop 203.0.113.42 at corp edge' },
      { offsetSec: 12, phase: 'ERADICATE', severity: 'INFO', source: 'soc',    message: 'IP added to global blocklist · shared via STIX' },
      { offsetSec: 15, phase: 'RECOVER',   severity: 'INFO', source: 'siem',   message: 'No service impact · no further activity' },
      { offsetSec: 17, phase: 'DONE',      severity: 'INFO', source: 'soc',    message: 'Incident closed · ticket SOC-2026-0541' },
    ],
    containment: ['Auto-block at corp edge', 'Update WAF rules', 'Notify CIRT', 'Stix/TAXII share'],
    containmentRecommendation: 'Block IP at corp edge. Push to shared threat-intel.',
    impactIfMissed: 'Recon → targeted exploit. Could enable later phishing or VPN credential stuffing.',
  },
  {
    id: 'ransomware-hmi',
    title: 'Ransomware on HMI console',
    family: 'IMPACT',
    icon: <Lock className="w-3.5 h-3.5" />,
    vector: 'malicious USB → HMI-1 in control room A',
    target: 'hmi1 (HMI Console #1)',
    mitre: 'T1486 Data Encrypted for Impact · TA0040 Impact',
    summary: 'Operator plugs an unauthorized USB into HMI-1. Ransomware payload runs, begins encrypting local files and tries to spread laterally to the DCS server pair.',
    events: [
      { offsetSec: 0,  phase: 'DETECT',     severity: 'MED',  source: 'edr',    message: 'New USB mass-storage device on hmi1 (vendor=SanDisk)' },
      { offsetSec: 2,  phase: 'DETECT',     severity: 'HIGH', source: 'edr',    message: 'hmi1 · suspicious AppData\\Local\\Temp\\enc.exe spawned' },
      { offsetSec: 4,  phase: 'DETECT',     severity: 'HIGH', source: 'edr',    message: 'hmi1 · enc.exe · rapid file extension changes → .lockd' },
      { offsetSec: 5,  phase: 'DETECT',     severity: 'CRIT', source: 'siem',   message: 'CORTEX.ANOMALY · file-write rate × 184 vs baseline' },
      { offsetSec: 6,  phase: 'DETECT',     severity: 'CRIT', source: 'siem',   message: 'SMB enumeration to dcs-srv from hmi1 · LATERAL MOVEMENT' },
      { offsetSec: 8,  phase: 'INVESTIGATE', severity: 'HIGH', source: 'soc',   message: 'Analyst confirms ransomware family · NotPetya-like' },
      { offsetSec: 10, phase: 'CONTAIN',    severity: 'CRIT', source: 'soc',    message: 'Network-isolate hmi1 · disable user account · pull memory' },
      { offsetSec: 12, phase: 'CONTAIN',    severity: 'HIGH', source: 'ot-dc',  message: 'Block SMB on hmi1 VLAN at l2-sw · revoke session' },
      { offsetSec: 14, phase: 'ERADICATE',  severity: 'HIGH', source: 'soc',    message: 'Re-image hmi1 from golden image · restore from backup' },
      { offsetSec: 17, phase: 'RECOVER',    severity: 'MED',  source: 'soc',    message: 'HMI-2 takes over control room A · operator briefed' },
      { offsetSec: 20, phase: 'RECOVER',    severity: 'INFO', source: 'siem',   message: 'No DCS lateral compromise confirmed' },
      { offsetSec: 22, phase: 'DONE',       severity: 'INFO', source: 'soc',    message: 'Incident closed · MTTR 18m · USB whitelist policy updated' },
    ],
    containment: ['Network-isolate HMI', 'Disable account', 'Block SMB at switch', 'Pull memory image', 'Re-image from gold'],
    containmentRecommendation: 'Network-isolate the HMI within 60 seconds of the file-write spike. Re-image from gold; DR-restored DCS is the priority.',
    impactIfMissed: 'Full control-room blackout. Forced operator-attended manual shutdown. Estimated 12-24 h lost production = $4-8M.',
  },
  {
    id: 'modbus-mitm',
    title: 'Modbus MITM on Utilities PLC',
    family: 'TAMPER',
    icon: <WifiOff className="w-3.5 h-3.5" />,
    vector: 'compromised contractor laptop on plant Wi-Fi',
    target: 'plc3 (PLC · Utilities)',
    mitre: 'T0830 Adversary-in-the-Middle · TA0108 Impair Process Control',
    summary: 'Contractor laptop hijacks the ARP table on the plant Wi-Fi VLAN, sits between the engineering workstation and the Utilities PLC, and starts rewriting Modbus register values.',
    events: [
      { offsetSec: 0,  phase: 'DETECT',     severity: 'LOW',  source: 'wifi',   message: 'New device joined plant WIFI · MAC 00:1A:7F:21:99:0B' },
      { offsetSec: 2,  phase: 'DETECT',     severity: 'MED',  source: 'l2-sw',  message: 'ARP gratuitous flood from new MAC' },
      { offsetSec: 4,  phase: 'DETECT',     severity: 'HIGH', source: 'edr',    message: 'plc3 · Modbus write rate × 6 vs baseline' },
      { offsetSec: 5,  phase: 'DETECT',     severity: 'CRIT', source: 'cortex', message: 'CORTEX.ANOMALY · setpoint drift on PLC-3 register HR-1432' },
      { offsetSec: 6,  phase: 'DETECT',     severity: 'CRIT', source: 'sis',    message: 'SIS · setpoint deviation alarm · safe-state warning' },
      { offsetSec: 8,  phase: 'INVESTIGATE', severity: 'HIGH', source: 'soc',   message: 'Network capture shows ARP poisoning · contractor laptop confirmed' },
      { offsetSec: 10, phase: 'CONTAIN',    severity: 'CRIT', source: 'l2-sw',  message: 'Port-shut contractor switch port · revoke WPA3 cert' },
      { offsetSec: 12, phase: 'CONTAIN',    severity: 'HIGH', source: 'cct',    message: 'Re-pin EWS ARP table · restore PLC HR-1432 from backup' },
      { offsetSec: 15, phase: 'ERADICATE',  severity: 'MED',  source: 'soc',    message: 'Forensics image of contractor laptop · confiscated' },
      { offsetSec: 18, phase: 'RECOVER',    severity: 'INFO', source: 'soc',    message: 'Utilities PLC verified · setpoints restored · process stable' },
      { offsetSec: 20, phase: 'DONE',       severity: 'INFO', source: 'soc',    message: 'Incident closed · contractor account terminated' },
    ],
    containment: ['Shut switch port', 'Revoke WPA3 cert', 'Re-pin ARP', 'Restore PLC registers'],
    containmentRecommendation: 'Shut the offending switch port within 90 seconds of the setpoint-drift alert. Restore PLC registers from the last known-good snapshot.',
    impactIfMissed: 'Process upset, off-spec product, or — worst case — SIS trip into safe state. ~4 h batch loss = $300-500K.',
  },
  {
    id: 'phishing-ews',
    title: 'Phishing → engineering workstation',
    family: 'INITIAL ACCESS',
    icon: <Mail className="w-3.5 h-3.5" />,
    vector: 'spear-phish email → ews user opens macro',
    target: 'ews (Engineering Workstation)',
    mitre: 'T1566 Phishing · T1059 Command and Scripting',
    summary: 'A spear-phishing email arrives masquerading as a Cognite firmware update. The engineer opens it; the macro tries to download a stage-2 payload from a typo-squatted domain.',
    events: [
      { offsetSec: 0, phase: 'DETECT',     severity: 'LOW',  source: 'mail',   message: 'Inbound mail from cognite-secure.com (typo) flagged' },
      { offsetSec: 2, phase: 'DETECT',     severity: 'MED',  source: 'edr',    message: 'ews · WINWORD.EXE spawned PowerShell · suspicious' },
      { offsetSec: 4, phase: 'DETECT',     severity: 'HIGH', source: 'edr',    message: 'ews · PowerShell DownloadString to badhost.tld' },
      { offsetSec: 5, phase: 'DETECT',     severity: 'HIGH', source: 'fw-dn',  message: 'Outbound HTTPS to badhost.tld · DNS sinkholed' },
      { offsetSec: 7, phase: 'INVESTIGATE', severity: 'MED', source: 'soc',    message: 'Email confirmed phishing · 12 other users targeted' },
      { offsetSec: 9, phase: 'CONTAIN',    severity: 'HIGH', source: 'soc',    message: 'Disable ews user account · revoke OT-DC token' },
      { offsetSec: 11, phase: 'CONTAIN',   severity: 'MED',  source: 'mail',   message: 'Purge phishing email from all mailboxes · 12 targets' },
      { offsetSec: 13, phase: 'ERADICATE', severity: 'MED',  source: 'edr',    message: 'Remove stage-1 macro + scheduled task · re-image' },
      { offsetSec: 15, phase: 'RECOVER',   severity: 'INFO', source: 'soc',    message: 'Restore EWS · mandatory MFA reset for affected users' },
      { offsetSec: 17, phase: 'DONE',      severity: 'INFO', source: 'soc',    message: 'Incident closed · awareness campaign queued' },
    ],
    containment: ['Disable account', 'Sinkhole DNS', 'Purge mail', 'Re-image EWS', 'Force MFA reset'],
    containmentRecommendation: 'Quarantine email + disable EWS account before stage-2 lands. Sinkhole DNS is already in place — confirm.',
    impactIfMissed: 'Initial access into OT domain. Could chain into ransomware (see scenario #2).',
  },
  {
    id: 'plc-ladder',
    title: 'Unauthorized PLC ladder modification',
    family: 'TAMPER',
    icon: <Cog className="w-3.5 h-3.5" />,
    vector: 'engineering credentials leaked → CIP write to PLC-1',
    target: 'plc1 (CDU-100 train PLC)',
    mitre: 'T0836 Modify Parameter · TA0108 Impair Process Control',
    summary: 'Stolen engineering credentials write a modified ladder logic to PLC-1, attempting to override the CDU bottoms temperature alarm. Cortex catches the deviation against the signed gold logic.',
    events: [
      { offsetSec: 0,  phase: 'DETECT',     severity: 'INFO', source: 'edr',    message: 'CIP session opened to plc1 from ews · normal' },
      { offsetSec: 3,  phase: 'DETECT',     severity: 'MED',  source: 'l2-sw',  message: 'plc1 · ladder logic write at non-maintenance hours' },
      { offsetSec: 5,  phase: 'DETECT',     severity: 'HIGH', source: 'cortex', message: 'CORTEX.ANOMALY · PLC-1 ladder hash != gold' },
      { offsetSec: 6,  phase: 'DETECT',     severity: 'CRIT', source: 'sis',    message: 'CDU bottoms TT-100 alarm threshold drifted' },
      { offsetSec: 8,  phase: 'INVESTIGATE', severity: 'HIGH', source: 'soc',   message: 'Diff vs gold · TT-100 alarm raised from 358 °C → 415 °C' },
      { offsetSec: 10, phase: 'CONTAIN',    severity: 'CRIT', source: 'soc',    message: 'Force-reload gold ladder to plc1 · 12 seconds downtime' },
      { offsetSec: 13, phase: 'CONTAIN',    severity: 'HIGH', source: 'ot-dc',  message: 'Engineering account locked · session terminated' },
      { offsetSec: 15, phase: 'ERADICATE',  severity: 'MED',  source: 'soc',    message: 'Forensics on session origin · IP traced to VPN exit' },
      { offsetSec: 18, phase: 'RECOVER',    severity: 'INFO', source: 'soc',    message: 'PLC-1 verified · operator briefed · alarm restored' },
      { offsetSec: 20, phase: 'DONE',       severity: 'INFO', source: 'soc',    message: 'Incident closed · credential rotation in progress' },
    ],
    containment: ['Force-reload gold ladder', 'Lock account', 'Kill session', 'Forensics on origin'],
    containmentRecommendation: 'Force-reload gold ladder to PLC-1 immediately. Lock the engineering account; verify SIS independent of the PLC.',
    impactIfMissed: 'Silent override of CDU safety alarms. Possible flange or seal failure → fire. Multi-million USD plus injuries.',
  },
  {
    id: 'dns-exfil',
    title: 'DNS-tunnel exfiltration · historian',
    family: 'EXFIL',
    icon: <Skull className="w-3.5 h-3.5" />,
    vector: 'compromised historian replica → DNS tunnel',
    target: 'hist-rep (Historian Replica)',
    mitre: 'T1048.003 Exfil over Unencrypted Non-C2 · T1071.004 DNS',
    summary: 'A compromised historian replica in the IDMZ begins leaking process data out via DNS TXT queries to a controlled domain. Cortex flags the entropy + query-rate anomaly.',
    events: [
      { offsetSec: 0,  phase: 'DETECT',     severity: 'INFO', source: 'dns',    message: 'hist-rep DNS queries → exfilsink.tld (NXDOMAIN)' },
      { offsetSec: 3,  phase: 'DETECT',     severity: 'MED',  source: 'siem',   message: 'DNS query rate from hist-rep × 8 baseline' },
      { offsetSec: 5,  phase: 'DETECT',     severity: 'HIGH', source: 'cortex', message: 'CORTEX.ANOMALY · query entropy 7.4 · TXT records' },
      { offsetSec: 7,  phase: 'INVESTIGATE', severity: 'HIGH', source: 'soc',   message: 'Decoded base32 in TXT queries · contains process tag values' },
      { offsetSec: 9,  phase: 'CONTAIN',    severity: 'HIGH', source: 'fw-up',  message: 'Block exfilsink.tld at corp DNS · sinkhole' },
      { offsetSec: 11, phase: 'CONTAIN',    severity: 'MED',  source: 'soc',    message: 'Isolate hist-rep · take memory image' },
      { offsetSec: 14, phase: 'ERADICATE',  severity: 'MED',  source: 'soc',    message: 'Rebuild hist-rep from clean image · re-onboard share' },
      { offsetSec: 17, phase: 'RECOVER',    severity: 'INFO', source: 'soc',    message: 'Historian replica re-synced · 24 h re-baseline' },
      { offsetSec: 19, phase: 'DONE',       severity: 'INFO', source: 'soc',    message: 'Incident closed · data classification audit' },
    ],
    containment: ['Sinkhole DNS', 'Isolate host', 'Memory image', 'Rebuild from clean'],
    containmentRecommendation: 'Sinkhole the exfil domain immediately. Treat the historian as compromised until rebuilt.',
    impactIfMissed: 'Production-data theft: blending recipes, ULSD targets, run plans. Competitive disadvantage + possible regulatory exposure.',
  },
]

/* ─── helpers ─────────────────────────────────────────────────────── */

function severityTone(s: Severity): 'snow' | 'cyan' | 'signal' | 'amber' | 'flare' | 'alarm' {
  return s === 'CRIT' ? 'alarm' : s === 'HIGH' ? 'flare' : s === 'MED' ? 'amber' : s === 'LOW' ? 'cyan' : 'snow'
}

const PHASE_INDEX: Record<Phase, number> = {
  IDLE: -1, DETECT: 0, INVESTIGATE: 1, CONTAIN: 2, ERADICATE: 3, RECOVER: 4, DONE: 5,
}

const PHASE_COLORS: Record<Phase, string> = {
  IDLE: '#7a8aa1',
  DETECT: '#ffb627',
  INVESTIGATE: '#4ee2f4',
  CONTAIN: '#ef4444',
  ERADICATE: '#ff6b35',
  RECOVER: '#34d57b',
  DONE: '#1ea7ff',
}

function utcTimeOffset(offset: number): string {
  // base time
  const base = new Date('2026-05-12T18:00:00Z').getTime()
  return new Date(base + offset * 1000).toISOString().slice(11, 19) + 'Z'
}

/* ─── component ────────────────────────────────────────────────────── */

export function CyberSecTab() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id)
  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === scenarioId)!, [scenarioId])

  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const tickerRef = useRef<number | null>(null)

  // Visible events grow as scenario advances
  const visible = useMemo<Event[]>(() => {
    return scenario.events
      .filter((e) => e.offsetSec <= tick)
      .map((e) => ({
        ts: utcTimeOffset(e.offsetSec),
        source: e.source,
        message: e.message,
        severity: e.severity,
        phase: e.phase,
      }))
  }, [scenario, tick])

  const currentPhase: Phase = visible.length === 0
    ? 'IDLE'
    : visible[visible.length - 1].phase

  const phaseIdx = PHASE_INDEX[currentPhase]

  // Speed: every 600 ms = +1 sec of scenario
  useEffect(() => {
    if (!running) return
    tickerRef.current = window.setInterval(() => {
      setTick((t) => {
        const next = t + 1
        const max = Math.max(...scenario.events.map((e) => e.offsetSec))
        if (next > max + 1) {
          setRunning(false)
          return max + 1
        }
        return next
      })
    }, 600)
    return () => {
      if (tickerRef.current) window.clearInterval(tickerRef.current)
    }
  }, [running, scenario])

  function chooseScenario(id: string) {
    setScenarioId(id)
    setTick(0)
    setRunning(false)
  }

  function reset() {
    setTick(0)
    setRunning(false)
  }

  const totalEvents = scenario.events.length
  const seenEvents = visible.length
  const progressPct = Math.min(100, (seenEvents / totalEvents) * 100)

  return (
    <div className="px-6 pb-8 space-y-4 animate-reveal-up">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="tag">CYBERSECURITY · SIMULATOR · SOC PLAYBOOK</div>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            OT / IT incident simulator · 6 representative attacks
          </h1>
          <div className="tag mt-1 text-ink-muted">
            Pick a scenario, press PLAY, and walk through detect → investigate → contain → eradicate → recover with live SIEM-style alerts. MITRE ATT&amp;CK aligned.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="amber">MITRE ATT&amp;CK</Badge>
          <Badge tone="flare">simulated</Badge>
          <Badge tone="signal">SOC playbook</Badge>
        </div>
      </div>

      {/* Scenario picker */}
      <Panel>
        <PanelHeader label="SCENARIO LIBRARY" hint="click to load · PLAY to simulate">
          <Badge tone="cyan">{SCENARIOS.length} scenarios</Badge>
        </PanelHeader>
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {SCENARIOS.map((s) => {
            const active = s.id === scenarioId
            return (
              <button
                key={s.id}
                onClick={() => chooseScenario(s.id)}
                className={cn(
                  'group text-left p-3 border transition-all',
                  active
                    ? 'border-cyan bg-cyan/15 text-cyan'
                    : 'border-edge-subtle hover:border-cyan/60 hover:bg-bg-panel/80',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="tag" style={{ color: active ? '#4ee2f4' : '#c79a4a' }}>{s.family}</span>
                  <span className={cn('inline-flex items-center', active ? 'text-cyan' : 'text-ink-muted')}>
                    {s.icon}
                  </span>
                </div>
                <div className="font-cond text-[13px] font-semibold leading-tight text-ink">{s.title}</div>
                <div className="font-mono text-[10px] text-ink-muted mt-1">{s.vector}</div>
              </button>
            )
          })}
        </div>
      </Panel>

      {/* Active scenario summary + KPIs */}
      <div className="grid grid-cols-[1fr_360px] gap-4">
        <Panel className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-flare" />
            <span className="tag text-flare">ACTIVE SCENARIO</span>
          </div>
          <div className="font-display text-lg font-bold tracking-tight">{scenario.title}</div>
          <div className="font-mono text-[11px] text-ink-muted mt-2 leading-relaxed">{scenario.summary}</div>
          <div className="grid grid-cols-2 gap-x-6 mt-3 font-mono text-[11px]">
            <DataRow label="vector"     value={scenario.vector} />
            <DataRow label="target"     value={scenario.target} />
            <DataRow label="MITRE"      value={scenario.mitre} />
            <DataRow label="impact"     value={scenario.impactIfMissed} tone="flare" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button variant={running ? 'amber' : 'primary'} size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="w-3 h-3 mr-1.5" /> : <Play className="w-3 h-3 mr-1.5" />}
              {running ? 'PAUSE' : 'PLAY SCENARIO'}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3 h-3 mr-1.5" /> RESET
            </Button>
            <div className="ml-auto flex items-center gap-3 font-mono text-[10.5px]">
              <span className="text-ink-muted">phase</span>
              <span className="font-semibold" style={{ color: PHASE_COLORS[currentPhase] }}>{currentPhase}</span>
              <span className="text-ink-muted">events</span>
              <span className="text-cyan tabular-nums">{seenEvents} / {totalEvents}</span>
            </div>
          </div>
          {/* progress + phase pills */}
          <div className="mt-3">
            <div className="h-1 bg-bg-base/80 border border-edge-subtle overflow-hidden">
              <div
                className="h-full bg-cyan transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 gap-1">
              {PHASE_ORDER.map((p, i) => {
                const reached = phaseIdx >= i
                return (
                  <div
                    key={p}
                    className={cn(
                      'flex-1 text-center px-1 py-1 border font-mono text-[9.5px] tracking-[0.18em] uppercase',
                      reached
                        ? 'border-cyan/60 text-cyan bg-cyan/10'
                        : 'border-edge-subtle text-ink-muted',
                    )}
                  >
                    {p}
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>

        {/* KPI / containment recommendations */}
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">CONTAINMENT · RECOMMENDED</div>
          <div className="font-mono text-[11px] text-ink leading-relaxed mb-3">
            {scenario.containmentRecommendation}
          </div>
          <div className="tag text-cyan mb-1">PLAYBOOK STEPS</div>
          <ul className="space-y-1 font-mono text-[11px]">
            {scenario.containment.map((c) => (
              <li key={c} className="flex items-center gap-2 border-b border-edge-subtle/60 last:border-b-0 py-1">
                <span className="led led-amber animate-pulse-soft" />
                <span className="text-ink">{c}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Live event stream + risk meter */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Panel>
          <PanelHeader label="LIVE EVENT STREAM · SIEM" hint="Cognite + Snowflake + Cortex">
            <Badge tone={running ? 'flare' : 'snow'}>{running ? 'STREAMING' : 'PAUSED'}</Badge>
          </PanelHeader>
          <div className="p-3 max-h-[460px] overflow-y-auto font-mono text-[11px]">
            {visible.length === 0 && (
              <div className="text-ink-muted italic">// press PLAY to begin the scenario · events will arrive in process order</div>
            )}
            {visible.map((e, i) => (
              <div key={i} className="grid grid-cols-[64px_64px_80px_1fr] gap-2 border-b border-edge-subtle/40 py-1.5 last:border-b-0">
                <span className="text-ink-muted">{e.ts}</span>
                <Badge tone={severityTone(e.severity)}>{e.severity}</Badge>
                <span className="text-cyan">{e.source}</span>
                <span className="text-ink">{e.message}</span>
              </div>
            ))}
            {/* trailing pulse */}
            {running && (
              <div className="flex items-center gap-2 mt-2 text-ink-muted text-[10px] animate-pulse">
                <span className="led led-amber" />
                <span>waiting for next event…</span>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="RISK METER · NOW" hint="composite signal">
            <Badge tone="alarm">live</Badge>
          </PanelHeader>
          <div className="p-4 space-y-3">
            <RiskMeter visible={visible} />
            <Kpi label="Open alerts · 24h" value={String(12 + visible.length)} tone="amber" delta={`+${visible.length}`} />
            <Kpi label="Mean time to detect (MTTD)" value="4.1" unit="min" tone="signal" />
            <Kpi label="Mean time to contain (MTTC)" value="9.3" unit="min" tone="cyan" />
            <Kpi label="SOC analysts on shift"     value="3"               tone="snow" />
          </div>
        </Panel>
      </div>

      {/* Scenario topology — lights up affected nodes as the scenario plays */}
      <ScenarioTopology visible={visible} scenarioId={scenario.id} />

      {/* Detection sources */}
      <div className="grid grid-cols-3 gap-4">
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">DETECTION SOURCES</div>
          <DataRow label="firewalls · IPS"     value="next-gen FW · Suricata" tone="snow" />
          <DataRow label="endpoint"             value="EDR on EWS + HMIs"      tone="snow" />
          <DataRow label="SIEM"                 value="Snowflake · governed"   tone="cyan" />
          <DataRow label="Cortex anomaly"       value="multivariate · live"    tone="cyan" />
          <DataRow label="OT-specific"          value="Claroty + Dragos"       tone="signal" />
          <DataRow label="DNS sinkhole"         value="WAN egress"             tone="amber" />
        </Panel>
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">RESPONSE PLAYBOOK</div>
          <DataRow label="Tier-1 SOC"           value="24/7 · 3 analysts"      tone="snow" />
          <DataRow label="OT engineer on call"  value="phone · 10 min ETA"     tone="snow" />
          <DataRow label="Containment auto"     value="firewall + EDR + AD"    tone="amber" />
          <DataRow label="Comms"                value="page · plant manager"   tone="amber" />
          <DataRow label="Forensics"            value="memory + disk image"    tone="snow" />
          <DataRow label="External"             value="ICS-CERT · 4 h SLA"     tone="flare" />
        </Panel>
        <Panel className="p-4">
          <div className="tag text-cyan mb-2">FRAMEWORK ALIGNMENT</div>
          <DataRow label="NIST CSF"             value="ID · PR · DE · RS · RC" tone="cyan" />
          <DataRow label="IEC 62443"            value="ZL-3 / SL-3 target"     tone="cyan" />
          <DataRow label="MITRE ATT&CK"         value="Enterprise + ICS"       tone="snow" />
          <DataRow label="Auditor view"         value="Horizon lineage replay" tone="signal" />
          <DataRow label="Tabletop cadence"     value="quarterly · paid PoV"   tone="amber" />
          <DataRow label="DR test"              value="annual · 48 h RTO"      tone="amber" />
        </Panel>
      </div>
    </div>
  )
}

/* ─── risk meter ─────────────────────────────────────────────────── */

function RiskMeter({ visible }: { visible: Event[] }) {
  // Compute a 0-100 score from the worst severity seen
  const worst = visible.reduce((acc, e) => {
    const s = e.severity === 'CRIT' ? 95 : e.severity === 'HIGH' ? 80 : e.severity === 'MED' ? 55 : e.severity === 'LOW' ? 30 : 10
    return Math.max(acc, s)
  }, 0)
  const tone = worst >= 80 ? '#ef4444' : worst >= 60 ? '#ff6b35' : worst >= 40 ? '#ffb627' : worst > 0 ? '#34d57b' : '#7a8aa1'
  const label = worst >= 80 ? 'CRIT' : worst >= 60 ? 'HIGH' : worst >= 40 ? 'MED' : worst > 0 ? 'LOW' : 'IDLE'

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">RISK</span>
        <span className="font-mono text-[11px] font-bold" style={{ color: tone }}>{label}</span>
      </div>
      <div className="h-3 bg-bg-base/70 border border-edge-subtle overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${worst}%`, background: tone, boxShadow: `0 0 12px ${tone}` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 font-mono text-[9px] text-ink-muted">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SCENARIO TOPOLOGY — full-width LAN/WAN/Cloud diagram that lights up
   affected nodes as the scenario plays.
   ════════════════════════════════════════════════════════════════════ */

interface ScNode { id: string; label: string; x: number; y: number; layer: string }
interface ScEdge { from: string; to: string }

const SC_W = 1340
const SC_H = 280

const SC_NODES: ScNode[] = [
  /* Cloud / WAN */
  { id: 'snowflake', label: 'Snowflake',         x: 110,  y: 60,  layer: 'L5 cloud' },
  { id: 'mail',      label: 'O365 Mail',         x: 240,  y: 60,  layer: 'L5 cloud' },
  { id: 'dns',       label: 'WAN DNS',           x: 370,  y: 60,  layer: 'L5 cloud' },
  /* WAN edge */
  { id: 'corp-rtr',  label: 'Corp Router',       x: 240,  y: 140, layer: 'L4 WAN' },
  { id: 'fw-up',     label: 'IDMZ FW',           x: 380,  y: 140, layer: 'IDMZ' },
  /* IDMZ */
  { id: 'jump',      label: 'Jump Host',         x: 520,  y: 80,  layer: 'IDMZ' },
  { id: 'hist-rep',  label: 'Historian Replica', x: 520,  y: 200, layer: 'IDMZ' },
  /* L3 OT */
  { id: 'fw-dn',     label: 'OT Edge FW',        x: 660,  y: 140, layer: 'L3 OT' },
  { id: 'ot-dc',     label: 'OT-DC',             x: 800,  y: 80,  layer: 'L3 OT' },
  { id: 'ews',       label: 'EWS',               x: 800,  y: 200, layer: 'L3 OT' },
  /* L2 */
  { id: 'l2-sw',     label: 'L2 Switch',         x: 940,  y: 140, layer: 'L2' },
  { id: 'hmi1',      label: 'HMI-1',             x: 1080, y: 60,  layer: 'L2' },
  { id: 'dcs-srv',   label: 'DCS Servers',       x: 1080, y: 140, layer: 'L2' },
  { id: 'siem',      label: 'SIEM',              x: 1220, y: 60,  layer: 'L2 SOC' },
  /* L1 */
  { id: 'wifi',      label: 'Wi-Fi',             x: 1080, y: 220, layer: 'L1' },
  { id: 'plc3',      label: 'PLC-3 Utilities',   x: 1220, y: 160, layer: 'L1' },
  { id: 'plc1',      label: 'PLC-1 CDU',         x: 1220, y: 220, layer: 'L1' },
  { id: 'sis',       label: 'SIS',               x: 1300, y: 140, layer: 'L1' },
]

const SC_EDGES: ScEdge[] = [
  { from: 'snowflake', to: 'corp-rtr' },
  { from: 'mail',      to: 'corp-rtr' },
  { from: 'dns',       to: 'corp-rtr' },
  { from: 'corp-rtr',  to: 'fw-up' },
  { from: 'fw-up',     to: 'jump' },
  { from: 'fw-up',     to: 'hist-rep' },
  { from: 'fw-up',     to: 'fw-dn' },
  { from: 'fw-dn',     to: 'ot-dc' },
  { from: 'fw-dn',     to: 'ews' },
  { from: 'fw-dn',     to: 'l2-sw' },
  { from: 'l2-sw',     to: 'hmi1' },
  { from: 'l2-sw',     to: 'dcs-srv' },
  { from: 'l2-sw',     to: 'siem' },
  { from: 'l2-sw',     to: 'wifi' },
  { from: 'l2-sw',     to: 'plc3' },
  { from: 'l2-sw',     to: 'plc1' },
  { from: 'l2-sw',     to: 'sis' },
]

/**
 * Scenario id → ordered chain of nodes that should light up in sequence as
 * the simulator plays. Each entry maps a node id to the visible event
 * count threshold that activates it.
 */
const SC_ACTIVATIONS: Record<string, { node: string; afterEvents: number }[]> = {
  'port-scan':       [
    { node: 'snowflake', afterEvents: 1 },
    { node: 'corp-rtr', afterEvents: 1 },
    { node: 'fw-up',     afterEvents: 2 },
    { node: 'fw-dn',     afterEvents: 3 },
  ],
  'ransomware-hmi':  [
    { node: 'hmi1',     afterEvents: 1 },
    { node: 'l2-sw',    afterEvents: 3 },
    { node: 'dcs-srv',  afterEvents: 4 },
    { node: 'ot-dc',    afterEvents: 5 },
    { node: 'siem',     afterEvents: 4 },
  ],
  'modbus-mitm':     [
    { node: 'wifi',     afterEvents: 1 },
    { node: 'l2-sw',    afterEvents: 2 },
    { node: 'plc3',     afterEvents: 3 },
    { node: 'sis',      afterEvents: 5 },
    { node: 'siem',     afterEvents: 4 },
  ],
  'phishing-ews':    [
    { node: 'mail',     afterEvents: 1 },
    { node: 'ews',      afterEvents: 2 },
    { node: 'dns',      afterEvents: 4 },
    { node: 'fw-dn',    afterEvents: 5 },
    { node: 'ot-dc',    afterEvents: 5 },
  ],
  'plc-ladder':      [
    { node: 'ews',      afterEvents: 1 },
    { node: 'l2-sw',    afterEvents: 2 },
    { node: 'plc1',     afterEvents: 3 },
    { node: 'sis',      afterEvents: 4 },
    { node: 'siem',     afterEvents: 4 },
  ],
  'dns-exfil':       [
    { node: 'hist-rep', afterEvents: 1 },
    { node: 'dns',      afterEvents: 2 },
    { node: 'fw-up',    afterEvents: 3 },
    { node: 'snowflake', afterEvents: 4 },
  ],
}

function ScenarioTopology({ visible, scenarioId }: { visible: Event[]; scenarioId: string }) {
  const activations = SC_ACTIVATIONS[scenarioId] ?? []
  const seen = visible.length

  const active = useMemo(() => {
    const s = new Set<string>()
    for (const a of activations) {
      if (seen >= a.afterEvents) s.add(a.node)
    }
    return s
  }, [activations, seen])

  // Edges between consecutively-activated nodes light up as the attack path
  const activeEdges = useMemo(() => {
    const set = new Set<string>()
    const order = activations.filter((a) => seen >= a.afterEvents).map((a) => a.node)
    for (let i = 0; i < order.length - 1; i++) {
      // Find the edge connecting order[i] -> order[i+1] in either direction
      const a = order[i], b = order[i + 1]
      const e = SC_EDGES.find((edge) =>
        (edge.from === a && edge.to === b) ||
        (edge.from === b && edge.to === a),
      )
      if (e) set.add(`${e.from}>${e.to}`)
    }
    return set
  }, [activations, seen])

  return (
    <Panel className="flex flex-col">
      <PanelHeader label="ATTACK SURFACE · LIVE TOPOLOGY · NODES LIGHT UP AS SCENARIO PLAYS" hint="full-width">
        <Badge tone="cyan">{active.size} active</Badge>
        <Badge tone="flare">{activeEdges.size} hops</Badge>
      </PanelHeader>
      <div className="p-3">
        <svg viewBox={`0 0 ${SC_W} ${SC_H}`} className="w-full bg-bg-base">
          {/* layer bands */}
          <rect x="0"   y="0"   width="160" height={SC_H} fill="#4ee2f4" opacity="0.04" />
          <rect x="160" y="0"   width="320" height={SC_H} fill="#1ea7ff" opacity="0.04" />
          <rect x="480" y="0"   width="160" height={SC_H} fill="#ef4444" opacity="0.05" />
          <rect x="640" y="0"   width="240" height={SC_H} fill="#34d57b" opacity="0.04" />
          <rect x="880" y="0"   width="460" height={SC_H} fill="#ffb627" opacity="0.04" />
          <text x="10"   y="14" fontSize="9" fill="#4ee2f4" fontWeight="bold">CLOUD</text>
          <text x="170"  y="14" fontSize="9" fill="#1ea7ff" fontWeight="bold">WAN / CORP</text>
          <text x="490"  y="14" fontSize="9" fill="#ef4444" fontWeight="bold">IDMZ</text>
          <text x="650"  y="14" fontSize="9" fill="#34d57b" fontWeight="bold">L3 OT</text>
          <text x="890"  y="14" fontSize="9" fill="#ffb627" fontWeight="bold">L2 / L1 / SOC</text>

          {/* Edges */}
          {SC_EDGES.map((e, i) => {
            const a = SC_NODES.find((n) => n.id === e.from)!
            const b = SC_NODES.find((n) => n.id === e.to)!
            const isActive = activeEdges.has(`${e.from}>${e.to}`)
            return (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isActive ? '#ef4444' : '#3a4a64'}
                    strokeWidth={isActive ? 2.4 : 1.0}
                    strokeOpacity={isActive ? 0.95 : 0.45}
                    style={isActive ? { filter: 'drop-shadow(0 0 5px #ef4444)' } : undefined } />
            )
          })}
          {/* Animated pulse along active edges */}
          {Array.from(activeEdges).map((eid) => {
            const [from, to] = eid.split('>')
            const a = SC_NODES.find((n) => n.id === from)!
            const b = SC_NODES.find((n) => n.id === to)!
            return (
              <circle key={eid} r="3" fill="#ff6b35">
                <animate attributeName="cx" values={`${a.x};${b.x}`} dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="cy" values={`${a.y};${b.y}`} dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" />
              </circle>
            )
          })}
          {/* Nodes */}
          {SC_NODES.map((n) => {
            const isActive = active.has(n.id)
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                {isActive && (
                  <circle r="22" fill="#ef4444" opacity="0.18">
                    <animate attributeName="r" values="14;26;14" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r="12"
                        fill={isActive ? '#ef4444' : '#0b1322'}
                        stroke={isActive ? '#ef4444' : '#586984'}
                        strokeWidth={isActive ? 2.2 : 1.2}
                        style={isActive ? { filter: 'drop-shadow(0 0 8px #ef4444)' } : undefined } />
                <text y="26" fontSize="9.5"
                      fill={isActive ? '#ef4444' : '#c8d4e6'}
                      textAnchor="middle">{n.label}</text>
                <text y="36" fontSize="7.5" fill="#7a8aa1" textAnchor="middle">{n.layer}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </Panel>
  )
}
