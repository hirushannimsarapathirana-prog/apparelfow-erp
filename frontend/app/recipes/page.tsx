"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RecipeComponent {
  id?: string;
  componentName: string;
  piecesPerGarment: number | string;
  imageUrl?: string | null;
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

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ComponentForm {
  componentName: string;
  piecesPerGarment: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] =
    useState("");

  const [recipeCode, setRecipeCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stdFabricYards, setStdFabricYards] =
    useState("");
  const [wastageCap, setWastageCap] = useState("");

  const [components, setComponents] = useState<
    ComponentForm[]
  >([
    {
      componentName: "",
      piecesPerGarment: "",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    const token = localStorage.getItem(
      "apparelfow_token",
    );

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/recipes`,
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

      const result: ApiResponse<Recipe[]> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load recipes.",
        );
      }

      setRecipes(result.data || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load recipes.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedRecipeId("");
    setRecipeCode("");
    setName("");
    setCategory("");
    setStdFabricYards("");
    setWastageCap("");

    setComponents([
      {
        componentName: "",
        piecesPerGarment: "",
      },
    ]);

    setError("");
    setSuccess("");
  }

  function selectRecipe(recipe: Recipe) {
    setSelectedRecipeId(recipe.id);
    setRecipeCode(recipe.recipeCode);
    setName(recipe.name);
    setCategory(recipe.category);
    setStdFabricYards(
      String(recipe.stdFabricYards),
    );
    setWastageCap(String(recipe.wastageCap));

    setComponents(
      recipe.components.map((component) => ({
        componentName:
          component.componentName,
        piecesPerGarment:
          String(component.piecesPerGarment),
      })),
    );

    setError("");
    setSuccess("");
  }

  function addComponent() {
    setComponents((current) => [
      ...current,
      {
        componentName: "",
        piecesPerGarment: "",
      },
    ]);
  }

  function removeComponent(index: number) {
    setComponents((current) =>
      current.filter(
        (_, componentIndex) =>
          componentIndex !== index,
      ),
    );
  }

  function updateComponent(
    index: number,
    field: keyof ComponentForm,
    value: string,
  ) {
    setComponents((current) =>
      current.map((component, componentIndex) =>
        componentIndex === index
          ? {
              ...component,
              [field]: value,
            }
          : component,
      ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fabric = Number(stdFabricYards);
    const wastage = Number(wastageCap);

    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!Number.isFinite(fabric) || fabric <= 0) {
      setError(
        "Standard fabric must be greater than zero.",
      );
      return;
    }

    if (!Number.isFinite(wastage) || wastage < 0) {
      setError(
        "Wastage cap cannot be negative.",
      );
      return;
    }

    if (components.length === 0) {
      setError(
        "At least one recipe component is required.",
      );
      return;
    }

    const formattedComponents =
      components.map((component) => ({
        componentName:
          component.componentName.trim(),
        piecesPerGarment: Number(
          component.piecesPerGarment,
        ),
      }));

    if (
      formattedComponents.some(
        (component) =>
          !component.componentName ||
          !Number.isFinite(
            component.piecesPerGarment,
          ) ||
          component.piecesPerGarment <= 0,
      )
    ) {
      setError(
        "Every component needs a name and a quantity greater than zero.",
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

    setSaving(true);

    try {
      const isEditing =
        selectedRecipeId.length > 0;

      const endpoint = isEditing
        ? `${API_URL}/recipes/${selectedRecipeId}`
        : `${API_URL}/recipes`;

      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? {
            name: name.trim(),
            category: category.trim(),
            stdFabricYards: fabric,
            wastageCap: wastage,
            components: formattedComponents,
          }
        : {
            recipeCode: recipeCode.trim(),
            name: name.trim(),
            category: category.trim(),
            stdFabricYards: fabric,
            wastageCap: wastage,
            components: formattedComponents,
          };

      if (!isEditing && !recipeCode.trim()) {
        setError("Recipe code is required.");
        setSaving(false);
        return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "Only a cutting supervisor can manage recipes.",
        );
      }

      const result: ApiResponse<Recipe> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to save recipe.",
        );
      }

      setSuccess(
        isEditing
          ? "Recipe updated successfully."
          : "Recipe created successfully.",
      );

      resetForm();
      await loadRecipes();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save recipe.",
      );
    } finally {
      setSaving(false);
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
        <p>Loading recipes...</p>
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
            <p>Recipe Management</p>
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
              Production configuration
            </p>

            <h2>Recipe Management</h2>

            <p>
              Create and maintain garment recipes
              and their component requirements.
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

        <section className="recipe-layout">
          <aside className="recipe-list-panel">
            <div className="panel-heading">
              <div>
                <h3>Recipes</h3>
                <p>
                  Select a recipe to edit.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                New Recipe
              </button>
            </div>

            {recipes.length === 0 ? (
              <div className="empty-state">
                No recipes found.
              </div>
            ) : (
              <div className="recipe-list">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className={
                      selectedRecipeId ===
                      recipe.id
                        ? "recipe-list-item active"
                        : "recipe-list-item"
                    }
                    onClick={() =>
                      selectRecipe(recipe)
                    }
                  >
                    <strong>
                      {recipe.recipeCode}
                    </strong>

                    <span>
                      {recipe.name}
                    </span>

                    <small>
                      {recipe.category} ·{" "}
                      {recipe.components.length}{" "}
                      components
                    </small>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="recipe-form-panel">
            <div className="panel-heading">
              <div>
                <h3>
                  {selectedRecipeId
                    ? "Edit Recipe"
                    : "Create Recipe"}
                </h3>

                <p>
                  {selectedRecipeId
                    ? "Recipe code cannot be changed."
                    : "Define the recipe and required cutting components."}
                </p>
              </div>
            </div>

            <form
              className="recipe-form"
              onSubmit={handleSubmit}
            >
              <div className="recipe-form-grid">
                <div className="form-group">
                  <label htmlFor="recipeCode">
                    Recipe code
                  </label>

                  <input
                    id="recipeCode"
                    type="text"
                    value={recipeCode}
                    onChange={(event) =>
                      setRecipeCode(
                        event.target.value,
                      )
                    }
                    disabled={
                      saving ||
                      Boolean(selectedRecipeId)
                    }
                    placeholder="e.g. REC-BL01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recipeName">
                    Recipe name
                  </label>

                  <input
                    id="recipeName"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. Casual Blouse"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <input
                    id="category"
                    type="text"
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    placeholder="e.g. Blouse"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stdFabricYards">
                    Standard fabric (yards)
                  </label>

                  <input
                    id="stdFabricYards"
                    type="number"
                    min="0.001"
                    step="0.001"
                    inputMode="decimal"
                    value={stdFabricYards}
                    onChange={(event) =>
                      setStdFabricYards(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="wastageCap">
                    Wastage cap (%)
                  </label>

                  <input
                    id="wastageCap"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={wastageCap}
                    onChange={(event) =>
                      setWastageCap(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              <div className="components-section">
                <div className="panel-heading">
                  <div>
                    <h3>
                      Recipe Components
                    </h3>

                    <p>
                      Define how many pieces are
                      required per garment.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={addComponent}
                    disabled={saving}
                  >
                    Add Component
                  </button>
                </div>

                <div className="component-editor">
                  {components.map(
                    (component, index) => (
                      <div
                        className="component-row"
                        key={index}
                      >
                        <div className="form-group">
                          <label>
                            Component name
                          </label>

                          <input
                            type="text"
                            value={
                              component.componentName
                            }
                            onChange={(event) =>
                              updateComponent(
                                index,
                                "componentName",
                                event.target
                                  .value,
                              )
                            }
                            disabled={saving}
                            placeholder="e.g. Front Body Panel"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Pieces per garment
                          </label>

                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            inputMode="decimal"
                            value={
                              component.piecesPerGarment
                            }
                            onChange={(event) =>
                              updateComponent(
                                index,
                                "piecesPerGarment",
                                event.target
                                  .value,
                              )
                            }
                            disabled={saving}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          className="remove-component-button"
                          onClick={() =>
                            removeComponent(
                              index,
                            )
                          }
                          disabled={
                            saving ||
                            components.length ===
                              1
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="recipe-form-actions">
                {selectedRecipeId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : selectedRecipeId
                      ? "Update Recipe"
                      : "Create Recipe"}
                </button>
              </div>
            </form>
          </section>
        </section>

        <section className="security-notice">
          <strong>Recipe Access Control</strong>

          <p>
            Recipe creation and editing are
            restricted to the cutting supervisor.
            Verification users can consume recipe
            requirements but cannot modify them.
          </p>
        </section>
      </section>
    </main>
  );
}