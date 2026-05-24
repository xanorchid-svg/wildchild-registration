import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import logoSvg from './assets/logo1.svg';
import logoNew from './assets/logo_new.png';

const OLIVE_DARK = '#4d5a2c';
const NAVY       = '#0f1f5c';
const CREAM      = '#f5f0e8';
const TEAL       = '#427889';

export default function WelcomePage() {
  const navigate = useNavigate();

  // Redirect already-logged-in users
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: staff } = await supabase
        .from('staff').select('id').eq('id', session.user.id).single();
      navigate(staff ? '/admin' : '/portal', { replace: true });
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: TEAL, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header — centered large logo, matching login page style ── */}
      <header style={{
        background: OLIVE_DARK,
        padding: '0 24px',
        height: 80,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img src={logoSvg} alt="Wild Child Nosara" style={{ height: 52 }} />
      </header>

      {/* ── Hero ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Subtle depth */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 20% 85%, rgba(0,0,0,0.08) 0%, transparent 55%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.06) 0%, transparent 50%)',
        }} />

        {/* Logo artwork — circular, large */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: 300, height: 300,
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: 32,
          flexShrink: 0,
          boxShadow: '0 12px 56px rgba(0,0,0,0.28), 0 2px 12px rgba(0,0,0,0.16)',
          border: '5px solid rgba(255,255,255,0.22)',
        }}>
          <img
            src={logoNew}
            alt="Wild Child Nosara"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Tagline */}
        <p style={{
          position: 'relative', zIndex: 1,
          margin: '0 0 44px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'rgba(255,255,255,0.90)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          A nature-rooted place for children to grow, play, and belong.
        </p>

        {/* Buttons */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: 14,
          width: '100%', maxWidth: 300,
        }}>
          <HoverButton
            onClick={() => navigate('/register')}
            bg={OLIVE_DARK} hoverBg={CREAM} color={CREAM} hoverColor={OLIVE_DARK}
          >
            Enroll Now
          </HoverButton>
          <HoverButton
            onClick={() => navigate('/login')}
            bg={NAVY} hoverBg={CREAM} color={CREAM} hoverColor={NAVY}
          >
            Log In
          </HoverButton>
        </div>

        <p style={{
          position: 'relative', zIndex: 1,
          marginTop: 44, fontSize: 12,
          color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.04em', textAlign: 'center',
        }}>
          Nosara, Costa Rica &nbsp;·&nbsp; Wild Child Nosara
        </p>
      </div>
    </div>
  );
}

function HoverButton({ onClick, bg, hoverBg, color, hoverColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg, color, border: `2px solid ${bg}`,
        borderRadius: 6, padding: '17px 24px',
        fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
        letterSpacing: '0.09em', textTransform: 'uppercase',
        cursor: 'pointer', width: '100%',
        boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
        transition: 'background 0.18s, color 0.18s, transform 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bg;
        e.currentTarget.style.color = color;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
}
