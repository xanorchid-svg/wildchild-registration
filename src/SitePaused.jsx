import logoNew from "./assets/logo_new.png";
import groundsBg from "/grounds.jpg";

const OLIVE_DARK = "#4d5a2c";
const NAVY = "#0f1f5c";
const TEAL = "#427889";
const CREAM = "#f5f0e8";

const BRIGHTWHEEL_URL =
  "https://schools.mybrightwheel.com/sign-in?redirect_path=forms/9165ae45-4e45-465c-95cf-8edd301baac9/self-service";
const WHATSAPP_URL = "https://wa.me/50661640827";
const EMAIL_URL = "mailto:info@dandelionwildschooling.com";

export default function SitePaused() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${groundsBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(33,74,86,0.7) 0%, rgba(15,40,50,0.92) 100%)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid rgba(255,255,255,0.25)",
            marginBottom: 24,
            flexShrink: 0,
          }}
        >
          <img
            src={logoNew}
            alt="Wild Child Nosara"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <h1
          style={{
            color: "#fff",
            fontFamily: "'Georgia', serif",
            fontSize: 22,
            letterSpacing: "0.06em",
            textAlign: "center",
            margin: "0 0 14px",
          }}
        >
          WE'RE CURRENTLY UNDER RENOVATION
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            fontSize: 16,
            textAlign: "center",
            maxWidth: 340,
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          The site is currently undergoing renovation. To enroll, please
          message us on WhatsApp or send us an email.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: TEAL,
              color: "#fff",
              border: `2px solid ${TEAL}`,
              borderRadius: 8,
              padding: "14px 20px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              textDecoration: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.12em" }}>
              MESSAGE US ON WHATSAPP
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3, letterSpacing: "0.05em" }}>
              +506 6164 0827
            </div>
          </a>

          <a
            href={EMAIL_URL}
            style={{
              background: OLIVE_DARK,
              color: "#fff",
              border: `2px solid ${OLIVE_DARK}`,
              borderRadius: 8,
              padding: "14px 20px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              textDecoration: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.12em" }}>
              SEND US AN EMAIL
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3, letterSpacing: "0.05em" }}>
              info@dandelionwildschooling.com
            </div>
          </a>
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <a
            href={BRIGHTWHEEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'Georgia', serif",
              fontSize: 13,
              textDecoration: "underline",
            }}
          >
            Already enrolled? Manage your account on Brightwheel ↗
          </a>
          <a
            href="/login"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Georgia', serif",
              fontSize: 12,
              textDecoration: "underline",
            }}
          >
            Existing family or staff login
          </a>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "20px 24px",
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          letterSpacing: "0.04em",
          fontFamily: "'Georgia', serif",
        }}
      >
        Nosara, Costa Rica · Wild Child Nosara
      </div>
    </div>
  );
}
