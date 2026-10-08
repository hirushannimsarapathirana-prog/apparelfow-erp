"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RecipeComponent {
  id: string;
  componentName: string;
  piecesPerGarment: number | string;
}

interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number | string;
  wastageCap: number | string;
  components: RecipeComponent[];
}

interface CuttingOrder {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string | null;
  actualFabricYds: number | string | null;
  status: string;
  createdAt: string;
  recipe?: {
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

export default function CuttingOrdersPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<CuttingOrder[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [fabricRollId, setFabricRollId] = useState("");
  const [actualFabricYds, setActualFabricYds] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token = localStorage.getItem("apparelfow_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const [recipesResponse, ordersResponse] =
        await Promise.all([
          fetch(`${API_URL}/recipes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/cutting-orders`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      if (
        recipesResponse.status === 401 ||
        ordersResponse.status === 401
      ) {
        handleLogout();
        return;
      }

      const recipesResult: ApiResponse<Recipe[]> =
        await recipesResponse.json();

      const ordersResult: ApiResponse<CuttingOrder[]> =
        await ordersResponse.json();

      if (!recipesResponse.ok || !recipesResult.success) {
        throw new Error(
          recipesResult.message ||
            "Failed to load recipes.",
        );
      }

      if (!ordersResponse.ok || !ordersResult.success) {
        throw new Error(
          ordersResult.message ||
            "Failed to load cutting orders.",
        );
      }

      setRecipes(recipesResult.data || []);
      setOrders(ordersResult.data || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load data.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const quantity = Number(targetQty);
    const fabric = Number(actualFabricYds);

    if (!selectedRecipe) {
      setError("Please select a recipe.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError(
        "Target quantity must be a whole number greater than zero.",
      );
      return;
    }

    if (!Number.isFinite(fabric) || fabric <= 0) {
      setError(
        "Actual fabric used must be greater than zero.",
      );
      return;
    }

    const token = localStorage.getItem(
      "apparelfow_token",
    );

    if (!token) {
      window.location.href = "/";
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        `${API_URL}/cutting-orders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipeId: selectedRecipe,
            targetQty: quantity,
            fabricRollId:
              fabricRollId.trim() || undefined,
            actualFabricYds: fabric,
          }),
        },
      );

      const result: ApiResponse<CuttingOrder> =
        await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Failed to create cutting order.",
        );
      }

      setOrders((current) => [
        result.data!,
        ...current,
      ]);

      setSelectedRecipe("");
      setTargetQty("");
      setFabricRollId("");
      setActualFabricYds("");

      setSuccess(
        `${result.data.orderNo} created successfully.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create cutting order.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmitOrder(
    orderId: string,
  ) {
    setError("");
    setSuccess("");

    const token = localStorage.getItem(
      "apparelfow_token",
    );

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/cutting-orders/${orderId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const result: ApiResponse<CuttingOrder> =
        await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Failed to submit order.",
        );
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? result.data!
            : order,
        ),
      );

      setSuccess(
        `${result.data.orderNo} submitted for verification.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to submit order.",
      );
    }
  }

  function handleLogout() {
    localStorage.removeItem(
      "apparelfow_token",
    );
    localStorage.removeItem(
      "apparelfow_user",
    );

    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="dashboard-loading">
        <p>Loading cutting orders...</p>
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
            <p>Cutting Supervisor</p>
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
              Cutting production
            </p>

            <h2>Cutting Orders</h2>

            <p>
              Create production batches and submit
              completed cutting work for component
              verification.
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

        <section className="form-panel">
          <div className="panel-heading">
            <div>
              <h3>Create Cutting Order</h3>

              <p>
                The order starts in
                CUTTING_IN_PROGRESS until submitted.
              </p>
            </div>
          </div>

          <form
            className="order-form"
            onSubmit={handleCreateOrder}
          >
            <div className="form-group">
              <label htmlFor="recipe">
                Recipe
              </label>

              <select
                id="recipe"
                value={selectedRecipe}
                onChange={(event) =>
                  setSelectedRecipe(
                    event.target.value,
                  )
                }
                disabled={creating}
                required
              >
                <option value="">
                  Select a recipe
                </option>

                {recipes.map((recipe) => (
                  <option
                    key={recipe.id}
                    value={recipe.id}
                  >
                    {recipe.recipeCode} —{" "}
                    {recipe.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="targetQty">
                Target batch quantity
              </label>

              <input
                id="targetQty"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={targetQty}
                onChange={(event) =>
                  setTargetQty(
                    event.target.value,
                  )
                }
                disabled={creating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fabricRollId">
                Fabric roll ID
              </label>

              <input
                id="fabricRollId"
                type="text"
                placeholder="Optional"
                value={fabricRollId}
                onChange={(event) =>
                  setFabricRollId(
                    event.target.value,
                  )
                }
                disabled={creating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="actualFabricYds">
                Actual fabric used (yards)
              </label>

              <input
                id="actualFabricYds"
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                value={actualFabricYds}
                onChange={(event) =>
                  setActualFabricYds(
                    event.target.value,
                  )
                }
                disabled={creating}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Cutting Order"}
            </button>
          </form>
        </section>

        <section className="orders-section">
          <div className="panel-heading">
            <div>
              <h3>Recent Cutting Orders</h3>

              <p>
                Submit orders when cutting is
                complete.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              No cutting orders found.
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Recipe</th>
                    <th>Quantity</th>
                    <th>Fabric Roll</th>
                    <th>Fabric Used</th>
                    <th>Status</th>
                    <th>Action</th>
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
                        {order.recipe?.recipeCode ||
                          "—"}
                        <br />

                        <span className="table-muted">
                          {order.recipe?.name ||
                            "Recipe unavailable"}
                        </span>
                      </td>

                      <td>
                        {order.targetQty}
                      </td>

                      <td>
                        {order.fabricRollId ||
                          "—"}
                      </td>

                      <td>
                        {order.actualFabricYds ??
                          "—"}{" "}
                        yds
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${order.status.toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td>
                        {order.status ===
                          "CUTTING_IN_PROGRESS" && (
                          <button
                            type="button"
                            className="table-action"
                            onClick={() =>
                              handleSubmitOrder(
                                order.id,
                              )
                            }
                          >
                            Submit for verification
                          </button>
                        )}

                        {order.status !==
                          "CUTTING_IN_PROGRESS" && (
                          <span className="table-muted">
                            Submitted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}