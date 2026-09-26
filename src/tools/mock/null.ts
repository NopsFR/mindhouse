import { createMockTool } from './factory'

export const cveLookupTool = createMockTool('cve_lookup', 'CVE Lookup', 'Recent CVE disclosures and severity data.', 'Mock: CVE Disclosure Feed', [
  {
    title: 'Critical deserialization flaw in a widely used logging library',
    summary: 'Unauthenticated remote code execution reported; patches available upstream.',
    tags: ['cve', 'rce'],
    severity: 'high',
  },
  {
    title: 'Privilege escalation in a common container runtime',
    summary: 'Local attacker could escape container isolation under specific kernel configs.',
    tags: ['cve', 'containers'],
    severity: 'medium',
  },
  {
    title: 'Authentication bypass in an IoT camera firmware line',
    summary: 'Default credentials plus a logic flaw allow bypassing the login flow.',
    tags: ['cve', 'iot'],
    severity: 'medium',
  },
])

export const securityResearchTool = createMockTool('security_research', 'Security Research', 'Threat actor and campaign research search.', 'Mock: Security Research Feed', [
  {
    title: 'Ransomware group shifts to double-extortion tactics',
    summary: 'Researchers observe increased data exfiltration ahead of encryption in recent incidents.',
    tags: ['ransomware', 'threat-actor'],
    severity: 'high',
  },
  {
    title: 'Phishing kit targeting corporate SSO portals',
    summary: 'A reusable phishing kit mimicking common SSO login pages is circulating.',
    tags: ['phishing'],
    severity: 'medium',
  },
  {
    title: 'Supply-chain package compromised on a public registry',
    summary: 'A popular package was briefly compromised with credential-stealing code.',
    tags: ['supply-chain'],
    severity: 'high',
  },
])

export const threatIntelTool = createMockTool('threat_intel', 'Threat Intelligence', 'Malware family and infrastructure correlation search.', 'Mock: Threat Intelligence Feed', [
  {
    title: 'New malware family observed in the wild',
    summary: 'A modular loader with anti-analysis features seen across several campaigns.',
    tags: ['malware'],
    severity: 'medium',
  },
  {
    title: 'Infrastructure overlap between two known threat clusters',
    summary: 'Shared C2 infrastructure suggests possible tooling reuse between two tracked clusters.',
    tags: ['infrastructure', 'attribution'],
    severity: 'medium',
  },
  {
    title: 'Scanning activity spike against exposed management interfaces',
    summary: 'Internet-wide scanning increase targeting a common router admin panel.',
    tags: ['scanning', 'infrastructure'],
    severity: 'low',
  },
])
