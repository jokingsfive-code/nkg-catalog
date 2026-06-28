import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api from "./api";
import "./App.css";

const NKG_WHATSAPP_NUMBER = "60179655056";

function App() {
  const path = window.location.pathname;
  const isCatalogPage = path === "/" || path === "/catalog";
  const isAdminPage = path === "/admin";

  const [page, setPage] = useState("categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [designs, setDesigns] = useState([]);

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const [editCategoryTarget, setEditCategoryTarget] = useState(null);
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: "",
    sort_order: "",
  });
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [selectedCatalogDesign, setSelectedCatalogDesign] = useState(null);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedDesigns, setSelectedDesigns] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category_id: "",
    sort_order: "",
    is_featured: false,
  });
  const [updating, setUpdating] = useState(false);
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(
    localStorage.getItem("nkg_admin_unlocked") === "yes"
  );

  const loginAdmin = (e) => {
    e.preventDefault();

    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem("nkg_admin_unlocked", "yes");
      setAdminUnlocked(true);
      setAdminPassword("");
      toast.success("Admin unlocked");
      return;
    }

    toast.error("Wrong password");
  };

  const logoutAdmin = () => {
    localStorage.removeItem("nkg_admin_unlocked");
    setAdminUnlocked(false);
    toast.success("Logged out");
  };
  useEffect(() => {
    fetchCategories();
    fetchDesigns();
  }, []);

  const fetchCategories = async () => {
    const { data } = await api.get("/categories");
    setCategories(data);
  };

  const fetchDesigns = async (searchValue = "") => {
    const { data } = await api.get(
      `/designs?search=${encodeURIComponent(searchValue)}`
    );
    setDesigns(data);
  };

  const getDesignCode = (design) => {
    return `NKG-${String(design.id).padStart(4, "0")}`;
  };

  const getWhatsappLink = (design) => {
  const designCode = getDesignCode(design);
  const baseUrl = window.location.origin;
  const designLink = `${baseUrl}/design/${designCode}`;

  const message = `Hi NKG Apparel,

Saya berminat dengan design ini:

Code: ${designCode}
Category: ${design.category?.name || "Catalog"}

Preview:
${designLink}

Boleh bagi detail harga dan tempahan?`;

  return `https://wa.me/${NKG_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
};

  const filteredCatalogDesigns = useMemo(() => {
    if (catalogCategory === "all") return designs;

    return designs.filter(
      (design) => String(design.category_id) === String(catalogCategory)
    );
  }, [designs, catalogCategory]);

  const featuredCatalogDesigns = filteredCatalogDesigns.filter(
    (design) => design.is_featured
  );

  const normalCatalogDesigns = filteredCatalogDesigns.filter(
    (design) => !design.is_featured
  );

  const activeFeaturedDesign =
    featuredCatalogDesigns.length > 0
      ? featuredCatalogDesigns[
          activeFeaturedIndex % featuredCatalogDesigns.length
        ]
      : null;

  useEffect(() => {
    if (featuredCatalogDesigns.length === 0) {
      setActiveFeaturedIndex(0);
      return;
    }

    if (activeFeaturedIndex >= featuredCatalogDesigns.length) {
      setActiveFeaturedIndex(0);
    }
  }, [featuredCatalogDesigns.length, activeFeaturedIndex]);

  useEffect(() => {
    if (!isCatalogPage || featuredCatalogDesigns.length <= 1) return;

    const timer = setInterval(() => {
      setActiveFeaturedIndex((current) =>
        current + 1 >= featuredCatalogDesigns.length ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [isCatalogPage, featuredCatalogDesigns.length]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    await fetchDesigns(value);
  };

  const nextFeatured = () => {
    if (featuredCatalogDesigns.length === 0) return;

    setActiveFeaturedIndex((current) =>
      current + 1 >= featuredCatalogDesigns.length ? 0 : current + 1
    );
  };

  const previousFeatured = () => {
    if (featuredCatalogDesigns.length === 0) return;

    setActiveFeaturedIndex((current) =>
      current - 1 < 0 ? featuredCatalogDesigns.length - 1 : current - 1
    );
  };

  const changeAdminPage = (nextPage) => {
    setPage(nextPage);
    setMobileMenuOpen(false);
  };

  const addCategory = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter category name");
      return;
    }

    try {
      await api.post("/categories", {
        name,
        sort_order: sortOrder || 0,
      });

      toast.success("Category created successfully");
      setName("");
      setSortOrder("");
      await fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create category");
    }
  };

  const openEditCategoryModal = (category) => {
    setEditCategoryTarget(category);
    setEditCategoryForm({
      name: category.name || "",
      sort_order: category.sort_order ?? 0,
    });
  };

  const closeEditCategoryModal = () => {
    setEditCategoryTarget(null);
    setEditCategoryForm({
      name: "",
      sort_order: "",
    });
  };

  const updateCategory = async (e) => {
    e.preventDefault();

    if (!editCategoryTarget) return;

    if (!editCategoryForm.name.trim()) {
      toast.error("Please enter category name");
      return;
    }

    try {
      setUpdatingCategory(true);

      await api.patch(`/categories/${editCategoryTarget.id}`, {
        name: editCategoryForm.name,
        sort_order: editCategoryForm.sort_order || 0,
      });

      toast.success("Category updated successfully");
      closeEditCategoryModal();
      await fetchCategories();
      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update category");
    } finally {
      setUpdatingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;

    try {
      setDeletingCategory(true);

      await api.delete(`/categories/${deleteCategoryTarget.id}`);

      toast.success("Category deleted successfully");
      setDeleteCategoryTarget(null);
      await fetchCategories();
      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to delete category. Make sure no design is using this category."
      );
    } finally {
      setDeletingCategory(false);
    }
  };

  const uploadDesigns = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one design file");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("category_id", selectedCategory);

      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      await api.post("/designs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        selectedFiles.length > 1
          ? `${selectedFiles.length} designs uploaded successfully`
          : "Design uploaded successfully"
      );

      setSelectedCategory("");
      setSelectedFiles([]);
      setSelectedDesigns([]);
      setSearch("");

      const fileInput = document.getElementById("designFiles");
      if (fileInput) fileInput.value = "";

      await fetchDesigns();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again");
    } finally {
      setUploading(false);
    }
  };

  const toggleFeatured = async (design) => {
    try {
      await api.patch(`/designs/${design.id}/featured`);

      toast.success(
        design.is_featured ? "Removed from featured" : "Added to featured"
      );

      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update featured");
    }
  };

  const toggleSelectDesign = (designId) => {
    setSelectedDesigns((current) =>
      current.includes(designId)
        ? current.filter((id) => id !== designId)
        : [...current, designId]
    );
  };

  const selectAllDesigns = () => {
    if (selectedDesigns.length === designs.length) {
      setSelectedDesigns([]);
      return;
    }

    setSelectedDesigns(designs.map((design) => design.id));
  };

  const confirmBulkDelete = async () => {
    if (selectedDesigns.length === 0) return;

    try {
      setBulkDeleting(true);

      await Promise.all(
        selectedDesigns.map((designId) => api.delete(`/designs/${designId}`))
      );

      toast.success(`${selectedDesigns.length} designs deleted successfully`);
      setSelectedDesigns([]);
      setBulkDeleteOpen(false);
      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error("Failed to bulk delete designs");
    } finally {
      setBulkDeleting(false);
    }
  };

  const openEditModal = (design) => {
    setEditTarget(design);
    setEditForm({
      name: design.name || "",
      category_id: design.category_id || "",
      sort_order: design.sort_order ?? 0,
      is_featured: !!design.is_featured,
    });
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditForm({
      name: "",
      category_id: "",
      sort_order: "",
      is_featured: false,
    });
  };

  const updateDesign = async (e) => {
    e.preventDefault();

    if (!editTarget) return;

    if (!editForm.category_id) {
      toast.error("Please select category");
      return;
    }

    try {
      setUpdating(true);

      await api.patch(`/designs/${editTarget.id}`, {
        name: editForm.name,
        category_id: editForm.category_id,
        sort_order: editForm.sort_order || 0,
        is_featured: editForm.is_featured,
      });

      toast.success("Design updated successfully");
      closeEditModal();
      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update design");
    } finally {
      setUpdating(false);
    }
  };

  const confirmDeleteDesign = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/designs/${deleteTarget.id}`);
      toast.success("Design deleted successfully");
      setDeleteTarget(null);
      setSelectedDesigns((current) =>
        current.filter((id) => id !== deleteTarget.id)
      );
      await fetchDesigns(search);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete design");
    } finally {
      setDeleting(false);
    }
  };

  if (isCatalogPage) {
    const closeCatalogModal = () => {
      setSelectedCatalogDesign(null);
    };

    return (
      <div className="catalogPage">
        {selectedCatalogDesign && (
          <div className="catalogModalOverlay">
            <div className="catalogModal">
              <button className="catalogClose" onClick={closeCatalogModal}>
                ×
              </button>

              <img
                src={selectedCatalogDesign.image_url}
                alt={selectedCatalogDesign.name}
              />

              <div className="catalogModalInfo">
                <span>{selectedCatalogDesign.category?.name}</span>

                <small className="modalDesignCode">
                  {getDesignCode(selectedCatalogDesign)}
                </small>

                <h2>{selectedCatalogDesign.name}</h2>

                <a
                  href={getWhatsappLink(selectedCatalogDesign)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        <section className="catalogHero">
          <div>
            <span className="catalogBadge">NKG APPAREL CATALOG</span>
            <h1>Choose Your Teamwear Design</h1>
            <p>
              Browse design pilihan NKG Apparel. Pilih design yang berkenan dan
              terus WhatsApp kami untuk tempahan.
            </p>

            <a
              className="catalogWhatsappMain mobileOnly"
              href={`https://wa.me/${NKG_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp NKG
            </a>
          </div>

          {activeFeaturedDesign ? (
            <div className="heroFeaturedSlider">
              <div className="heroFeaturedText">
                <span>Featured Pick</span>
                <h3>{activeFeaturedDesign.name}</h3>
                <p>{activeFeaturedDesign.category?.name}</p>
              </div>

              <button
                type="button"
                className="heroFeaturedImage"
                onClick={() => setSelectedCatalogDesign(activeFeaturedDesign)}
              >
                <img
                  src={activeFeaturedDesign.image_url}
                  alt={activeFeaturedDesign.name || "Featured design"}
                />
              </button>

              <div className="heroFeaturedActions">
                <button type="button" onClick={previousFeatured}>
                  ‹
                </button>

                <a
                  href={getWhatsappLink(activeFeaturedDesign)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>

                <button type="button" onClick={nextFeatured}>
                  ›
                </button>
              </div>

              <div className="heroFeaturedDots">
                {featuredCatalogDesigns.map((design, index) => (
                  <button
                    key={design.id}
                    type="button"
                    className={
                      index === activeFeaturedIndex ? "active" : undefined
                    }
                    onClick={() => setActiveFeaturedIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <a
              className="catalogWhatsappMain desktopOnly"
              href={`https://wa.me/${NKG_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp NKG
            </a>
          )}
        </section>

        <section className="catalogFilter">
          <input
            type="text"
            placeholder="Search design..."
            value={search}
            onChange={handleSearch}
          />

          <select
            value={catalogCategory}
            onChange={(e) => setCatalogCategory(e.target.value)}
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {featuredCatalogDesigns.length > 0 && (
          <section className="catalogSection">
            <div className="catalogSectionHead">
              <h2>Featured Designs</h2>
              <p>Design pilihan utama daripada NKG Apparel.</p>
            </div>

            <div className="catalogGrid">
              {featuredCatalogDesigns.map((design) => (
                <div
                  className="catalogCard featuredCatalogCard"
                  key={design.id}
                  onClick={() => setSelectedCatalogDesign(design)}
                >
                  <div className="featuredRibbon">Featured</div>

                  <img src={design.image_url} alt={design.name || "Design"} />

                  <div className="catalogCardInfo">
                    <small className="designCode">
                      {getDesignCode(design)}
                    </small>

                    <b>{design.name || "Untitled Design"}</b>
                    <span>{design.category?.name}</span>

                    <a
                      href={getWhatsappLink(design)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="catalogSection">
          <div className="catalogSectionHead">
            <h2>All Designs</h2>
            <p>{filteredCatalogDesigns.length} design available.</p>
          </div>

          {filteredCatalogDesigns.length === 0 ? (
            <div className="catalogEmpty">No design found.</div>
          ) : (
            <div className="catalogGrid">
              {normalCatalogDesigns.map((design) => (
                <div
                  className="catalogCard"
                  key={design.id}
                  onClick={() => setSelectedCatalogDesign(design)}
                >
                  <img src={design.image_url} alt={design.name || "Design"} />

                  <div className="catalogCardInfo">
                    <small className="designCode">
                      {getDesignCode(design)}
                    </small>

                    <b>{design.name || "Untitled Design"}</b>
                    <span>{design.category?.name}</span>

                    <a
                      href={getWhatsappLink(design)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!isAdminPage) {
    window.location.href = "/";
    return null;
  }

  if (!adminUnlocked) {
    return (
      <div className="adminLoginPage">
        <Toaster position="top-right" />

        <form className="adminLoginBox" onSubmit={loginAdmin}>
          <h1>NKG</h1>
          <p>APPAREL ADMIN</p>

          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />

          <button type="submit">Login Admin</button>

          <a href="/">View Public Catalog</a>
        </form>
      </div>
    );
  }

  return (
     <div className={mobileMenuOpen ? "adminShell menuOpen" : "adminShell"}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#070a26",
            color: "#f5f5f5",
            border: "1px solid rgba(184, 251, 60, 0.28)",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            fontWeight: "700",
          },
          success: {
            iconTheme: {
              primary: "#b8fb3c",
              secondary: "#03045e",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff4d6d",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobileSidebarOverlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {deleteCategoryTarget && (
        <div className="modalOverlay">
          <div className="deleteModal">
            <div className="modalIcon">!</div>

            <h3>Delete Category?</h3>

            <p>
              This will remove <b>{deleteCategoryTarget.name}</b>. Make sure no
              design is using this category.
            </p>

            <div className="modalActions">
              <button
                type="button"
                className="cancelBtn"
                onClick={() => setDeleteCategoryTarget(null)}
                disabled={deletingCategory}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirmDeleteBtn"
                onClick={confirmDeleteCategory}
                disabled={deletingCategory}
              >
                {deletingCategory ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editCategoryTarget && (
        <div className="modalOverlay">
          <div className="editModal">
            <div className="editModalHead">
              <div>
                <h3>Edit Category</h3>
                <p>{editCategoryTarget.name}</p>
              </div>

              <button
                type="button"
                onClick={closeEditCategoryModal}
                disabled={updatingCategory}
              >
                ×
              </button>
            </div>

            <form onSubmit={updateCategory} className="editForm">
              <div>
                <label>Category Name</label>
                <input
                  type="text"
                  value={editCategoryForm.name}
                  onChange={(e) =>
                    setEditCategoryForm({
                      ...editCategoryForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Category name..."
                />
              </div>

              <div>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={editCategoryForm.sort_order}
                  onChange={(e) =>
                    setEditCategoryForm({
                      ...editCategoryForm,
                      sort_order: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="modalActions">
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={closeEditCategoryModal}
                  disabled={updatingCategory}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="saveBtn"
                  disabled={updatingCategory}
                >
                  {updatingCategory ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modalOverlay">
          <div className="deleteModal">
            <div className="modalIcon">!</div>

            <h3>Delete Design?</h3>

            <p>
              This action will permanently remove{" "}
              <b>{deleteTarget.name || "this design"}</b> from the catalog.
            </p>

            <div className="modalActions">
              <button
                type="button"
                className="cancelBtn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirmDeleteBtn"
                onClick={confirmDeleteDesign}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Design"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="modalOverlay">
          <div className="deleteModal">
            <div className="modalIcon">!</div>

            <h3>Bulk Delete?</h3>

            <p>
              This will permanently remove{" "}
              <b>{selectedDesigns.length} selected designs</b> from the catalog.
            </p>

            <div className="modalActions">
              <button
                type="button"
                className="cancelBtn"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirmDeleteBtn"
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="modalOverlay">
          <div className="editModal">
            <div className="editModalHead">
              <div>
                <h3>Edit Design</h3>
                <p>{editTarget.name}</p>
              </div>

              <button type="button" onClick={closeEditModal} disabled={updating}>
                ×
              </button>
            </div>

            <form onSubmit={updateDesign} className="editForm">
              <div>
                <label>Design Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Design name..."
                />
              </div>

              <div>
                <label>Category</label>
                <select
                  value={editForm.category_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category_id: e.target.value })
                  }
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={editForm.sort_order}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sort_order: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <label className="checkboxRow">
                <input
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      is_featured: e.target.checked,
                    })
                  }
                />
                <span>Mark as featured design</span>
              </label>

              <div className="modalActions">
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button type="submit" className="saveBtn" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="brandBox">
          <h1>NKG</h1>
          <p>APPAREL</p>
        </div>

        <div className="menuLabel">MENU</div>

        <button
          className={`menuItem ${page === "categories" ? "active" : ""}`}
          onClick={() => changeAdminPage("categories")}
        >
          Categories
        </button>

        <button
          className={`menuItem ${page === "designs" ? "active" : ""}`}
          onClick={() => changeAdminPage("designs")}
        >
          Designs
        </button>

        <div className="sidebarFoot">
          <b>NKG APPAREL</b>
          <span>Catalog Management</span>
        </div>
      </aside>

      <main className="mainPanel">
        <div className="topbar">
          <button
            type="button"
            className="hamburger"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div className="adminUser">
            <div className="avatar">A</div>
            <div>
  <b>Admin</b>
  <span>Administrator</span>
  <button type="button" className="logoutBtn" onClick={logoutAdmin}>
    Logout
  </button>
</div>
          </div>
        </div>

        {page === "categories" ? (
          <>
            <section className="pageHeader">
              <div>
                <h2>Categories</h2>
                <p>
                  Dashboard / <span>Categories</span>
                </p>
              </div>
            </section>

            <section className="statsGrid">
              <div className="statCard">
                <div className="statIcon">▦</div>
                <div>
                  <h3>{categories.length}</h3>
                  <p>Total Categories</p>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon blue">◇</div>
                <div>
                  <h3>{categories.length}</h3>
                  <p>Active Categories</p>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon purple">✦</div>
                <div>
                  <h3>{designs.length}</h3>
                  <p>Total Designs</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <h3>Add New Category</h3>

              <form onSubmit={addCategory} className="adminForm">
                <div>
                  <label>Category Name</label>
                  <input
                    type="text"
                    placeholder="Enter category name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                <button type="submit">+ Add Category</button>
              </form>
            </section>

            <section className="panel">
              <h3>Category List</h3>

              <div className="table categoryTable">
                <div className="tableHead categoryTableHead">
                  <span>#</span>
                  <span>Name</span>
                  <span>Slug</span>
                  <span>Sort</span>
                  <span>Action</span>
                </div>

                {categories.map((category, index) => (
                  <div
                    className="tableRow categoryTableRow"
                    key={category.id}
                  >
                    <span>{index + 1}</span>
                    <b>{category.name}</b>
                    <span>{category.slug}</span>
                    <em>{category.sort_order}</em>

                    <div className="categoryActions">
                      <button
                        type="button"
                        className="editBtn smallActionBtn"
                        onClick={() => openEditCategoryModal(category)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="deleteBtn smallActionBtn"
                        onClick={() => setDeleteCategoryTarget(category)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="pageHeader">
              <div>
                <h2>Designs</h2>
                <p>
                  Dashboard / <span>Designs</span>
                </p>
              </div>
            </section>

            <section className="statsGrid">
              <div className="statCard">
                <div className="statIcon">▦</div>
                <div>
                  <h3>{designs.length}</h3>
                  <p>Total Designs</p>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon blue">◇</div>
                <div>
                  <h3>{categories.length}</h3>
                  <p>Categories</p>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon purple">✦</div>
                <div>
                  <h3>{designs.filter((item) => item.is_featured).length}</h3>
                  <p>Featured</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <h3>Bulk Upload Designs</h3>

              <form onSubmit={uploadDesigns} className="adminForm uploadForm">
                <div>
                  <label>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Design Files</label>
                  <input
                    id="designFiles"
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) =>
                      setSelectedFiles(Array.from(e.target.files))
                    }
                  />
                </div>

                <button type="submit" disabled={uploading}>
                  {uploading
                    ? "Uploading..."
                    : selectedFiles.length > 0
                    ? `Upload ${selectedFiles.length} Design`
                    : "Upload Designs"}
                </button>
              </form>

              {selectedFiles.length > 0 && (
                <div className="selectedFiles">
                  {selectedFiles.map((file, index) => (
                    <span key={index}>{file.name}</span>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="designListHeader">
                <div>
                  <h3>Design List</h3>
                  <p>
                    {selectedDesigns.length > 0
                      ? `${selectedDesigns.length} selected`
                      : "Select designs for bulk action"}
                  </p>
                </div>

                {designs.length > 0 && (
                  <div className="bulkActions">
                    <button
                      type="button"
                      className="selectAllBtn"
                      onClick={selectAllDesigns}
                    >
                      {selectedDesigns.length === designs.length
                        ? "Clear All"
                        : "Select All"}
                    </button>

                    <button
                      type="button"
                      className="bulkDeleteBtn"
                      onClick={() => setBulkDeleteOpen(true)}
                      disabled={selectedDesigns.length === 0}
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Search design name or category..."
                value={search}
                onChange={handleSearch}
                className="searchInput"
              />

              {designs.length === 0 ? (
                <div className="emptyState">
                  {search
                    ? "No design found for your search."
                    : "No design uploaded yet."}
                </div>
              ) : (
                <div className="designGrid">
                  {designs.map((design) => (
                    <div
                      className={
                        selectedDesigns.includes(design.id)
                          ? "designCard selected"
                          : "designCard"
                      }
                      key={design.id}
                    >
                      <label className="selectDesignBox">
                        <input
                          type="checkbox"
                          checked={selectedDesigns.includes(design.id)}
                          onChange={() => toggleSelectDesign(design.id)}
                        />
                        <span>Select</span>
                      </label>

                      <img
                        src={design.image_url}
                        alt={design.name || "Design"}
                      />

                      <div className="designInfo">
                        <b>{design.name || "Untitled Design"}</b>
                        <span>{design.category?.name}</span>

                        <div className="designActions">
                          <button
                            type="button"
                            className="editBtn"
                            onClick={() => openEditModal(design)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              design.is_featured
                                ? "featuredBtn active"
                                : "featuredBtn"
                            }
                            onClick={() => toggleFeatured(design)}
                          >
                            {design.is_featured ? "★ Featured" : "☆ Feature"}
                          </button>

                          <button
                            type="button"
                            className="deleteBtn"
                            onClick={() => setDeleteTarget(design)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;