import { useState } from "react";
import logoNew from "./assets/logo_new.png";
import groundsBg from "/grounds.jpg";

const OLIVE_DARK = "#4d5a2c";
const TEAL = "#427889";

const SITE_PASSWORD = "WildChild2026!";
const STORAGE_KEY = "wildchild_site_unlocked";

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );
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
          maxWidth: 340,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
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
            fontSize: 18,
            letterSpacing: "0.06em",
            textAlign: "center",
            margin: "0 0 20px",
          }}
        >
          THIS SITE IS PRIVATE
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Enter password"
            autoFocus
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              border: `2px solid ${error ? "#c4682a" : "rgba(255,255,255,0.4)"}`,
              background: "rgba(255,255,255,0.95)",
              fontSize: 15,
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
              borderRadius: 8,
              padding: "14px 20px",
              cursor: "pointer",
              fontFamily: "'Georgia', serif",
              fontSize: 15,
              fontWeight: "bold",
              letterSpacing: "0.08em",
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
                fontSize: 13,
                textAlign: "center",
                margin: "4px 0 0",
              }}
            >
              Incorrect password
            </p>
          )}
        </form>

        <a
          href="https://wa.me/50661640827"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 24,
            color: TEAL,
            fontFamily: "'Georgia', serif",
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          Need access? Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
