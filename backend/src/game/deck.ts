// Feature deck utilities (T034)
// Responsible for building the initial feature deck, shuffling deterministically via provided RNG, and drawing.

import type { FeatureCard, FeatureRoleRequirement } from '../models/types.ts';
import { SeededRng } from './rng.ts';

export interface DeckBuildOptions {
  size?: number;          // number of feature cards to generate if using placeholder generation
  minPoints?: number;     // min effort
  maxPoints?: number;     // max effort
}

const DEFAULT_ROLES = ['DEV','PM','UX'] as const; // restricted to core triad

// --- Thematic Microsoft-style feature catalog ---
// Each entry includes an id (stable), name, description, and explicit role requirements.
// Balancing rule of thumb: sum of minPoints ~ difficulty (2-8). Multi-role features lean toward higher totals.
const MS_FEATURE_CATALOG: FeatureCard[] = [
  { id:'F1', name:'Azure AD Single Sign-On', description:'Enable SSO integration for enterprise tenants via OpenID Connect.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F2', name:'Teams Presence Sync', description:'Reflect real-time presence status across web and desktop clients.', totalPoints:6, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:1 }, { role:'PM', minPoints:2 }] },
  { id:'F3', name:'Outlook Add-in Compose Pane', description:'Lightweight add-in panel for drafting AI assisted replies.', totalPoints:4, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:1 }] },
  { id:'F4', name:'SharePoint Document Version Diff', description:'Side-by-side visual diff for major document revisions.', totalPoints:7, requirements:[{ role:'DEV', minPoints:4 }, { role:'UX', minPoints:1 }, { role:'PM', minPoints:2 }] },
  { id:'F5', name:'OneDrive Offline Sync Optimization', description:'Reduce sync conflicts & bandwidth with smarter chunking.', totalPoints:5, requirements:[{ role:'DEV', minPoints:4 }, { role:'PM', minPoints:1 }] },
  { id:'F6', name:'Teams Meeting Live Reactions', description:'Animated emoji reaction stream with accessibility labels.', totalPoints:6, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:2 }, { role:'PM', minPoints:1 }] },
  { id:'F7', name:'Azure Cost Anomaly Alerting', description:'Detect sudden spend spikes and push notifications.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F8', name:'Power BI Dark Theme Polish', description:'Improve contrast & theming tokens for night mode.', totalPoints:4, requirements:[{ role:'UX', minPoints:2 }, { role:'DEV', minPoints:2 }] },
  { id:'F9', name:'M365 Unified Search Autosuggest', description:'Cross-product query suggestions with fuzzy matching.', totalPoints:7, requirements:[{ role:'DEV', minPoints:4 }, { role:'PM', minPoints:2 }, { role:'UX', minPoints:1 }] },
  { id:'F10', name:'Azure Functions Cold Start Reduction', description:'Warm pooling strategy for premium plan functions.', totalPoints:6, requirements:[{ role:'DEV', minPoints:5 }, { role:'PM', minPoints:1 }] },
  { id:'F11', name:'Teams Channel Archive Restore', description:'Self-service restore flow for archived channels.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F12', name:'Intune Device Compliance Badge', description:'Visual indicator of device health in portal.', totalPoints:4, requirements:[{ role:'DEV', minPoints:2 }, { role:'UX', minPoints:1 }, { role:'PM', minPoints:1 }] },
  { id:'F13', name:'Azure Monitor Query Snippets', description:'Reusable Kusto snippet library with tagging.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F14', name:'Outlook Calendar Focus Time Block', description:'Auto-insert focus events based on meeting load.', totalPoints:6, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }, { role:'UX', minPoints:1 }] },
  { id:'F15', name:'Edge Collections Sharing', description:'Collaborative sharing of tab collections.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:1 }, { role:'PM', minPoints:1 }] },
  { id:'F16', name:'Azure DevOps Sprint Burnup Chart', description:'Add burnup visualization to dashboards.', totalPoints:4, requirements:[{ role:'DEV', minPoints:2 }, { role:'PM', minPoints:2 }] },
  { id:'F17', name:'Teams Adaptive Background Blur', description:'Dynamic blur based on movement & lighting.', totalPoints:7, requirements:[{ role:'DEV', minPoints:4 }, { role:'UX', minPoints:2 }, { role:'PM', minPoints:1 }] },
  { id:'F18', name:'SharePoint Inline Image OCR', description:'Extract text metadata for search indexing.', totalPoints:6, requirements:[{ role:'DEV', minPoints:4 }, { role:'PM', minPoints:2 }] },
  { id:'F19', name:'Azure Portal Keyboard Shortcuts', description:'Global nav & resource shortcuts for power users.', totalPoints:5, requirements:[{ role:'UX', minPoints:2 }, { role:'DEV', minPoints:2 }, { role:'PM', minPoints:1 }] },
  { id:'F20', name:'Teams Poll Template Library', description:'Pre-built poll templates for quick engagement.', totalPoints:4, requirements:[{ role:'PM', minPoints:2 }, { role:'DEV', minPoints:2 }] },
  { id:'F21', name:'OneDrive Link Expiration Policy', description:'Tenant policy UI for mandatory link expirations.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F22', name:'PowerPoint Live Co-Author Pointer', description:'Show collaborator cursor during presentations.', totalPoints:6, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:2 }, { role:'PM', minPoints:1 }] },
  { id:'F23', name:'Azure Role Assignment Audit Export', description:'Scheduled export of RBAC diffs to storage.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:2 }] },
  { id:'F24', name:'Defender Threat Timeline Zoom', description:'Zoomable incident progression visualization.', totalPoints:7, requirements:[{ role:'DEV', minPoints:4 }, { role:'UX', minPoints:2 }, { role:'PM', minPoints:1 }] },
  { id:'F25', name:'Teams Message Pinning v2', description:'Multiple pin slots with ordering.', totalPoints:4, requirements:[{ role:'DEV', minPoints:3 }, { role:'PM', minPoints:1 }] },
  { id:'F26', name:'Azure Backup Restore Progress UI', description:'Progress & ETA indicators for restore jobs.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:1 }, { role:'PM', minPoints:1 }] },
  { id:'F27', name:'M365 Data Residency Report', description:'Export of geo storage locations per service.', totalPoints:5, requirements:[{ role:'PM', minPoints:3 }, { role:'DEV', minPoints:2 }] },
  { id:'F28', name:'Teams Emoji Skin Tone Memory', description:'Persist last used tone across sessions.', totalPoints:3, requirements:[{ role:'DEV', minPoints:2 }, { role:'UX', minPoints:1 }] },
  { id:'F29', name:'Outlook Mobile Attachment Quick Save', description:'One-tap save to recent OneDrive folder.', totalPoints:4, requirements:[{ role:'DEV', minPoints:3 }, { role:'UX', minPoints:1 }] },
  { id:'F30', name:'Azure Policy Drift Detection', description:'Detect & flag resource config drift.', totalPoints:6, requirements:[{ role:'DEV', minPoints:4 }, { role:'PM', minPoints:2 }] },
];

export function generatePlaceholderDeck(opts: DeckBuildOptions = {}): FeatureCard[] {
  // If caller explicitly passes size (legacy behavior) generate synthetic placeholders for determinism tests.
  if (opts.size) {
    const size = opts.size;
    const minP = opts.minPoints ?? 2;
    const maxP = opts.maxPoints ?? 8;
    const legacy: FeatureCard[] = [];
    for (let i = 0; i < size; i++) {
      const difficulty = minP + (i % (maxP - minP + 1));
      const roleCount = difficulty >= 7 ? 3 : difficulty >= 4 ? 2 : 1;
      const shuffled = [...DEFAULT_ROLES].slice(i % DEFAULT_ROLES.length).concat([...DEFAULT_ROLES].slice(0, i % DEFAULT_ROLES.length));
      const chosen = Array.from(new Set(shuffled)).slice(0, roleCount);
      let remaining = difficulty;
      const reqs: FeatureRoleRequirement[] = [];
      chosen.forEach((r, idx) => {
        const rolesLeft = chosen.length - idx;
        let minPoints: number;
        if (rolesLeft === 1) {
          minPoints = Math.max(1, remaining);
        } else {
          const base = remaining - (rolesLeft - 1);
            minPoints = Math.max(1, Math.min(3 + idx, Math.floor(base / rolesLeft) + 1));
        }
        remaining -= minPoints;
        reqs.push({ role: r as any, minPoints });
      });
      const total = reqs.reduce((a, r) => a + r.minPoints, 0);
      legacy.push({ id:`LG${i+1}`, name:`Legacy Feature ${i+1}`, description:'Legacy placeholder feature', totalPoints: total, requirements: reqs });
    }
    return legacy;
  }
  // Default: return themed catalog (clone to avoid accidental mutation)
  return MS_FEATURE_CATALOG.map(f => ({ ...f }));
}

export function shuffle<T>(arr: T[], rng: SeededRng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface FeatureDeck {
  cards: FeatureCard[]; // top of deck is at index 0 for easy shift()
}

export function createFeatureDeck(rng: SeededRng, base?: FeatureCard[]): FeatureDeck {
  const source = base ?? generatePlaceholderDeck();
  // Shuffle then treat index 0 as top
  const shuffled = shuffle(source, rng);
  return { cards: shuffled };
}

export function drawFeature(deck: FeatureDeck): FeatureCard | undefined {
  return deck.cards.shift();
}
