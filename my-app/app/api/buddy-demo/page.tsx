import Link from "next/link";
import { BuddyNetworkDemo } from "@/components/buddy-network-demo";
import { store } from "@/lib/store";

export default function BuddyDemoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f6faf7 0%, #eef6ff 50%, #ffffff 100%)",
        padding: "32px 20px 64px",
        fontFamily:
          "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 20,
            color: "#22577a",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Back to demo home
        </Link>

        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2c7a7b",
            }}
          >
            Plug-In Motivation Layer
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: 1.05,
              color: "#16324f",
            }}
          >
            Buddy Network Demo
          </h1>
          <p
            style={{
              maxWidth: 760,
              fontSize: 18,
              lineHeight: 1.6,
              color: "#395b64",
            }}
          >
            A community support layer for cardiac rehab that helps Maria stay
            motivated through nearby buddies, recovery circles, optional
            carpooling, and gentle accountability.
          </p>
        </div>

        <BuddyNetworkDemo
          initialBuddies={store.buddies}
          recoveryCircle={store.recoveryCircle}
          sharedActivities={store.sharedActivities}
        />
      </div>
    </main>
  );
}
