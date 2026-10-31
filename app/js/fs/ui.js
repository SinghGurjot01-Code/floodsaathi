/* FloodSaathi UI Helpers (Safe DOM, Toast, Modals, Focus Trap, Time Formatting) */
window.FS = window.FS || {};

(function() {
  /**
   * Safe DOM element builder (Never sets innerHTML with raw text).
   * @param {string} tag
   * @param {Object} [props]
   * @param {Array|string|Node} [children]
   * @returns {HTMLElement}
   */
  function el(tag, props, children) {
    const element = document.createElement(tag);
    props = props || {};

    for (const key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
      const val = props[key];
      if (key === 'className' || key === 'class') {
        element.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(element.style, val);
      } else if (key === 'dataset' && typeof val === 'object') {
        for (const dKey in val) {
          element.dataset[dKey] = val[dKey];
        }
      } else if (key.startsWith('on') && typeof val === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'textContent') {
        element.textContent = val;
      } else if (key === 'disabled' || key === 'checked' || key === 'selected') {
        if (val) element.setAttribute(key, '');
        element[key] = Boolean(val);
      } else if (val !== null && val !== undefined) {
        element.setAttribute(key, String(val));
      }
    }

    if (children !== undefined && children !== null) {
      const childArray = Array.isArray(children) ? children : [children];
      for (const child of childArray) {
        if (child === null || child === undefined) continue;
        if (typeof child === 'string' || typeof child === 'number') {
          element.appendChild(document.createTextNode(String(child)));
        } else if ((typeof Node !== 'undefined' && child instanceof Node) || (child && typeof child.nodeType === 'number')) {
          element.appendChild(child);
        }
      }
    }

    return element;
  }

  /**
   * Toast notification system
   * Max 3 toasts, aria-live="polite", never blocks bottom nav
   */
  const MAX_TOASTS = 3;
  function toast(message, options) {
    options = options || {};
    const type = options.type || 'info'; // 'info', 'success', 'error', 'warning'
    const duration = options.duration !== undefined ? options.duration : 3000;
    const action = options.action; // { label: string, onClick: function }

    const container = document.getElementById('toast-container');
    if (!container) return;

    // Prune oldest if max reached
    while (container.children.length >= MAX_TOASTS) {
      container.removeChild(container.firstChild);
    }

    const toastEl = el('div', {
      className: `fs-toast toast-${type}`,
      role: 'status',
      'aria-live': 'polite'
    });

    const msgSpan = el('span', { className: 'toast-msg', textContent: message });
    toastEl.appendChild(msgSpan);

    if (action && action.label && typeof action.onClick === 'function') {
      const actBtn = el('button', {
        className: 'toast-action',
        type: 'button',
        textContent: action.label,
        onClick: (e) => {
          e.stopPropagation();
          action.onClick();
          dismissToast(toastEl);
        }
      });
      toastEl.appendChild(actBtn);
    }

    container.appendChild(toastEl);

    let dismissTimer = null;
    if (duration > 0) {
      dismissTimer = setTimeout(() => {
        dismissToast(toastEl);
      }, duration);
    }

    function dismissToast(target) {
      if (dismissTimer) clearTimeout(dismissTimer);
      target.style.opacity = '0';
      target.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (target.parentNode) {
          target.parentNode.removeChild(target);
        }
      }, 250);
    }
  }

  /**
   * Accessible Modal & Bottom Sheet Dialog
   */
  let lastActiveElement = null;
  let activeModalCleanup = null;

  function openModal(options) {
    options = options || {};
    const title = options.title || '';
    const contentEl = options.contentEl;
    const onClose = options.onClose;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    lastActiveElement = document.activeElement;
    modalContainer.replaceChildren(); // Safe clear

    // Backdrop
    const backdrop = el('div', { className: 'fs-backdrop' });

    // Dialog Shell
    const dialog = el('div', {
      className: 'fs-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': title || 'Dialog'
    });

    // Grab handle
    dialog.appendChild(el('div', { className: 'fs-dialog-grab' }));

    // Header
    const header = el('div', { className: 'fs-dialog-header' });
    const titleEl = el('h2', { className: 'fs-dialog-title', textContent: title });
    const closeBtn = el('button', {
      className: 'fs-dialog-close',
      type: 'button',
      'aria-label': 'Close dialog',
      onClick: closeModal
    }, [
      // SVG close icon
      createSvgClose()
    ]);

    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Content
    if (contentEl instanceof Node) {
      dialog.appendChild(contentEl);
    }

    modalContainer.appendChild(backdrop);
    modalContainer.appendChild(dialog);
    modalContainer.classList.add('active');

    // Lock body scrolling
    document.body.style.overflow = 'hidden';

    // Trap focus inside modal
    const untrap = trapFocus(dialog);

    // Backdrop click dismiss
    backdrop.addEventListener('click', closeModal);

    // Escape key dismiss
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    activeModalCleanup = function() {
      window.removeEventListener('keydown', handleKeyDown);
      untrap();
      document.body.style.overflow = '';
      if (typeof onClose === 'function') onClose();
      if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
        lastActiveElement.focus();
      }
    };

    // Auto-focus first input or close button
    const firstFocusable = dialog.querySelector('input, select, textarea, button:not(.fs-dialog-close)');
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      closeBtn.focus();
    }
  }

  function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer || !modalContainer.classList.contains('active')) return;

    modalContainer.classList.remove('active');
    modalContainer.replaceChildren();

    if (activeModalCleanup) {
      activeModalCleanup();
      activeModalCleanup = null;
    }
  }

  function createSvgClose() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18 6L6 18M6 6l12 12');
    svg.appendChild(path);
    return svg;
  }

  /**
   * Trap keyboard focus inside an element for accessibility (WCAG AA)
   */
  function trapFocus(rootEl) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      const focusables = rootEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    rootEl.addEventListener('keydown', onKey);
    return function untrap() {
      rootEl.removeEventListener('keydown', onKey);
    };
  }

  /**
   * Format relative time string (e.g. "2 hours ago", "5 min ago", "Just now")
   */
  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const diffMs = now - Number(timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay} days ago`;
  }

  window.FS.ui = {
    el: el,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    trapFocus: trapFocus,
    formatTimeAgo: formatTimeAgo
  };
})();
