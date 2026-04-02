import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

interface CardInfo {
  id: string;
  owner: string;
  name: string;
  last4: string;
  network: string;
  gradient: string;
  expiry: string;
  balance: bigint;
}
import { useActor } from "./hooks/useActor";

// ─── Types ───────────────────────────────────────────────────────────────────
type PaymentState = "idle" | "pending" | "success" | "fail";
type AppRole = "enroll" | "charge";
type AppScreen = "role" | "login" | "wallet" | "charge";

// ─── Haptic ───────────────────────────────────────────────────────────────────
function vibrate(pattern: number | number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDollars(cents: bigint | number) {
  const n = typeof cents === "bigint" ? Number(cents) : cents;
  return `$${(n / 100).toFixed(2)}`;
}

// ─── Dynamic Island ───────────────────────────────────────────────────────────
function DynamicIsland({ paymentState }: { paymentState: PaymentState }) {
  const isIdle = paymentState === "idle";
  const isPending = paymentState === "pending";
  const isSuccess = paymentState === "success";

  const width = isSuccess ? 300 : isPending ? 220 : 126;
  const height = isSuccess ? 72 : isPending ? 52 : 37;

  return (
    <motion.div
      style={{
        background: "#000",
        borderRadius: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        zIndex: 50,
        boxShadow: isSuccess
          ? "0 0 0 2px #34C759, 0 0 30px 8px rgba(52,199,89,0.5), 0 0 60px 16px rgba(52,199,89,0.25)"
          : "none",
      }}
      animate={{ width, height }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      data-ocid="dynamic_island.panel"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {isIdle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", gap: 6, alignItems: "center" }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#1C1C1E",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#1C1C1E",
              }}
            />
          </motion.div>
        )}

        {isPending && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "0 20px",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 0.8,
                ease: "linear",
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2.5px solid rgba(255,255,255,0.15)",
                borderTopColor: "#FFFFFF",
              }}
            />
            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
            >
              Processing...
            </span>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "0 22px",
              width: "100%",
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 22,
                delay: 0.05,
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #30D158, #34C759)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 12px rgba(52,199,89,0.7)",
              }}
            >
              <motion.svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                aria-labelledby="checkmark-title"
              >
                <title id="checkmark-title">Payment completed</title>
                <motion.path
                  d="M1.5 7L6.5 12L16.5 2"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                />
              </motion.svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              style={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
              <span
                style={{
                  color: "#34C759",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                }}
              >
                Completed
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Apple Pay
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              style={{ marginLeft: "auto", flexShrink: 0 }}
            >
              <svg
                width="32"
                height="20"
                viewBox="0 0 32 20"
                fill="none"
                role="img"
                aria-label="Apple Pay"
              >
                <rect
                  width="32"
                  height="20"
                  rx="4"
                  fill="rgba(255,255,255,0.08)"
                />
                <text
                  x="5"
                  y="14"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="-apple-system"
                >
                  Pay
                </text>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Network Logo ─────────────────────────────────────────────────────────────
function NetworkLogo({
  network,
  color,
  size,
}: { network: string; color: string; size: number }) {
  if (network === "Mastercard")
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#EB001B",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#F79E1B",
            opacity: 0.9,
            marginLeft: -size * 0.4,
          }}
        />
      </div>
    );
  if (network === "Visa")
    return (
      <span
        style={{
          fontSize: size * 0.65,
          fontWeight: 800,
          color,
          fontStyle: "italic",
          letterSpacing: "-1px",
          opacity: 0.9,
        }}
      >
        VISA
      </span>
    );
  if (network === "Amex")
    return (
      <span
        style={{
          fontSize: size * 0.45,
          fontWeight: 800,
          color,
          letterSpacing: "1px",
          opacity: 0.9,
        }}
      >
        AMEX
      </span>
    );
  if (network === "Discover")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: size * 0.45,
            fontWeight: 800,
            color: "#231F20",
            letterSpacing: "0.5px",
          }}
        >
          DISCOVER
        </span>
        <div
          style={{
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F76F20, #F5A623)",
          }}
        />
      </div>
    );
  return null;
}

function NFCIcon({
  size = 32,
  color = "#0071E3",
}: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="NFC"
    >
      <path
        d="M8 16C8 11.6 11.6 8 16 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 16C5 9.9 9.9 5 16 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M2 16C2 8.3 8.3 2 16 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="16" cy="16" r="3" fill={color} />
      <path d="M16 8L20 16L16 24L12 16Z" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

function AppleLogo({
  size = 24,
  color = "#F5F5F7",
}: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 814 1000"
      fill={color}
      role="img"
      aria-label="Apple"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.9-109.2c-53.4-75.5-96.5-193.6-96.5-305.5 0-204.2 133.4-312.1 264.6-312.1 70 0 128.1 46.2 172.1 46.2 43.2 0 109.6-48.8 185.3-48.8 29.9.1 108.2 2.6 166.3 81.6zm-198.5-109.7c35.5-41.9 60.5-100.4 60.5-158.9 0-8.1-.6-16.2-2-23.4-57.2 2.2-124.7 38.3-165.8 81.8-31.9 36.4-62.6 95.4-62.6 154.6 0 8.7 1.3 17.3 1.9 20.1 3.3.6 8.7 1.3 14 1.3 52 0 113.7-34.8 154-75.5z" />
    </svg>
  );
}

function StatusBar() {
  const [time, setTime] = useState("9:41");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 20px 0",
        fontSize: 13,
        fontWeight: 600,
        color: "#F5F5F7",
      }}
    >
      <span>{time}</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg
          width="17"
          height="12"
          viewBox="0 0 17 12"
          fill="#F5F5F7"
          role="img"
          aria-label="Signal"
        >
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
          <rect x="9" y="2" width="3" height="10" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="#F5F5F7"
          role="img"
          aria-label="WiFi"
        >
          <path d="M8 10.5C8.8 10.5 9.5 9.8 9.5 9S8.8 7.5 8 7.5 6.5 8.2 6.5 9 7.2 10.5 8 10.5Z" />
          <path
            d="M4.3 6.8C5.5 5.6 6.7 5 8 5s2.5.6 3.7 1.8"
            strokeWidth="1.2"
            stroke="#F5F5F7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M1.5 4C3.3 2.2 5.5 1 8 1s4.7 1.2 6.5 3"
            strokeWidth="1.2"
            stroke="#F5F5F7"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <div
            style={{
              width: 22,
              height: 11,
              borderRadius: 3,
              border: "1.5px solid rgba(245,245,247,0.7)",
              padding: 2,
            }}
          >
            <div
              style={{
                width: "80%",
                height: "100%",
                borderRadius: 1.5,
                background: "#F5F5F7",
              }}
            />
          </div>
          <div
            style={{
              width: 2,
              height: 5,
              background: "rgba(245,245,247,0.6)",
              borderRadius: "0 1px 1px 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Card Visual (no holder name) ────────────────────────────────────────────
function CardVisual({
  card,
  tiltX = 0,
  tiltY = 0,
  mini = false,
  balance,
}: {
  card: {
    name: string;
    last4: string;
    expiry: string;
    network: string;
    gradient: string;
    textColor?: string;
  };
  tiltX?: number;
  tiltY?: number;
  mini?: boolean;
  balance?: bigint;
}) {
  const w = mini ? 280 : 340;
  const h = mini ? 165 : 200;
  const textColor = card.textColor ?? "#FFFFFF";
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 16,
        background: card.gradient,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
        padding: mini ? "16px 20px" : "20px 24px",
        position: "relative",
        overflow: "hidden",
        color: textColor,
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transition: "transform 0.1s ease-out",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)",
          borderRadius: 16,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: mini ? 11 : 13,
            fontWeight: 700,
            letterSpacing: "0.5px",
            opacity: 0.85,
          }}
        >
          {card.name}
        </span>
        <NetworkLogo
          network={card.network}
          color={textColor}
          size={mini ? 22 : 28}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: mini ? 36 : 44,
          left: mini ? 20 : 24,
          fontSize: mini ? 12 : 15,
          fontWeight: 500,
          letterSpacing: "2px",
          fontFamily: "'Courier New', monospace",
          opacity: 0.9,
        }}
      >
        •••• •••• •••• {card.last4}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: mini ? 14 : 18,
          left: mini ? 20 : 24,
          right: mini ? 20 : 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          {balance !== undefined && (
            <>
              <div
                style={{
                  fontSize: mini ? 7 : 9,
                  opacity: 0.6,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Balance
              </div>
              <div style={{ fontSize: mini ? 10 : 12, fontWeight: 600 }}>
                {fmtDollars(balance)}
              </div>
            </>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: mini ? 7 : 9,
              opacity: 0.6,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Expires
          </div>
          <div style={{ fontSize: mini ? 10 : 12, fontWeight: 600 }}>
            {card.expiry}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NFC Tap Area ─────────────────────────────────────────────────────────────
function NFCTapArea({ onTap }: { onTap: () => void }) {
  const [rings, setRings] = useState<number[]>([]);
  const [tilted, setTilted] = useState(false);
  const handleTap = () => {
    vibrate(200);
    const id = Date.now();
    setRings((r) => [...r, id, id + 1, id + 2]);
    setTilted(true);
    setTimeout(() => setTilted(false), 500);
    setTimeout(() => setRings((r) => r.filter((x) => x < id)), 1200);
    onTap();
  };
  return (
    <button
      type="button"
      onClick={handleTap}
      data-ocid="nfc.button"
      style={{
        background: "rgba(28, 28, 30, 0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "18px 32px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        position: "relative",
        overflow: "visible",
        transform: tilted
          ? "rotate(-3deg) scale(0.97)"
          : "rotate(0deg) scale(1)",
        transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        userSelect: "none",
        width: "85%",
      }}
    >
      {rings.map((id, i) => (
        <div
          key={id}
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2px solid rgba(0, 113, 227, 0.6)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: `nfc-ring 800ms ease-out ${i * 200}ms forwards`,
            pointerEvents: "none",
          }}
        />
      ))}
      <NFCIcon size={28} color="#0071E3" />
      <span
        style={{
          color: "#F5F5F7",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        TAP TO PAY
      </span>
      <span style={{ color: "#A1A1A6", fontSize: 11 }}>
        Hold near card reader
      </span>
    </button>
  );
}

// ─── Role Select Screen ────────────────────────────────────────────────────────
function RoleSelectScreen({ onSelect }: { onSelect: (role: AppRole) => void }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #0A0A0F 0%, #050507 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "40px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AppleLogo size={32} />
        <span
          style={{
            color: "#F5F5F7",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          Wallet
        </span>
      </div>
      <motion.button
        type="button"
        data-ocid="role.enroll_card.button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect("enroll")}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "22px 20px",
          background: "linear-gradient(135deg, #1C1C1E, #2C2C2E)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0071E3, #2997FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Card"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <span style={{ color: "#F5F5F7", fontSize: 18, fontWeight: 700 }}>
          Enroll Card
        </span>
        <span style={{ color: "#A1A1A6", fontSize: 13 }}>
          Add & manage your payment cards
        </span>
      </motion.button>
      <motion.button
        type="button"
        data-ocid="role.charge_card.button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect("charge")}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "22px 20px",
          background: "linear-gradient(135deg, #0D1F0D, #162616)",
          border: "1px solid rgba(52,199,89,0.25)",
          borderRadius: 20,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #34C759, #30B350)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Terminal"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <span style={{ color: "#34C759", fontSize: 18, fontWeight: 700 }}>
          Charge Card
        </span>
        <span style={{ color: "rgba(52,199,89,0.7)", fontSize: 13 }}>
          Accept payments like Square POS
        </span>
      </motion.button>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({
  role,
  onSuccess,
  onBack,
  actor,
}: {
  role: AppRole;
  onSuccess: (token: string, username: string) => void;
  onBack: () => void;
  actor: any;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    login: iiLogin,
    identity,
    isLoggingIn,
    isLoginError,
  } = useInternetIdentity();
  const iiHandledRef = useRef(false);

  useEffect(() => {
    if (identity && !iiHandledRef.current && actor) {
      iiHandledRef.current = true;
      actor
        .loginWithPrincipal(identity.getPrincipal().toString())
        .then((result: { ok: string } | { err: string }) => {
          if ("ok" in result) {
            onSuccess(result.ok, identity.getPrincipal().toString());
          } else {
            setError(
              (result as { err: string }).err || "Sign-in failed. Try again.",
            );
          }
        })
        .catch(() => {
          setError("Connection error. Try again.");
          iiHandledRef.current = false;
        });
    }
  }, [identity, actor, onSuccess]);

  const handleAuth = async (mode: "login" | "register") => {
    if (!actor || !username || !password) return;
    setLoading(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await actor.login(username, password)
          : await actor.register(username, password);
      if ("ok" in result) {
        onSuccess(result.ok, username);
      } else {
        setError(result.err);
      }
    } catch (_) {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isEnroll = role === "enroll";
  const accent = isEnroll ? "#2997FF" : "#34C759";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #0A0A0F 0%, #050507 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        boxSizing: "border-box",
        gap: 20,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        data-ocid="login.cancel_button"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "none",
          border: "none",
          color: accent,
          fontSize: 15,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        ← Back
      </button>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: isEnroll
              ? "linear-gradient(135deg, #0071E3, #2997FF)"
              : "linear-gradient(135deg, #34C759, #30B350)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isEnroll ? (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Card"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          ) : (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Terminal"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </div>
        <span
          style={{
            color: "#F5F5F7",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.3px",
          }}
        >
          {isEnroll ? "Enroll Card" : "Charge Card"}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <input
          data-ocid="login.input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${username ? `${accent}44` : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            padding: "14px 16px",
            color: "#F5F5F7",
            fontSize: 16,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <input
          data-ocid="login.input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAuth("login")}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${password ? `${accent}44` : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            padding: "14px 16px",
            color: "#F5F5F7",
            fontSize: 16,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <div
            data-ocid="login.error_state"
            style={{
              color: "#FF453A",
              fontSize: 13,
              textAlign: "center",
              padding: "6px 12px",
              background: "rgba(255,69,58,0.1)",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="button"
          data-ocid="login.submit_button"
          disabled={loading || !username || !password}
          onClick={() => handleAuth("login")}
          style={{
            width: "100%",
            padding: "15px",
            background: loading
              ? "rgba(255,255,255,0.1)"
              : isEnroll
                ? "#0071E3"
                : "#34C759",
            border: "none",
            borderRadius: 14,
            color: isEnroll ? "white" : "#000",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Loading..." : "Log In"}
        </button>
        <button
          type="button"
          data-ocid="login.secondary_button"
          disabled={loading || !username || !password}
          onClick={() => handleAuth("register")}
          style={{
            width: "100%",
            padding: "15px",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${accent}44`,
            borderRadius: 14,
            color: accent,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Create Account
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "4px 0",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }}
          />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            or
          </span>
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }}
          />
        </div>
        <button
          type="button"
          data-ocid="login.secondary_button"
          disabled={isLoggingIn}
          onClick={async () => {
            iiHandledRef.current = false;
            if (identity) {
              if (!actor) return;
              try {
                const result = await actor.loginWithPrincipal(
                  identity.getPrincipal().toString(),
                );
                if ("ok" in result) {
                  onSuccess(result.ok, identity.getPrincipal().toString());
                } else {
                  setError((result as any).err || "Sign-in failed. Try again.");
                }
              } catch {
                setError("Connection error. Try again.");
              }
            } else {
              iiLogin();
            }
          }}
          style={{
            width: "100%",
            padding: "15px",
            background: "rgba(255,255,255,0.07)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderRadius: 14,
            color: "#F5F5F7",
            fontSize: 15,
            fontWeight: 600,
            cursor: isLoggingIn ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {isLoggingIn ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
                role="img"
                aria-label="Loading"
              >
                <title>Loading</title>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Passkey"
              >
                <title>Passkey</title>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              Sign in with Passkey or Google
            </>
          )}
        </button>
        {isLoginError && (
          <div
            data-ocid="login.error_state"
            style={{
              color: "#FF453A",
              fontSize: 13,
              textAlign: "center",
              padding: "6px 12px",
              background: "rgba(255,69,58,0.1)",
              borderRadius: 8,
            }}
          >
            Sign-in failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Enroll Card Sheet ────────────────────────────────────────────────────────
const GRADIENTS = [
  {
    label: "Ocean",
    value:
      "linear-gradient(135deg, #1a1f6e 0%, #0d2a8a 40%, #1e3fa0 70%, #2855b8 100%)",
  },
  {
    label: "Gold",
    value:
      "linear-gradient(135deg, #c6972a 0%, #e8b84b 30%, #d4a035 60%, #b8891f 100%)",
  },
  {
    label: "Silver",
    value:
      "linear-gradient(135deg, #E8E8E8 0%, #C8C8CC 30%, #F0F0F2 60%, #D0D0D4 100%)",
  },
  {
    label: "Dusk",
    value:
      "linear-gradient(135deg, #F8F0E8 0%, #FFEAD0 40%, #FFD4A0 70%, #FFC080 100%)",
  },
  {
    label: "Night",
    value: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  },
  {
    label: "Rose",
    value: "linear-gradient(135deg, #c0392b 0%, #d35400 50%, #e74c3c 100%)",
  },
];

function EnrollCardSheet({
  token,
  onEnroll,
  onClose,
  actor,
}: {
  token: string;
  onEnroll: () => void;
  onClose: () => void;
  actor: any;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [network, setNetwork] = useState("Visa");
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const last4 = cardNumber.replace(/\s/g, "").slice(-4);
  const holderName = [firstName, lastName].filter(Boolean).join(" ");

  const handleSubmit = async () => {
    const rawNum = cardNumber.replace(/\s/g, "");
    if (!actor || !firstName || !lastName || rawNum.length < 10 || !expiry)
      return;
    setLoading(true);
    setError("");
    try {
      const result = await actor.enrollCard(
        token,
        holderName,
        last4,
        network,
        gradient,
        expiry,
        BigInt(5000),
      );
      if ("ok" in result) {
        vibrate([50, 30, 100]);
        onEnroll();
        onClose();
      } else {
        setError(result.err);
      }
    } catch (_) {
      setError("Failed to enroll card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      data-ocid="enroll.sheet"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(18,18,20,0.98)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px 24px 0 0",
        padding: "24px 20px 40px",
        zIndex: 100,
        border: "1px solid rgba(255,255,255,0.1)",
        maxHeight: "85%",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: 36,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.25)",
          margin: "0 auto 20px",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <span style={{ color: "#F5F5F7", fontSize: 18, fontWeight: 700 }}>
          Add Card
        </span>
        <button
          type="button"
          onClick={onClose}
          data-ocid="enroll.close_button"
          style={{
            background: "none",
            border: "none",
            color: "#A1A1A6",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {/* Live card preview */}
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}
      >
        <div
          style={{
            width: 280,
            height: 165,
            borderRadius: 16,
            background: gradient,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            padding: "16px 20px",
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 50%,rgba(255,255,255,0.05) 100%)",
              borderRadius: 16,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.5px",
              opacity: 0.85,
            }}
          >
            {holderName || "YOUR NAME"}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 36,
              left: 20,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "2px",
              fontFamily: "'Courier New', monospace",
              opacity: 0.9,
            }}
          >
            {cardNumber
              ? `•••• •••• •••• ${last4 || "____"}`
              : "•••• •••• •••• ____"}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 20,
              right: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 7,
                  opacity: 0.6,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Expires
              </div>
              <div style={{ fontSize: 10, fontWeight: 600 }}>
                {expiry || "MM/YY"}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{network}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            {
              placeholder: "First Name",
              value: firstName,
              setter: setFirstName,
              ocid: "enroll.first_name.input",
            },
            {
              placeholder: "Last Name",
              value: lastName,
              setter: setLastName,
              ocid: "enroll.last_name.input",
            },
          ].map(({ placeholder, value, setter, ocid }) => (
            <input
              key={ocid}
              data-ocid={ocid}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "13px 14px",
                color: "#F5F5F7",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>
        <input
          data-ocid="enroll.card_number.input"
          type="text"
          inputMode="numeric"
          placeholder="10-digit Card Number"
          value={cardNumber}
          maxLength={10}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "13px 14px",
            color: "#F5F5F7",
            fontSize: 15,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            letterSpacing: "2px",
            fontFamily: "'Courier New', monospace",
          }}
        />
        <input
          data-ocid="enroll.expiry.input"
          type="text"
          placeholder="Expiry (MM/YY)"
          value={expiry}
          maxLength={5}
          onChange={(e) => setExpiry(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "13px 14px",
            color: "#F5F5F7",
            fontSize: 15,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          {["Visa", "Mastercard", "Amex", "Discover"].map((n) => (
            <button
              key={n}
              type="button"
              data-ocid="enroll.network.toggle"
              onClick={() => setNetwork(n)}
              style={{
                flex: 1,
                padding: "10px 4px",
                background:
                  network === n
                    ? "rgba(0,113,227,0.2)"
                    : "rgba(255,255,255,0.05)",
                border:
                  network === n
                    ? "1px solid #0071E3"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: network === n ? "#2997FF" : "#A1A1A6",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div>
          <div
            style={{
              color: "#A1A1A6",
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Color
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GRADIENTS.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setGradient(g.value)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: g.value,
                  border:
                    gradient === g.value
                      ? "2px solid #2997FF"
                      : "2px solid transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                title={g.label}
              />
            ))}
          </div>
        </div>
        {error && (
          <div
            data-ocid="enroll.error_state"
            style={{
              color: "#FF453A",
              fontSize: 13,
              padding: "6px 12px",
              background: "rgba(255,69,58,0.1)",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="button"
          data-ocid="enroll.submit_button"
          disabled={
            loading ||
            !firstName ||
            !lastName ||
            cardNumber.replace(/\s/g, "").length < 10 ||
            !expiry
          }
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "15px",
            background: loading ? "rgba(0,113,227,0.5)" : "#0071E3",
            border: "none",
            borderRadius: 14,
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? "Enrolling..." : "Enroll Card"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Wallet View (Enroll role) ────────────────────────────────────────────────
function WalletView({
  token,
  username: _username,
  onLogout,
  actor,
}: {
  token: string;
  username: string;
  onLogout: () => void;
  actor: any;
}) {
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [myCards, setMyCards] = useState<CardInfo[]>([]);
  const [allCards, setAllCards] = useState<CardInfo[]>([]);
  const [showEnrollSheet, setShowEnrollSheet] = useState(false);
  const paymentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentStateRef = useRef<PaymentState>("idle");
  const prevBetaRef = useRef<number | null>(null);
  const motionTriggerCooldown = useRef(false);
  const triggerPaymentRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    paymentStateRef.current = paymentState;
  }, [paymentState]);

  const loadCards = useCallback(async () => {
    if (!actor) return;
    const [mine, all] = await Promise.all([
      actor.getMyCards(token),
      actor.getAllCards(),
    ]);
    setMyCards(mine);
    setAllCards(all);
  }, [actor, token]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Motion via first touch (iOS Safari requires user gesture)
  const motionEnabledRef = useRef(false);

  const enableMotion = useCallback(async () => {
    if (motionEnabledRef.current) return;
    motionEnabledRef.current = true;

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm !== "granted") {
          motionEnabledRef.current = false;
          return;
        }
      } catch (_) {
        motionEnabledRef.current = false;
        return;
      }
    }

    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      setTiltX(Math.max(-15, Math.min(15, (beta - 30) * 0.3)));
      setTiltY(Math.max(-15, Math.min(15, gamma * 0.3)));
      if (prevBetaRef.current !== null && !motionTriggerCooldown.current) {
        const deltaBeta = beta - prevBetaRef.current;
        if (deltaBeta > 18) {
          motionTriggerCooldown.current = true;
          setTimeout(() => {
            motionTriggerCooldown.current = false;
          }, 3000);
          if (paymentStateRef.current === "idle") {
            triggerPaymentRef.current?.();
          }
        }
      }
      prevBetaRef.current = beta;
    };
    window.addEventListener("deviceorientation", handler);
  }, []);

  // NFC detection via Web NFC API
  useEffect(() => {
    if (!("NDEFReader" in window)) return;
    let abortController: AbortController | null = null;
    const startScan = async () => {
      try {
        abortController = new AbortController();
        const reader = new (window as any).NDEFReader();
        await reader.scan({ signal: abortController.signal });
        reader.addEventListener("reading", () => {
          if (paymentStateRef.current === "idle") {
            triggerPaymentRef.current?.();
          }
        });
      } catch (_) {}
    };
    startScan();
    return () => {
      abortController?.abort();
    };
  }, []);

  const triggerPayment = useCallback(() => {
    if (paymentStateRef.current !== "idle") return;
    vibrate([50, 30, 50]);
    setShowPaymentSheet(true);
    setPaymentState("pending");
    paymentTimerRef.current = setTimeout(() => {
      setPaymentState("success");
      vibrate([100, 50, 100, 50, 200]);
      try {
        const ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          1320,
          ctx.currentTime + 0.15,
        );
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (_) {}
      setTimeout(() => {
        setShowPaymentSheet(false);
        setTimeout(() => setPaymentState("idle"), 600);
      }, 2500);
    }, 1500);
  }, []);
  triggerPaymentRef.current = triggerPayment;

  const cancelPayment = useCallback(() => {
    if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
    setShowPaymentSheet(false);
    setTimeout(() => setPaymentState("idle"), 400);
  }, []);

  const activeCard = myCards[activeCardIdx];

  return (
    <div
      onTouchStart={enableMotion}
      onClick={enableMotion}
      onKeyDown={enableMotion}
      tabIndex={-1}
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #0A0A0F 0%, #050507 100%)",
        borderRadius: "inherit",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 12,
          paddingBottom: 4,
          position: "relative",
          zIndex: 10,
        }}
      >
        <DynamicIsland paymentState={paymentState} />
      </div>
      <StatusBar />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px 8px",
        }}
      >
        <h1
          style={{
            color: "#F5F5F7",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          Wallet
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            data-ocid="wallet.open_modal_button"
            onClick={() => setShowEnrollSheet(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                myCards.length >= 1
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.12)",
              border: "none",
              color: myCards.length >= 1 ? "#636366" : "#F5F5F7",
              fontSize: 20,
              cursor: myCards.length >= 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: myCards.length >= 1 ? 0.5 : 1,
            }}
          >
            +
          </button>
          <button
            type="button"
            data-ocid="wallet.logout.button"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#A1A1A6",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Log Out
          </button>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 17px",
          paddingBottom: 20,
        }}
        className="no-scrollbar"
      >
        {myCards.length === 0 ? (
          <div
            data-ocid="wallet.empty_state"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              gap: 12,
            }}
          >
            <div
              style={{ color: "#A1A1A6", fontSize: 15, textAlign: "center" }}
            >
              No cards yet
            </div>
            <button
              type="button"
              onClick={() => setShowEnrollSheet(true)}
              data-ocid="wallet.primary_button"
              style={{
                padding: "10px 20px",
                background: "#0071E3",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add Your First Card
            </button>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              height: `${200 + (myCards.length - 1) * 80}px`,
              marginBottom: 16,
            }}
          >
            {myCards.map((card, i) => (
              <motion.div
                key={card.id}
                data-ocid={`wallet.item.${i + 1}`}
                onClick={() => {
                  vibrate(10);
                  setActiveCardIdx(i);
                }}
                animate={{
                  top:
                    i <= activeCardIdx
                      ? i * 80
                      : activeCardIdx * 80 + 200 + (i - activeCardIdx - 1) * 80,
                  zIndex:
                    i === activeCardIdx
                      ? 30
                      : i < activeCardIdx
                        ? i * 5
                        : 20 - i,
                  scale: i === activeCardIdx ? 1 : 0.98,
                }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <CardVisual
                  card={{ ...card, textColor: "#FFFFFF" }}
                  tiltX={i === activeCardIdx ? tiltX : 0}
                  tiltY={i === activeCardIdx ? tiltY : 0}
                  balance={card.balance}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* All enrolled cards */}
        <div
          style={{
            background: "rgba(28,28,30,0.6)",
            borderRadius: 16,
            padding: "12px 16px",
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              color: "#A1A1A6",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            All Enrolled Cards
          </div>
          {allCards.length === 0 ? (
            <div
              data-ocid="allcards.empty_state"
              style={{
                color: "#636366",
                fontSize: 13,
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              No cards enrolled yet
            </div>
          ) : (
            allCards.map((c, i) => (
              <div
                key={c.id}
                data-ocid={`allcards.item.${i + 1}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom:
                    i < allCards.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <div>
                  <div
                    style={{ color: "#F5F5F7", fontSize: 13, fontWeight: 500 }}
                  >
                    {c.name} ••{c.last4}
                  </div>
                  <div style={{ color: "#A1A1A6", fontSize: 11 }}>
                    {c.owner} · {c.network}
                  </div>
                </div>
                <div
                  style={{ color: "#34C759", fontSize: 13, fontWeight: 600 }}
                >
                  {fmtDollars(c.balance)}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: 8,
          }}
        >
          <NFCTapArea onTap={triggerPayment} />
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "6px 0 10px",
        }}
      >
        <div
          style={{
            width: 120,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.3)",
          }}
        />
      </div>

      <AnimatePresence>
        {showPaymentSheet && activeCard && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={paymentState === "pending" ? cancelPayment : undefined}
              role="presentation"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 90,
              }}
            />
            <motion.div
              key="payment-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              data-ocid="payment.sheet"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(18,18,20,0.97)",
                backdropFilter: "blur(20px)",
                borderRadius: "24px 24px 0 0",
                padding: "24px 20px 40px",
                zIndex: 100,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.25)",
                  margin: "0 auto 20px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <AppleLogo size={20} />
                <span
                  style={{ color: "#F5F5F7", fontSize: 18, fontWeight: 700 }}
                >
                  Apple Pay
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <CardVisual
                  card={{ ...activeCard, textColor: "#FFFFFF" }}
                  mini
                  balance={activeCard.balance}
                />
              </div>
              <AnimatePresence mode="wait">
                {paymentState === "pending" && (
                  <motion.div
                    key="pending-s"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    data-ocid="payment.loading_state"
                    style={{
                      background: "linear-gradient(135deg,#0071E3,#2997FF)",
                      borderRadius: 14,
                      padding: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      className="animate-spin-slow"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                      }}
                    />
                    <span
                      style={{ color: "white", fontWeight: 600, fontSize: 15 }}
                    >
                      Authenticating with Face ID...
                    </span>
                  </motion.div>
                )}
                {paymentState === "success" && (
                  <motion.div
                    key="success-s"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    data-ocid="payment.success_state"
                    style={{
                      background: "rgba(52,199,89,0.15)",
                      border: "1px solid rgba(52,199,89,0.4)",
                      borderRadius: 14,
                      padding: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#34C759",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="16"
                        height="12"
                        viewBox="0 0 16 12"
                        fill="none"
                        role="img"
                        aria-label="Success"
                      >
                        <path
                          d="M1.5 6L6 10.5L14.5 1.5"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <div
                        style={{
                          color: "#34C759",
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        Completed
                      </div>
                      <div
                        style={{ color: "rgba(52,199,89,0.7)", fontSize: 12 }}
                      >
                        NFC payment complete
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {paymentState === "pending" && (
                <button
                  type="button"
                  onClick={cancelPayment}
                  data-ocid="payment.cancel_button"
                  style={{
                    width: "100%",
                    marginTop: 12,
                    background: "transparent",
                    border: "none",
                    color: "#A1A1A6",
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "10px",
                  }}
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnrollSheet && (
          <>
            <motion.div
              key="enroll-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnrollSheet(false)}
              role="presentation"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 90,
              }}
            />
            <EnrollCardSheet
              token={token}
              onEnroll={loadCards}
              onClose={() => setShowEnrollSheet(false)}
              actor={actor}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Charge Card View (Square-style POS) ──────────────────────────────────────
function ChargeView({
  token,
  onLogout,
  actor,
}: {
  token: string;
  onLogout: () => void;
  actor: any;
}) {
  const [amountCents, setAmountCents] = useState(""); // string of digits, no decimal
  const [allCards, setAllCards] = useState<CardInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [showOverlay, setShowOverlay] = useState(false);
  const [chargeError, setChargeError] = useState("");

  const loadCards = useCallback(async () => {
    if (!actor) return;
    const cards = await actor.getAllCards();
    setAllCards(cards);
  }, [actor]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const displayAmount = () => {
    const cents = Number(amountCents || "0");
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleKey = (key: string) => {
    vibrate(10);
    if (key === "back") {
      setAmountCents((prev) => prev.slice(0, -1));
    } else if (key === ".") {
      // ignore decimal — work in whole cents only
    } else {
      if (amountCents.length >= 7) return; // max $99,999.99
      setAmountCents((prev) => prev + key);
    }
  };

  const handleCharge = useCallback(async () => {
    const cents = BigInt(amountCents || "0");
    if (cents === BigInt(0) || !selectedCardId || !actor) return;
    setChargeError("");
    setShowOverlay(true);
    setPaymentState("pending");
    vibrate([50, 30, 50]);

    setTimeout(async () => {
      try {
        const result = await actor.chargeCard(token, selectedCardId, cents);
        if ("ok" in result) {
          setPaymentState("success");
          vibrate([100, 50, 100, 50, 200]);
          await loadCards();
          setTimeout(() => {
            setShowOverlay(false);
            setPaymentState("idle");
            setAmountCents("");
          }, 2500);
        } else {
          setPaymentState("fail");
          setChargeError(result.err);
          setTimeout(() => {
            setShowOverlay(false);
            setPaymentState("idle");
          }, 2000);
        }
      } catch (_) {
        setPaymentState("fail");
        setChargeError("Transaction failed.");
        setTimeout(() => {
          setShowOverlay(false);
          setPaymentState("idle");
        }, 2000);
      }
    }, 1500);
  }, [amountCents, selectedCardId, actor, token, loadCards]);

  // Face-down / flat detection for Safari (fake card reader auto-trigger)
  const faceDownCooldown = useRef(false);
  const prevBetaCharge = useRef<number | null>(null);
  const chargeMotionEnabledRef = useRef(false);
  const motionReadyRef = useRef(false);

  const enableChargeMotion = useCallback(async () => {
    if (chargeMotionEnabledRef.current) return;
    chargeMotionEnabledRef.current = true;

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const p = await (DeviceOrientationEvent as any).requestPermission();
        if (p !== "granted") {
          chargeMotionEnabledRef.current = false;
          return;
        }
      } catch (_) {
        chargeMotionEnabledRef.current = false;
        return;
      }
    }

    motionReadyRef.current = false;
    setTimeout(() => {
      motionReadyRef.current = true;
    }, 1000);

    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 90;
      if (
        prevBetaCharge.current !== null &&
        !faceDownCooldown.current &&
        motionReadyRef.current
      ) {
        const wasUpright = Math.abs(prevBetaCharge.current) > 50;
        const isFlat = Math.abs(beta) < 20;
        if (wasUpright && isFlat) {
          faceDownCooldown.current = true;
          setTimeout(() => {
            faceDownCooldown.current = false;
          }, 4000);
          if (
            paymentState === "idle" &&
            selectedCardId &&
            amountCents &&
            amountCents !== "0"
          ) {
            handleCharge();
          }
        }
      }
      prevBetaCharge.current = beta;
    };
    window.addEventListener("deviceorientation", handler);
  }, [paymentState, selectedCardId, amountCents, handleCharge]);

  // NFC detection for ChargeScreen
  useEffect(() => {
    if (!("NDEFReader" in window)) return;
    let abortController: AbortController | null = null;
    const startScan = async () => {
      try {
        abortController = new AbortController();
        const reader = new (window as any).NDEFReader();
        await reader.scan({ signal: abortController.signal });
        reader.addEventListener("reading", () => {
          if (
            paymentState === "idle" &&
            selectedCardId &&
            amountCents &&
            amountCents !== "0"
          ) {
            handleCharge();
          }
        });
      } catch (_) {}
    };
    startScan();
    return () => {
      abortController?.abort();
    };
  }, [paymentState, selectedCardId, amountCents, handleCharge]);

  const selectedCard = allCards.find((c) => c.id === selectedCardId);

  return (
    <div
      onTouchStart={enableChargeMotion}
      onClick={enableChargeMotion}
      onKeyDown={enableChargeMotion}
      tabIndex={-1}
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #050D05 0%, #030903 100%)",
        borderRadius: "inherit",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic Island area */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 12,
          paddingBottom: 4,
          position: "relative",
          zIndex: 10,
        }}
      >
        <DynamicIsland paymentState={paymentState} />
      </div>
      <StatusBar />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px 6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #34C759, #30B350)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="POS"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span
            style={{
              color: "#34C759",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.2px",
            }}
          >
            Square
          </span>
        </div>
        <button
          type="button"
          data-ocid="charge.logout.button"
          onClick={onLogout}
          style={{
            background: "none",
            border: "none",
            color: "#4CAF50",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Log Out
        </button>
      </div>

      {/* Amount display */}
      <div style={{ textAlign: "center", padding: "12px 20px 8px" }}>
        <div
          style={{
            color: "#34C759",
            fontSize: 48,
            fontWeight: 300,
            letterSpacing: "-1px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayAmount()}
        </div>
        {selectedCard && (
          <div
            style={{ color: "rgba(52,199,89,0.6)", fontSize: 12, marginTop: 4 }}
          >
            Charging: {selectedCard.name} ••{selectedCard.last4}
          </div>
        )}
      </div>

      {/* Keypad */}
      <div style={{ padding: "0 20px", marginBottom: 8 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
            (key) => (
              <button
                key={key}
                type="button"
                data-ocid="keypad.button"
                onClick={() => handleKey(key)}
                style={{
                  padding: "14px",
                  background:
                    key === "back"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(52,199,89,0.08)",
                  border: "1px solid rgba(52,199,89,0.15)",
                  borderRadius: 12,
                  color: key === "back" ? "#A1A1A6" : "#F5F5F7",
                  fontSize: key === "back" ? 18 : 22,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {key === "back" ? "⌫" : key}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Card list */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px" }}
        className="no-scrollbar"
      >
        <div
          style={{
            color: "#A1A1A6",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Select Card
        </div>
        {allCards.length === 0 ? (
          <div
            data-ocid="charge.empty_state"
            style={{
              color: "#636366",
              fontSize: 13,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            No enrolled cards found
          </div>
        ) : (
          allCards.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              data-ocid={`charge.item.${i + 1}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCardId(c.id)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                marginBottom: 8,
                background:
                  selectedCardId === c.id
                    ? "rgba(52,199,89,0.12)"
                    : "rgba(255,255,255,0.04)",
                border:
                  selectedCardId === c.id
                    ? "1px solid rgba(52,199,89,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 24,
                    borderRadius: 4,
                    background: c.gradient,
                    flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <div>
                  <div
                    style={{ color: "#F5F5F7", fontSize: 13, fontWeight: 600 }}
                  >
                    {c.name} ••{c.last4}
                  </div>
                  <div style={{ color: "#636366", fontSize: 11 }}>
                    {c.owner} · {c.network}
                  </div>
                </div>
              </div>
              <div style={{ color: "#34C759", fontSize: 13, fontWeight: 600 }}>
                {fmtDollars(c.balance)}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {chargeError && (
        <div
          data-ocid="charge.error_state"
          style={{
            margin: "0 16px 8px",
            color: "#FF453A",
            fontSize: 13,
            padding: "8px 12px",
            background: "rgba(255,69,58,0.1)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          {chargeError}
        </div>
      )}

      {/* Charge button */}
      <div style={{ padding: "8px 16px 12px" }}>
        <motion.button
          type="button"
          data-ocid="charge.primary_button"
          whileTap={{ scale: 0.97 }}
          onClick={handleCharge}
          disabled={!selectedCardId || !amountCents || amountCents === "0"}
          style={{
            width: "100%",
            padding: "16px",
            background:
              !selectedCardId || !amountCents
                ? "rgba(52,199,89,0.2)"
                : "linear-gradient(135deg, #34C759, #30B350)",
            border: "none",
            borderRadius: 16,
            color:
              !selectedCardId || !amountCents ? "rgba(52,199,89,0.5)" : "#000",
            fontSize: 17,
            fontWeight: 700,
            cursor: !selectedCardId || !amountCents ? "not-allowed" : "pointer",
            letterSpacing: "-0.2px",
          }}
        >
          Charge {displayAmount()}
        </motion.button>
      </div>

      {/* Home indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "4px 0 10px",
        }}
      >
        <div
          style={{
            width: 120,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.2)",
          }}
        />
      </div>

      {/* Tap-to-pay overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="tap-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="charge.modal"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {paymentState === "pending" && (
              <>
                <motion.div
                  animate={{ rotate: [-5, 5, -5], y: [0, -8, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  style={{ fontSize: 72 }}
                >
                  📱
                </motion.div>
                {/* Ripple rings */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                    }}
                    style={{
                      position: "absolute",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      border: "2px solid rgba(52,199,89,0.5)",
                    }}
                  />
                ))}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "#F5F5F7",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Place face-down on reader
                  </div>
                  <div style={{ color: "#A1A1A6", fontSize: 14 }}>
                    Processing {displayAmount()}...
                  </div>
                </div>
                <NFCIcon size={36} color="#34C759" />
              </>
            )}
            {paymentState === "success" && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
                data-ocid="charge.success_state"
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#34C759",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="40"
                    height="30"
                    viewBox="0 0 40 30"
                    fill="none"
                    role="img"
                    aria-label="Success"
                  >
                    <path
                      d="M3 15L15 27L37 3"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div
                  style={{ color: "#34C759", fontSize: 24, fontWeight: 700 }}
                >
                  Completed
                </div>
                <div style={{ color: "#A1A1A6", fontSize: 16 }}>
                  NFC payment complete
                </div>
              </motion.div>
            )}
            {paymentState === "fail" && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
                data-ocid="charge.error_state"
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#FF453A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    role="img"
                    aria-label="Failed"
                  >
                    <path
                      d="M8 8L28 28M28 8L8 28"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div
                  style={{ color: "#FF453A", fontSize: 20, fontWeight: 700 }}
                >
                  Payment Failed
                </div>
                <div style={{ color: "#A1A1A6", fontSize: 14 }}>
                  {chargeError}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { actor } = useActor();
  const [screen, setScreen] = useState<AppScreen>(() => {
    const savedToken = localStorage.getItem("wallet_token");
    const savedRole = localStorage.getItem("wallet_role") as AppRole | null;
    if (savedToken && savedRole)
      return savedRole === "enroll" ? "wallet" : "charge";
    return "role";
  });
  const [role, setRole] = useState<AppRole>(
    () => (localStorage.getItem("wallet_role") as AppRole) || "enroll",
  );
  const [token, setToken] = useState<string>(
    () => localStorage.getItem("wallet_token") || "",
  );
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem("wallet_username") || "",
  );

  const handleRoleSelect = (r: AppRole) => {
    setRole(r);
    setScreen("login");
  };

  const handleLoginSuccess = (t: string, uname: string) => {
    setToken(t);
    setUsername(uname);
    localStorage.setItem("wallet_token", t);
    localStorage.setItem("wallet_role", role);
    localStorage.setItem("wallet_username", uname);
    setScreen(role === "enroll" ? "wallet" : "charge");
  };

  const handleLogout = () => {
    setToken("");
    setUsername("");
    localStorage.removeItem("wallet_token");
    localStorage.removeItem("wallet_role");
    localStorage.removeItem("wallet_username");
    setScreen("role");
  };

  const isMobile = window.innerWidth <= 440;

  const phoneContent = (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #0A0A0F 0%, #050507 100%)",
        borderRadius: isMobile ? 0 : 44,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AnimatePresence mode="wait">
        {screen === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <RoleSelectScreen onSelect={handleRoleSelect} />
          </motion.div>
        )}
        {screen === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <LoginScreen
              role={role}
              onSuccess={handleLoginSuccess}
              onBack={() => setScreen("role")}
              actor={actor}
            />
          </motion.div>
        )}
        {screen === "wallet" && (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <WalletView
              token={token}
              username={username}
              onLogout={handleLogout}
              actor={actor}
            />
          </motion.div>
        )}
        {screen === "charge" && (
          <motion.div
            key="charge"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <ChargeView token={token} onLogout={handleLogout} actor={actor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) return phoneContent;

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(123,92,255,0.15) 0%, rgba(47,107,255,0.1) 40%, #050506 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* iPhone frame */}
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 52,
          background: "#1C1C1E",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.1), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(123,92,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.05)",
          padding: "6px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Side buttons */}
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 120,
            width: 4,
            height: 32,
            background: "#3A3A3C",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 164,
            width: 4,
            height: 60,
            background: "#3A3A3C",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 236,
            width: 4,
            height: 60,
            background: "#3A3A3C",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -3,
            top: 180,
            width: 4,
            height: 80,
            background: "#3A3A3C",
            borderRadius: "0 2px 2px 0",
          }}
        />
        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 48,
            overflow: "hidden",
          }}
        >
          {phoneContent}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(161,161,166,0.5)",
          fontSize: 11,
          whiteSpace: "nowrap",
        }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(161,161,166,0.5)", textDecoration: "none" }}
        >
          Built with ❤️ using caffeine.ai
        </a>
      </div>
    </div>
  );
}
