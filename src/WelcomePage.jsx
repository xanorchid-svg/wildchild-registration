import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import logoNew from './assets/logo_new.png';
import groundsPhoto from '../public/grounds.jpg';

const OLIVE_DARK = '#4d5a2c';
const NAVY       = '#0f1f5c';
const CREAM      = '#f5f0e8';

export default function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: staff } = await supabase
        .from('staff').select('id').eq('id', session.user.id).single();
      navigate(staff ? '/admin' : '/portal', { replace: true });
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px 64px',
      overflow: 'hidden',
    }}>

      {/* Full bleed background photo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${groundsPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* Dark teal gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(33,74,86,0.65) 0%, rgba(22,55,65,0.75) 60%, rgba(15,40,50,0.88) 100%)',
        zIndex: 1,
      }} />

      {/* Logo artwork circle */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 300,
        height: 300,
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: 28,
        flexShrink: 0,
        boxShadow: '0 16px 64px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25)',
        border: '5px solid rgba(255,255,255,0.20)',
      }}>
        <img
          src={logoNew}
          alt="Wild Child Nosara"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Tagline */}
      <p style={{
        position: 'relative',
        zIndex: 2,
        margin: '0 0 44px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        fontSize: 15,
        color: 'rgba(255,255,255,0.92)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        textAlign: 'center',
        textShadow: '0 1px 8px rgba(0,0,0,0.35)',
      }}>
        A nature-rooted place for children to grow, play, and belong.
      </p>

      {/* Buttons */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        maxWidth: 300,
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
        position: 'relative',
        zIndex: 2,
        marginTop: 48,
        fontSize: 12,
        color: 'rgba(255,255,255,0.38)',
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        Nosara, Costa Rica &nbsp;·&nbsp; Wild Child Nosara
      </p>
    </div>
  );
}

function HoverButton({ onClick, bg, hoverBg, color, hoverColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        color,
        border: `2px solid ${bg}`,
        borderRadius: 6,
        padding: '17px 24px',
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
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
