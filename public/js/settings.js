// State
let supplements = [];
let editingId = null;
let deleteId = null;
let draggedElement = null;
let selectedColor = '#6c757d';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initializeDarkMode();
  await loadSupplements();
  renderSupplements();
  initializeModals();
  highlightActiveNav();
});

// Dark mode functionality (same as main.js)
function initializeDarkMode() {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    document.body.classList.add('dark-mode');
  }

  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark);
    });
  }
}

// Load supplements from API
async function loadSupplements() {
  try {
    const response = await fetch('/api/supplements');
    if (!response.ok) throw new Error('Failed to fetch supplements');
    supplements = await response.json();
  } catch (error) {
    console.error('Error loading supplements:', error);
    showAlert('Failed to load supplements', 'error');
  }
}

// Render supplements list
function renderSupplements() {
  const list = document.getElementById('supplements-list');
  const emptyState = document.getElementById('empty-state');

  if (supplements.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  list.style.display = 'flex';
  emptyState.style.display = 'none';
  list.innerHTML = '';

  supplements.forEach(supplement => {
    const item = createSupplementItem(supplement);
    list.appendChild(item);
  });
}

// Create supplement list item
function createSupplementItem(supplement) {
  const item = document.createElement('div');
  item.className = 'supplement-item';
  item.draggable = true;
  item.dataset.id = supplement.id;

  // Drag handle
  const dragHandle = document.createElement('div');
  dragHandle.className = 'drag-handle';
  dragHandle.innerHTML = '☰';
  item.appendChild(dragHandle);

  // Color indicator
  const colorIndicator = document.createElement('div');
  colorIndicator.className = 'color-indicator';
  colorIndicator.style.backgroundColor = supplement.button_color || '#6c757d';
  item.appendChild(colorIndicator);

  // Supplement info
  const info = document.createElement('div');
  info.className = 'supplement-info';

  const name = document.createElement('h3');
  name.textContent = supplement.name;
  info.appendChild(name);

  const dosage = document.createElement('p');
  if (supplement.default_dosage) {
    dosage.textContent = `Default: ${supplement.default_dosage}`;
  } else {
    dosage.className = 'no-dosage';
    dosage.textContent = 'No default dosage';
  }
  info.appendChild(dosage);

  item.appendChild(info);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'supplement-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Edit';
  editBtn.onclick = () => openEditModal(supplement);
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn delete';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Delete';
  deleteBtn.onclick = () => openDeleteModal(supplement);
  actions.appendChild(deleteBtn);

  item.appendChild(actions);

  // Add drag event listeners
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragend', handleDragEnd);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);

  return item;
}

// Drag and Drop handlers
function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(this.parentElement, e.clientY);
  if (afterElement == null) {
    this.parentElement.appendChild(draggedElement);
  } else {
    this.parentElement.insertBefore(draggedElement, afterElement);
  }

  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  // Update sort order based on new positions
  updateSortOrder();

  return false;
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.supplement-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update sort order after drag and drop
async function updateSortOrder() {
  const items = document.querySelectorAll('.supplement-item');
  const updates = [];

  items.forEach((item, index) => {
    const id = parseInt(item.dataset.id);
    const supplement = supplements.find(s => s.id === id);
    if (supplement && supplement.sort_order !== index + 1) {
      updates.push({
        id,
        ...supplement,
        sort_order: index + 1
      });
    }
  });

  // Send updates to server
  for (const update of updates) {
    try {
      const response = await fetch(`/api/supplements/${update.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });

      if (!response.ok) throw new Error('Failed to update sort order');
    } catch (error) {
      console.error('Error updating sort order:', error);
      showAlert('Failed to update order', 'error');
    }
  }

  // Reload supplements to reflect new order
  if (updates.length > 0) {
    await loadSupplements();
  }
}

// Initialize modals
function initializeModals() {
  // Add supplement button
  document.getElementById('add-supplement-btn').addEventListener('click', openAddModal);

  // Form submission
  document.getElementById('supplement-form').addEventListener('submit', handleFormSubmit);

  // Color palette selection
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      selectedColor = this.dataset.color;
      document.getElementById('button-color').value = selectedColor;
    });
  });

  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
        closeDeleteModal();
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
    }
  });
}

// Open add modal
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Supplement';
  document.getElementById('supplement-form').reset();
  document.getElementById('supplement-id').value = '';

  // Reset color selection to default
  selectedColor = '#6c757d';
  document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
  document.querySelector('.color-option[data-color="#6c757d"]').classList.add('selected');

  // Hide ID display for new supplements
  document.getElementById('supplement-id-display').style.display = 'none';

  document.getElementById('supplement-modal').classList.add('active');
  setTimeout(() => document.getElementById('name').focus(), 100);
}

// Open edit modal
function openEditModal(supplement) {
  editingId = supplement.id;
  document.getElementById('modal-title').textContent = 'Edit Supplement';
  document.getElementById('supplement-id').value = supplement.id;
  document.getElementById('name').value = supplement.name;
  document.getElementById('default-dosage').value = supplement.default_dosage || '';

  // Set color selection
  selectedColor = supplement.button_color || '#6c757d';
  document.getElementById('button-color').value = selectedColor;
  document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
  const colorBtn = document.querySelector(`.color-option[data-color="${selectedColor}"]`);
  if (colorBtn) colorBtn.classList.add('selected');

  // Show and populate ID display for editing
  document.getElementById('supplement-id-display').style.display = 'block';
  document.getElementById('supplement-id-value').textContent = supplement.id;

  document.getElementById('supplement-modal').classList.add('active');
  setTimeout(() => document.getElementById('name').focus(), 100);
}

// Close supplement modal
function closeModal() {
  document.getElementById('supplement-modal').classList.remove('active');
  editingId = null;
}

// Handle form submit
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value.trim(),
    default_dosage: document.getElementById('default-dosage').value.trim() || null,
    button_color: selectedColor
  };

  if (!formData.name) {
    showAlert('Please enter a supplement name', 'error');
    return;
  }

  try {
    let response;
    if (editingId) {
      // Update existing
      response = await fetch(`/api/supplements/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: supplements.find(s => s.id === editingId).sort_order
        })
      });
    } else {
      // Create new
      response = await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save supplement');
    }

    showAlert(editingId ? 'Supplement updated' : 'Supplement added', 'success');
    closeModal();
    await loadSupplements();
    renderSupplements();
  } catch (error) {
    console.error('Error saving supplement:', error);
    showAlert(error.message, 'error');
  }
}

// Open delete confirmation modal
function openDeleteModal(supplement) {
  deleteId = supplement.id;
  document.getElementById('delete-message').textContent =
    `Are you sure you want to delete "${supplement.name}"? This will also delete all associated logs.`;

  document.getElementById('confirm-delete-btn').onclick = () => confirmDelete();
  document.getElementById('delete-modal').classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('active');
  deleteId = null;
}

// Confirm delete
async function confirmDelete() {
  if (!deleteId) return;

  try {
    const response = await fetch(`/api/supplements/${deleteId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete supplement');
    }

    showAlert('Supplement deleted', 'success');
    closeDeleteModal();
    await loadSupplements();
    renderSupplements();
  } catch (error) {
    console.error('Error deleting supplement:', error);
    showAlert(error.message, 'error');
  }
}

// Show alert message
function showAlert(message, type = 'success') {
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  const main = document.querySelector('main');
  main.insertBefore(alert, main.firstChild);

  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Highlight active nav link
function highlightActiveNav() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}
