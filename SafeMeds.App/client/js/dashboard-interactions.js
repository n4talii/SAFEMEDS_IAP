(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const readStored = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };
  const writeStored = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast('Could not save this setting in this browser.');
      return false;
    }
  };
  let toastTimer;
  function showToast(message) {
    const toast = $('#dashboard-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }
  window.showDashboardToast = showToast;

  function filterInventory() {
    const field = $('#inventory-filter');
    const container = $('#inventory-rows-container');
    if (!field || !container) return;
    const query = field.value.trim().toLowerCase();
    const rows = $$('.table-row', container);
    let visibleCount = 0;
    rows.forEach((row) => {
      const visible = row.textContent.toLowerCase().includes(query);
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    let emptyMessage = $('#inventory-filter-empty');
    if (!emptyMessage) {
      emptyMessage = document.createElement('p');
      emptyMessage.id = 'inventory-filter-empty';
      emptyMessage.className = 'empty-state';
      emptyMessage.textContent = 'No inventory items match that filter.';
      container.after(emptyMessage);
    }
    emptyMessage.hidden = !query || visibleCount > 0 || rows.length === 0;
    const headerCheckbox = $(".table-header .metric-checkbox");
    const visibleCheckboxes = $$("#inventory-rows-container .table-row:not([hidden]) .metric-checkbox");
    const selectedCount = visibleCheckboxes.filter((checkbox) => checkbox.checked).length;
    if (headerCheckbox) {
      headerCheckbox.checked = visibleCheckboxes.length > 0 && selectedCount === visibleCheckboxes.length;
      headerCheckbox.indeterminate = selectedCount > 0 && selectedCount < visibleCheckboxes.length;
    }
  }

  const orderModal = $('#order-modal');
  const orderForm = $('#order-form');
  function openOrder(itemId) {
    const item = currentInventory.find((record) => String(record.id) === String(itemId));
    if (!item || !orderModal) return;
    $('#order-item-id').value = item.id;
    $('#order-item-name').value = item.item_name;
    $('#order-quantity').value = Math.max(1, Number(item.reorder_point || 0) - Number(item.current_stock || 0));
    orderModal.showModal();
  }

  function addNotification(id, text, type) {
    const list = $('#notifications-list');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.dataset.notificationId = id;
    item.dataset.notificationType = type;
    const iconWrap = document.createElement('div');
    iconWrap.className = 'notif-icon-wrapper';
    const icon = document.createElement('i');
    icon.className = type === 'stock' ? 'fa-solid fa-triangle-exclamation warning-icon' : 'fa-regular fa-bell normal-bell';
    iconWrap.appendChild(icon);
    const message = document.createElement('span');
    message.className = 'notif-text';
    message.textContent = text;
    item.append(iconWrap, message);
    list.prepend(item);
    applyNotificationPreferences();
    applyReadNotifications();
  }

  function applyReadNotifications() {
    const readIds = new Set(readStored('safemedsReadNotifications', []));
    $$('.notif-item').forEach((item) => {
      const isRead = readIds.has(item.dataset.notificationId);
      item.classList.toggle('is-read', isRead);
      item.classList.toggle('active-highlight', !isRead && item.dataset.notificationType === 'stock');
    });
    const hasUnread = $$('.notif-item').some((item) => !item.classList.contains('is-read') && !item.hidden);
    const dot = $('.red-badge-dot');
    if (dot) dot.hidden = !hasUnread;
  }

  function applyNotificationPreferences() {
    const prefs = readStored('safemedsDashboardPrefs', { stock: true, order: true });
    $$('.notif-item').forEach((item) => {
      const type = item.dataset.notificationType;
      item.hidden = type === 'stock' ? prefs.stock === false : type === 'order' ? prefs.order === false : false;
    });
    applyReadNotifications();
  }

  function markNotificationRead(item) {
    const id = item.dataset.notificationId;
    if (!id) return;
    const ids = new Set(readStored('safemedsReadNotifications', []));
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    writeStored('safemedsReadNotifications', [...ids]);
    applyReadNotifications();
  }

  function loadSavedOrders() {
    const orders = readStored('safemedsDemoOrders', []);
    orders.slice(-10).reverse().forEach((order) => {
      addNotification(`demo-order-${order.id}`, `Demo order request: ${order.name} × ${order.quantity}`, 'order');
    });
  }

  function renderStaff() {
    const list = $('#staff-list');
    if (!list) return;
    const members = readStored('safemedsDemoStaff', []);
    list.replaceChildren();
    if (!members.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No staff members added yet.';
      list.appendChild(empty);
      return;
    }
    members.forEach((member) => {
      const row = document.createElement('div');
      row.className = 'dashboard-list-row';
      const label = document.createElement('span');
      label.textContent = `${member.name} · ${member.role}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.dataset.removeStaff = member.id;
      row.append(label, remove);
      list.appendChild(row);
    });
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog?.showModal) dialog.showModal();
    if (id === 'staff-modal') renderStaff();
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#apply-inventory-filter')?.addEventListener('click', filterInventory);
    document.addEventListener('inventory:loaded', filterInventory);
    $('#inventory-filter')?.addEventListener('input', filterInventory);
    $('#inventory-filter')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        filterInventory();
      }
    });

    document.addEventListener('click', (event) => {
      const settingsMenu = $('#settings-menu');
      const settingsButton = $('.settings-menu-toggle');
      if (settingsMenu && !settingsMenu.hidden && !event.target.closest('.top-header-profile-bar')) {
        settingsMenu.hidden = true;
        settingsButton?.setAttribute('aria-expanded', 'false');
      }
      const settingsToggle = event.target.closest('.settings-menu-toggle');
      if (settingsToggle) {
        event.preventDefault();
        const menu = $('#settings-menu');
        if (menu) {
          menu.hidden = !menu.hidden;
          settingsToggle.setAttribute('aria-expanded', String(!menu.hidden));
        }
        return;
      }
      if (event.target.closest('[data-close-settings-menu]')) {
        $('#settings-menu').hidden = true;
        settingsButton?.setAttribute('aria-expanded', 'false');
        settingsButton?.focus();
        return;
      }      const orderButton = event.target.closest('.order-btn');
      if (orderButton) {
        event.preventDefault();
        openOrder(orderButton.dataset.id);
        return;
      }
      const dialogTrigger = event.target.closest('.dashboard-dialog-trigger');
      if (dialogTrigger) {
        openDialog(dialogTrigger.dataset.dialog);
        return;
      }
      if (event.target.matches('[data-close-dialog]')) {
        event.target.closest('dialog')?.close();
        return;
      }
      if (event.target.matches('#cancel-order-btn')) {
        orderModal?.close();
        return;
      }
      if (event.target.matches('[data-remove-staff]')) {
        const removeId = event.target.dataset.removeStaff;
        writeStored('safemedsDemoStaff', readStored('safemedsDemoStaff', []).filter((member) => member.id !== removeId));
        renderStaff();
        showToast('Staff member removed.');
        return;
      }
      const notificationToggle = event.target.closest('[data-toggle-notifications]');
      if (notificationToggle) {
        const list = $('#notifications-list');
        const collapsed = list?.classList.toggle('is-collapsed');
        $$('[data-toggle-notifications]').forEach((button) => {
          button.setAttribute('aria-expanded', String(!collapsed));
          button.setAttribute('aria-label', collapsed ? 'Show notifications' : 'Hide notifications');
        });
        return;
      }
      const notification = event.target.closest('.notif-item');
      if (notification) markNotificationRead(notification);
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('.table-header .metric-checkbox')) {
        $$('#inventory-rows-container .metric-checkbox').forEach((checkbox) => {
          const row = checkbox.closest('.table-row');
          if (row && !row.hidden) checkbox.checked = event.target.checked;
        });
        event.target.indeterminate = false;
      } else if (event.target.matches('#inventory-rows-container .metric-checkbox')) {
        const headerCheckbox = $('.table-header .metric-checkbox');
        const visibleCheckboxes = $$('#inventory-rows-container .table-row:not([hidden]) .metric-checkbox');
        const selectedCount = visibleCheckboxes.filter((checkbox) => checkbox.checked).length;
        if (headerCheckbox) {
          headerCheckbox.checked = visibleCheckboxes.length > 0 && selectedCount === visibleCheckboxes.length;
          headerCheckbox.indeterminate = selectedCount > 0 && selectedCount < visibleCheckboxes.length;
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !$('#settings-menu')?.hidden) {
        $('#settings-menu').hidden = true;
        $('.settings-menu-toggle')?.setAttribute('aria-expanded', 'false');
      }
      const notification = event.target.closest?.('.notif-item');
      if (notification && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        markNotificationRead(notification);
      }
    });

    $('#order-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const itemId = $('#order-item-id').value;
      const item = currentInventory.find((record) => String(record.id) === String(itemId));
      const quantity = Number($('#order-quantity').value);
      if (!item || !Number.isInteger(quantity) || quantity < 1) {
        showToast('Choose a valid order quantity.');
        return;
      }
      const orders = readStored('safemedsDemoOrders', []);
      const order = { id: `${Date.now()}`, itemId: item.id, name: item.item_name, quantity, createdAt: new Date().toISOString() };
      orders.push(order);
      if (writeStored('safemedsDemoOrders', orders)) {
        addNotification(`demo-order-${order.id}`, `Demo order request: ${order.name} × ${order.quantity}`, 'order');
        orderModal.close();
        showToast('Demo order saved in this browser; no supplier was contacted.');
      }
    });

    $('#staff-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = $('#staff-name').value.trim();
      const role = $('#staff-role').value.trim();
      if (!name || !role) return;
      const members = readStored('safemedsDemoStaff', []);
      members.push({ id: `${Date.now()}`, name, role });
      if (writeStored('safemedsDemoStaff', members)) {
        $('#staff-form').reset();
        renderStaff();
        showToast('Staff member saved in this browser.');
      }
    });

    const prefs = readStored('safemedsDashboardPrefs', { stock: true, order: true });
    $('#show-stock-notifications').checked = prefs.stock !== false;
    $('#show-order-notifications').checked = prefs.order !== false;
    $('#settings-form')?.addEventListener('change', () => {
      writeStored('safemedsDashboardPrefs', {
        stock: $('#show-stock-notifications').checked,
        order: $('#show-order-notifications').checked,
      });
      applyNotificationPreferences();
      showToast('Notification preferences saved.');
    });

    $$('.notif-item').forEach((item) => {
      item.setAttribute('aria-label', `${item.textContent.trim()}. Activate to mark ${item.classList.contains('is-read') ? 'unread' : 'read'}.`);
    });
    loadSavedOrders();
    applyNotificationPreferences();
    applyReadNotifications();
  });
})();
