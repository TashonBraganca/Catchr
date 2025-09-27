/**
 * CATHCR Content Script
 * Injects capture modal and handles page interactions
 */

import browser from 'webextension-polyfill';
import type { ExtensionMessage } from '../types';

class CathcrContent {
  private modal: HTMLElement | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set global flag for background script
      (window as any).CATHCR_INITIALIZED = true;

      // Listen for messages from background script
      browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

      // Listen for keyboard shortcuts
      document.addEventListener('keydown', this.handleKeydown.bind(this));

      this.isInitialized = true;
      console.log('🎯 CATHCR content script initialized');

    } catch (error) {
      console.error('❌ Failed to initialize content script:', error);
    }
  }

  private async handleMessage(message: ExtensionMessage): Promise<void> {
    switch (message.type) {
      case 'OPEN_CAPTURE_MODAL':
        await this.openCaptureModal(message.payload);
        break;

      case 'CLOSE_CAPTURE_MODAL':
        this.closeCaptureModal();
        break;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Handle Escape key to close modal
    if (event.key === 'Escape' && this.modal) {
      this.closeCaptureModal();
    }
  }

  private async openCaptureModal(context?: any): Promise<void> {
    if (this.modal) {
      this.closeCaptureModal();
    }

    // Create modal overlay
    this.modal = this.createModalElement(context);
    document.body.appendChild(this.modal);

    // Focus the textarea
    const textarea = this.modal.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }

    // Animate in
    requestAnimationFrame(() => {
      this.modal?.classList.add('cathcr-modal-visible');
    });
  }

  private closeCaptureModal(): void {
    if (!this.modal) return;

    this.modal.classList.remove('cathcr-modal-visible');

    setTimeout(() => {
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
    }, 200);
  }

  private createModalElement(context?: any): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'cathcr-modal-overlay';

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

    // Add event listeners
    this.addModalEventListeners(overlay, context);

    return overlay;
  }

  private addModalEventListeners(overlay: HTMLElement, context?: any): void {
    const form = overlay.querySelector('.cathcr-modal-form') as HTMLFormElement;
    const textarea = overlay.querySelector('.cathcr-modal-textarea') as HTMLTextAreaElement;
    const closeBtn = overlay.querySelector('.cathcr-modal-close') as HTMLButtonElement;
    const cancelBtn = overlay.querySelector('[data-action="cancel"]') as HTMLButtonElement;

    // Close handlers
    closeBtn?.addEventListener('click', () => this.closeCaptureModal());
    cancelBtn?.addEventListener('click', () => this.closeCaptureModal());

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeCaptureModal();
      }
    });

    // Form submission
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const text = textarea.value.trim();
      if (!text) return;

      try {
        // Send to background script
        await browser.runtime.sendMessage({
          type: 'CAPTURE_THOUGHT',
          payload: {
            text,
            context: {
              url: window.location.href,
              title: document.title,
              favicon: this.getFavicon(),
              ...context,
            },
            source: 'content-script',
            timestamp: Date.now(),
          },
        });

        this.closeCaptureModal();
        this.showSuccessToast();

      } catch (error) {
        console.error('Failed to capture thought:', error);
        this.showErrorToast();
      }
    });

    // Keyboard shortcuts
    textarea?.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        form?.dispatchEvent(new Event('submit'));
      }
    });
  }

  private getFavicon(): string {
    const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
    return favicon?.href || `${window.location.origin}/favicon.ico`;
  }

  private showSuccessToast(): void {
    this.showToast('✅ Thought captured successfully!', 'success');
  }

  private showErrorToast(): void {
    this.showToast('❌ Failed to capture thought. Please try again.', 'error');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const toast = document.createElement('div');
    toast.className = `cathcr-toast cathcr-toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('cathcr-toast-visible');
    });

    setTimeout(() => {
      toast.classList.remove('cathcr-toast-visible');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }
}

// Initialize content script
new CathcrContent();