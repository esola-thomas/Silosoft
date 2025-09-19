// RoleIcon (T066 placeholder)
interface Props { role: string; size?: number }
const roleMeta: Record<string,{bg:string; fg:string}> = {
  DEV:{ bg:'linear-gradient(135deg,#0d3f63,#196fa8)', fg:'#a7dcff' },
  PM:{ bg:'linear-gradient(135deg,#24502f,#3d7d49)', fg:'#b9f6c3' },
  UX:{ bg:'linear-gradient(135deg,#3d2d68,#5a44a0)', fg:'#e1d2ff' },
  CONTRACTOR:{ bg:'linear-gradient(135deg,#5a430f,#9d7b1f)', fg:'#ffe6a3' }
};
export default function RoleIcon({ role, size=26 }: Props) {
  const meta = roleMeta[role] || { bg:'#37414f', fg:'#e6edf3' };
  return (
    <span aria-label={role} title={role} style={{
      width:size, height:size, display:'inline-flex', alignItems:'center', justifyContent:'center',
      background: meta.bg, color: meta.fg, fontSize: size*0.38, fontWeight:600, borderRadius:'50%',
      boxShadow:'0 0 0 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)', letterSpacing:'.5px'
    }}>{role[0]}</span>
  );
}
