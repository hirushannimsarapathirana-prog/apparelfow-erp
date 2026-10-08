"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  cutting_supervisor: "Cutting Supervisor",
  cutting_verifier: "Cutting Verifier",
  sewing_supervisor: "Sewing Supervisor",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("apparelfow_user");

    if (!storedUser) {
      window.location.href = "/";
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("apparelfow_user");
      localStorage.removeItem("apparelfow_token");
      window.location.href = "/";
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("apparelfow_token");
    localStorage.removeItem("apparelfow_user");

    window.location.href = "/";
  }

  if (!user) {
    return (
      <main className="dashboard-loading">
        <p>Loading...</p>
      </main>
    );
  }

  const roleName = roleLabels[user.role] || user.role;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-brand">
            <div className="brand-mark small">AF</div>

            <div>
              <h1>ApparelFlow ERP</h1>
              <p>Production Control System</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </header>

      <section className="dashboard-content">
        <div className="welcome-section">
          <div>
            <p className="eyebrow">Production workspace</p>

            <h2>
              Welcome, {user.fullName}
            </h2>

            <p>
              Manage your assigned production workflow from this dashboard.
            </p>
          </div>

          <div className="role-badge">
            {roleName}
          </div>
        </div>

        <section className="dashboard-grid">
          {user.role === "cutting_supervisor" && (
            <>
              <DashboardCard
                title="Cutting Orders"
                description="Create, manage and submit cutting batches for verification."
              />

              <DashboardCard
                title="Recipes"
                description="Manage garment recipes and component requirements."
              />

              <DashboardCard
                title="Production Status"
                description="Track batches through the cutting workflow."
              />
            </>
          )}

          {user.role === "cutting_verifier" && (
            <>
              <DashboardCard
                title="Pending Verification"
                description="Review cutting batches and verify component quantities."
              />

              <DashboardCard
                title="Verification History"
                description="Review verification decisions and audit records."
              />

              <DashboardCard
                title="Quality Control"
                description="Identify GREEN, YELLOW and RED component results."
              />
            </>
          )}

          {user.role === "sewing_supervisor" && (
            <>
              <DashboardCard
                title="Sewing Queue"
                description="View cutting batches that have passed verification."
              />

              <DashboardCard
                title="Verified Batches"
                description="Review batches cleared for sewing production."
              />

              <DashboardCard
                title="Production Status"
                description="Monitor the sewing-ready production pipeline."
              />
            </>
          )}
        </section>

        <section className="security-notice">
          <strong>Verification Gate</strong>

          <p>
            Only fully verified cutting batches can proceed to the sewing
            queue. RED, missing or uncounted components cannot be approved.
          </p>
        </section>
      </section>
    </main>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
}

function DashboardCard({
  title,
  description,
}: DashboardCardProps) {
  return (
    <article className="dashboard-card">
      <div className="card-icon">✓</div>

      <h3>{title}</h3>

      <p>{description}</p>

      <button type="button" disabled>
        Coming next
      </button>
    </article>
  );
}