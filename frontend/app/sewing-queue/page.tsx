"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface SewingOrder {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string | null;
  actualFabricYds: number | string | null;
  status: string;
  createdAt: string;
  recipe: {
    id: string;
    recipeCode: string;
    name: string;
    category: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export default function SewingQueuePage() {
  const [orders, setOrders] = useState<SewingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/sewing/queue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to access the sewing queue.",
        );
      }

      const result: ApiResponse<SewingOrder[]> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load sewing queue.",
        );
      }

      setOrders(result.data || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load sewing queue.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("apparelfow_token");
    localStorage.removeItem("apparelfow_user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="dashboard-loading">
        <p>Loading sewing queue...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-mark small">
            AF
          </div>

          <div>
            <h1>ApparelFlow ERP</h1>
            <p>Sewing Supervisor</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              window.location.href =
                "/dashboard";
            }}
          >
            Dashboard
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              Sewing production
            </p>

            <h2>Sewing Queue</h2>

            <p>
              Only cutting batches that passed
              component verification are released
              into this queue.
            </p>
          </div>

          <div className="queue-count">
            <strong>{orders.length}</strong>
            <span>Verified batches</span>
          </div>
        </div>

        {error && (
          <div
            className="error-message"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="form-panel">
          <div className="panel-heading">
            <div>
              <h3>Verified Production Batches</h3>

              <p>
                Queue is controlled server-side using
                VERIFIED status.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              No verified cutting batches are
              currently waiting for sewing.
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Recipe</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Fabric Roll</th>
                    <th>Fabric Used</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>
                          {order.orderNo}
                        </strong>
                      </td>

                      <td>
                        {order.recipe.recipeCode}
                        <br />
                        <span className="table-muted">
                          {order.recipe.name}
                        </span>
                      </td>

                      <td>
                        {order.recipe.category}
                      </td>

                      <td>
                        {order.targetQty}
                      </td>

                      <td>
                        {order.fabricRollId || "—"}
                      </td>

                      <td>
                        {order.actualFabricYds ??
                          "—"}{" "}
                        yds
                      </td>

                      <td>
                        <span className="verification-status status-green">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="security-notice">
          <strong>Verification Gate</strong>

          <p>
            This queue displays only batches with
            server-side status VERIFIED. Cutting
            batches that are pending, rejected, or
            incomplete cannot enter sewing production.
          </p>
        </section>
      </section>
    </main>
  );
}