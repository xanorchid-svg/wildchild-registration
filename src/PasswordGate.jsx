import { useState } from "react";
import logoNew from "./assets/logo_new.png";
import groundsBg from "/grounds.jpg";

const OLIVE_DARK = "#4d5a2c";
const TEAL = "#427889";

const SITE_PASSWORD = "WildChild2026!";
const STORAGE_KEY = "wildchild_site_unlocked";
const WHATSAPP_URL = "https://wa.me/50661640827";
const EMAIL_URL = "mailto:info@dandelionwildschooling.com";

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
        boxSizing: "border-box",
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
            "linear-gradient(to bottom, rgba(33,74,86,0.75) 0%, rgba(15,40,50,0.94) 100%)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
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
            fontSize: 20,
            letterSpacing: "0.05em",
            textAlign: "center",
            margin: "0 0 14px",
          }}
        >
          WE'RE UNDERGOING RENOVATION
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            fontSize: 16,
            textAlign: "center",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          This site is undergoing renovation — please come back soon. If you
          wish to enroll, please email us or send us a message on WhatsApp.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
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
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.1em" }}>
              MESSAGE US ON WHATSAPP
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>
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
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.1em" }}>
              SEND US AN EMAIL
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>
              info@dandelionwildschooling.com
            </div>
          </a>
        </div>

        {!showStaffAccess && (
          <button
            onClick={() => setShowStaffAccess(true)}
            style={{
              marginTop: 32,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Georgia', serif",
              fontSize: 12,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Staff access
          </button>
        )}

        {showStaffAccess && (
          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: 28,
              width: "100%",
              maxWidth: 220,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 16,
              borderRadius: 8,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Georgia', serif",
                fontSize: 11,
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              STAFF ACCESS
            </span>
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              style={{
                padding: "10px 12px",
                borderRadius: 6,
                border: `2px solid ${error ? "#c4682a" : "rgba(255,255,255,0.4)"}`,
                background: "rgba(255,255,255,0.95)",
                fontSize: 13,
                fontFamily: "'Georgia', serif",
                boxSizing: "border-box",
                width: "100%",
              }}
            />
            <button
              type="submit"
              style={{
                background: OLIVE_DARK,
                color: "#fff",
                border: `2px solid ${OLIVE_DARK}`,
                borderRadius: 6,
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: "'Georgia', serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: "0.06em",
                width: "100%",
              }}
            >
              ENTER
            </button>
            {error && (
              <p
                style={{
                  color: "#f2c4b3",
                  fontFamily: "'Georgia', serif",
                  fontSize: 12,
                  textAlign: "center",
                  margin: "2px 0 0",
                }}
              >
                Incorrect password
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
