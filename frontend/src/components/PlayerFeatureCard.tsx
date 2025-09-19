// PlayerFeatureCard (T060 placeholder)
interface Requirement { role: string; minPoints: number }
interface Props { name?: string; description?: string; totalPoints?: number; requirements?: Requirement[]; active?: boolean }
export default function PlayerFeatureCard({ name = 'Feature', description, totalPoints = 0, requirements = [], active=false }: Props) {
  return (
    <div className={"card " + (active ? 'active pulse-glow':'') }>
      <div className="card-header">
        <span>{name}</span>
        <span style={{ fontSize:'.55rem', opacity:.7 }}>Σ {totalPoints}</span>
      </div>
      {description && <div style={{ fontSize:'.5rem', lineHeight:1.2, margin:'2px 0 4px', opacity:.8 }}>{description}</div>}
      <div className="role-chips">
        {requirements.map(r => (
          <span key={r.role} className={'role-chip ' + r.role.toLowerCase()}>{r.role}<span style={{ opacity:.65 }}> {r.minPoints}</span></span>
        ))}
        {requirements.length===0 && <span style={{ fontSize:'.55rem', opacity:.5 }}>No requirements</span>}
      </div>
    </div>
  );
}
