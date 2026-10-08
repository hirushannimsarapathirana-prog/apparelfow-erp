"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface VerificationItem {
  id: string;
  componentId: string;
  expectedQty: number | string;
  actualQty: number | string | null;
  status: "GREEN" | "YELLOW" | "RED";
  component: {
    id: string;
    componentName: string;
    piecesPerGarment: number | string;
  };
}

interface VerificationOrder {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string | null;
  actualFabricYds: number | string | null;
  status: string;
  recipe: {
    id: string;
    recipeCode: string;
    name: string;
    category: string;
    stdFabricYards: number | string;
    wastageCap: number | string;
    components: {
      id: string;
      componentName: string;
      piecesPerGarment: number | string;
    }[];
  };
  verificationItems: VerificationItem[];
}

interface PendingOrder {
  id: string;
  orderNo: string;
  targetQty: number;
  status: string;
  recipe: {
    recipeCode: string;
    name: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export default function VerificationPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [order, setOrder] = useState<VerificationOrder | null>(null);

  const [actualQuantities, setActualQuantities] = useState<
    Record<string, string>
  >({});

  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/cutting-orders`,
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

      const result: ApiResponse<PendingOrder[]> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load cutting orders.",
        );
      }

      const pendingOrders = (result.data || []).filter(
        (item) =>
          item.status === "PENDING_VERIFICATION" ||
          item.status === "COUNT_QC",
      );

      setOrders(pendingOrders);

      if (pendingOrders.length > 0) {
        await loadVerification(
          pendingOrders[0].id,
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load verification orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVerification(orderId: string) {
    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setSelectedOrderId(orderId);
    setLoadingOrder(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/verification/${orderId}`,
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

      const result: ApiResponse<VerificationOrder> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ||
            "Failed to load verification details.",
        );
      }

      setOrder(result.data);

      const quantities: Record<string, string> = {};

      result.data.verificationItems.forEach(
        (item) => {
          quantities[item.componentId] =
            item.actualQty === null
              ? ""
              : String(item.actualQty);
        },
      );

      setActualQuantities(quantities);
      setRejectionReason("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load verification details.",
      );
    } finally {
      setLoadingOrder(false);
    }
  }

  function updateQuantity(
    componentId: string,
    value: string,
  ) {
    setActualQuantities((current) => ({
      ...current,
      [componentId]: value,
    }));
  }

  function getClientStatus(
    expectedQty: number,
    actualQty: string,
  ): "GREEN" | "YELLOW" | "RED" {
    if (actualQty.trim() === "") {
      return "RED";
    }

    const actual = Number(actualQty);

    if (!Number.isFinite(actual) || actual < expectedQty) {
      return "RED";
    }

    if (actual === expectedQty) {
      return "GREEN";
    }

    return "YELLOW";
  }

  const calculatedItems = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.verificationItems.map((item) => {
      const expected = Number(item.expectedQty);
      const actual =
        actualQuantities[item.componentId] ?? "";

      return {
        ...item,
        expectedNumber: expected,
        status: getClientStatus(expected, actual),
      };
    });
  }, [order, actualQuantities]);

  const canApprove =
    calculatedItems.length > 0 &&
    calculatedItems.every(
      (item) =>
        item.status === "GREEN" ||
        item.status === "YELLOW",
    );

  async function saveVerification() {
    if (!order) {
      return;
    }

    setError("");
    setSuccess("");

    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const items = order.verificationItems.map(
      (item) => {
        const rawValue =
          actualQuantities[item.componentId];

        if (
          rawValue === undefined ||
          rawValue.trim() === ""
        ) {
          return {
            componentId: item.componentId,
            actualQty: -1,
          };
        }

        const actualQty = Number(rawValue);

        return {
          componentId: item.componentId,
          actualQty,
        };
      },
    );

    if (
      items.some(
        (item) =>
          !Number.isFinite(item.actualQty) ||
          item.actualQty < 0,
      )
    ) {
      setError(
        "All component quantities must be counted with valid numbers.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/verification/${order.id}/items`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items,
          }),
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const result: ApiResponse<VerificationOrder> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ||
            "Failed to save verification.",
        );
      }

      setOrder(result.data);

      const quantities: Record<string, string> = {};

      result.data.verificationItems.forEach(
        (item) => {
          quantities[item.componentId] =
            item.actualQty === null
              ? ""
              : String(item.actualQty);
        },
      );

      setActualQuantities(quantities);

      setSuccess(
        "Component counts saved successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save verification.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function approveOrder() {
    if (!order) {
      return;
    }

    if (!canApprove) {
      setError(
        "Approval is blocked. Every component must be GREEN or YELLOW.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setProcessing(true);

    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/verification/${order.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const result: ApiResponse<VerificationOrder> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Verification approval failed.",
        );
      }

      setSuccess(
        `${order.orderNo} approved and released to production.`,
      );

      setOrder(null);
      setSelectedOrderId("");
      setActualQuantities({});

      await loadOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Verification approval failed.",
      );
    } finally {
      setProcessing(false);
    }
  }

  async function rejectOrder() {
    if (!order) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError(
        "A rejection reason is required.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setProcessing(true);

    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/verification/${order.id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason:
              rejectionReason.trim(),
          }),
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const result: ApiResponse<VerificationOrder> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Verification rejection failed.",
        );
      }

      setSuccess(
        `${order.orderNo} has been rejected.`,
      );

      setOrder(null);
      setSelectedOrderId("");
      setActualQuantities({});
      setRejectionReason("");

      await loadOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Verification rejection failed.",
      );
    } finally {
      setProcessing(false);
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
        <p>Loading verification workspace...</p>
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
            <p>Cutting Verifier</p>
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
              Quality control
            </p>

            <h2>Batch Verification</h2>

            <p>
              Verify every component before a cutting
              batch can enter the sewing workflow.
            </p>
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

        {success && (
          <div
            className="success-message"
            role="status"
          >
            {success}
          </div>
        )}

        <section className="verification-layout">
          <aside className="verification-orders">
            <div className="panel-heading">
              <div>
                <h3>Pending batches</h3>
                <p>
                  Select a batch to verify.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                No batches are waiting for
                verification.
              </div>
            ) : (
              <div className="verification-order-list">
                {orders.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      selectedOrderId === item.id
                        ? "verification-order active"
                        : "verification-order"
                    }
                    onClick={() =>
                      loadVerification(item.id)
                    }
                    disabled={loadingOrder}
                  >
                    <strong>
                      {item.orderNo}
                    </strong>

                    <span>
                      {item.recipe.recipeCode} ·{" "}
                      {item.recipe.name}
                    </span>

                    <small>
                      Qty: {item.targetQty} ·{" "}
                      {item.status}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="verification-panel">
            {loadingOrder && (
              <div className="empty-state">
                Loading verification details...
              </div>
            )}

            {!loadingOrder && !order && (
              <div className="empty-state">
                Select a pending batch to begin
                verification.
              </div>
            )}

            {!loadingOrder && order && (
              <>
                <div className="verification-summary">
                  <div>
                    <p className="eyebrow">
                      Batch
                    </p>

                    <h3>{order.orderNo}</h3>

                    <p>
                      {order.recipe.recipeCode} —{" "}
                      {order.recipe.name}
                    </p>
                  </div>

                  <div className="verification-summary-grid">
                    <div>
                      <span>Target quantity</span>
                      <strong>
                        {order.targetQty}
                      </strong>
                    </div>

                    <div>
                      <span>Fabric roll</span>
                      <strong>
                        {order.fabricRollId ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Fabric used</span>
                      <strong>
                        {order.actualFabricYds ??
                          "—"}{" "}
                        yds
                      </strong>
                    </div>

                    <div>
                      <span>Wastage cap</span>
                      <strong>
                        {order.recipe.wastageCap}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="verification-table-wrapper">
                  <table className="verification-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Expected</th>
                        <th>Actual counted</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {calculatedItems.map(
                        (item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>
                                {
                                  item.component
                                    .componentName
                                }
                              </strong>

                              <span className="table-muted">
                                {
                                  item.component
                                    .piecesPerGarment
                                }{" "}
                                per garment
                              </span>
                            </td>

                            <td>
                              {item.expectedNumber}
                            </td>

                            <td>
                              <input
                                className="quantity-input"
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                value={
                                  actualQuantities[
                                    item.componentId
                                  ] ?? ""
                                }
                                onChange={(event) =>
                                  updateQuantity(
                                    item.componentId,
                                    event.target
                                      .value,
                                  )
                                }
                                disabled={
                                  saving ||
                                  processing
                                }
                              />
                            </td>

                            <td>
                              <span
                                className={`verification-status status-${item.status.toLowerCase()}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="verification-rule">
                  <strong>
                    Approval rule
                  </strong>

                  <span>
                    GREEN = exact count · YELLOW =
                    over count · RED = shortage or
                    missing count
                  </span>
                </div>

                <div className="verification-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={saveVerification}
                    disabled={
                      saving || processing
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save Counts"}
                  </button>

                  <button
                    type="button"
                    className="approve-button"
                    onClick={approveOrder}
                    disabled={
                      saving ||
                      processing ||
                      !canApprove
                    }
                  >
                    {processing
                      ? "Processing..."
                      : "Approve Batch"}
                  </button>
                </div>

                <div className="rejection-panel">
                  <label htmlFor="rejectionReason">
                    Rejection reason
                  </label>

                  <textarea
                    id="rejectionReason"
                    rows={3}
                    placeholder="Required when rejecting this batch"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(
                        event.target.value,
                      )
                    }
                    disabled={
                      saving || processing
                    }
                  />

                  <button
                    type="button"
                    className="reject-button"
                    onClick={rejectOrder}
                    disabled={
                      saving || processing
                    }
                  >
                    Reject Batch
                  </button>
                </div>
              </>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}