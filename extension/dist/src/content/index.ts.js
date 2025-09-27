import __vite__cjsImport0_webextensionPolyfill from "/vendor/.vite-deps-webextension-polyfill.js__v--06f18e5c.js"; const browser = __vite__cjsImport0_webextensionPolyfill.__esModule ? __vite__cjsImport0_webextensionPolyfill.default : __vite__cjsImport0_webextensionPolyfill;
class CathcrContent {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
    this.initialize();
  }
  async initialize() {
    if (this.isInitialized) return;
    try {
      window.CATHCR_INITIALIZED = true;
      browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
      document.addEventListener("keydown", this.handleKeydown.bind(this));
      this.isInitialized = true;
      console.log("🎯 CATHCR content script initialized");
    } catch (error) {
      console.error("❌ Failed to initialize content script:", error);
    }
  }
  async handleMessage(message) {
    switch (message.type) {
      case "OPEN_CAPTURE_MODAL":
        await this.openCaptureModal(message.payload);
        break;
      case "CLOSE_CAPTURE_MODAL":
        this.closeCaptureModal();
        break;
    }
  }
  handleKeydown(event) {
    if (event.key === "Escape" && this.modal) {
      this.closeCaptureModal();
    }
  }
  async openCaptureModal(context) {
    if (this.modal) {
      this.closeCaptureModal();
    }
    this.modal = this.createModalElement(context);
    document.body.appendChild(this.modal);
    const textarea = this.modal.querySelector("textarea");
    if (textarea) {
      textarea.focus();
    }
    requestAnimationFrame(() => {
      this.modal?.classList.add("cathcr-modal-visible");
    });
  }
  closeCaptureModal() {
    if (!this.modal) return;
    this.modal.classList.remove("cathcr-modal-visible");
    setTimeout(() => {
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
    }, 200);
  }
  createModalElement(context) {
    const overlay = document.createElement("div");
    overlay.className = "cathcr-modal-overlay";
    overlay.innerHTML = `
      <div class="cathcr-modal">
        <div class="cathcr-modal-header">
          <h3>💭 Capture Your Thought</h3>
          <button class="cathcr-modal-close" aria-label="Close">×</button>
        </div>

        <form class="cathcr-modal-form">
          <textarea
            placeholder="What's on your mind?"
            rows="4"
            class="cathcr-modal-textarea"
            required
          ></textarea>

          <div class="cathcr-modal-context">
            📍 ${context?.title || document.title}
          </div>

          <div class="cathcr-modal-actions">
            <button type="button" class="cathcr-btn cathcr-btn-secondary" data-action="cancel">
              Cancel
            </button>
            <button type="submit" class="cathcr-btn cathcr-btn-primary">
              💾 Capture
            </button>
          </div>
        </form>
      </div>
    `;
    this.addModalEventListeners(overlay, context);
    return overlay;
  }
  addModalEventListeners(overlay, context) {
    const form = overlay.querySelector(".cathcr-modal-form");
    const textarea = overlay.querySelector(".cathcr-modal-textarea");
    const closeBtn = overlay.querySelector(".cathcr-modal-close");
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    closeBtn?.addEventListener("click", () => this.closeCaptureModal());
    cancelBtn?.addEventListener("click", () => this.closeCaptureModal());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.closeCaptureModal();
      }
    });
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;
      try {
        await browser.runtime.sendMessage({
          type: "CAPTURE_THOUGHT",
          payload: {
            text,
            context: {
              url: window.location.href,
              title: document.title,
              favicon: this.getFavicon(),
              ...context
            },
            source: "content-script",
            timestamp: Date.now()
          }
        });
        this.closeCaptureModal();
        this.showSuccessToast();
      } catch (error) {
        console.error("Failed to capture thought:", error);
        this.showErrorToast();
      }
    });
    textarea?.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        form?.dispatchEvent(new Event("submit"));
      }
    });
  }
  getFavicon() {
    const favicon = document.querySelector('link[rel*="icon"]');
    return favicon?.href || `${window.location.origin}/favicon.ico`;
  }
  showSuccessToast() {
    this.showToast("✅ Thought captured successfully!", "success");
  }
  showErrorToast() {
    this.showToast("❌ Failed to capture thought. Please try again.", "error");
  }
  showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `cathcr-toast cathcr-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("cathcr-toast-visible");
    });
    setTimeout(() => {
      toast.classList.remove("cathcr-toast-visible");
      setTimeout(() => toast.remove(), 200);
    }, 3e3);
  }
}
new CathcrContent();
