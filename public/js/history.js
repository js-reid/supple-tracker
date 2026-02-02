// State
let allLogs = [];
let supplements = [];
let filteredLogs = [];
let editingLogId = null;
let deleteLogId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initializeDarkMode();
  highlightActiveNav();
  await loadSupplements();
  await loadLogs();
  populateSupplementFilter();
  renderLogs();
  initializeFilters();
  initializeModals();
  initializeExport();
});

// Load supplements
async function loadSupplements() {
  try {
    const response = await fetch('/api/supplements');
    if (!response.ok) throw new Error('Failed to fetch supplements');
    supplements = await response.json();
  } catch (error) {
    console.error('Error loading supplements:', error);
  }
}

// Load logs
async function loadLogs() {
  try {
    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('Failed to fetch logs');
    allLogs = await response.json();
    filteredLogs = [...allLogs];
  } catch (error) {
    console.error('Error loading logs:', error);
    showAlert('Failed to load history', 'error');
  }
}

// Populate supplement filter dropdown
function populateSupplementFilter() {
  const select = document.getElementById('supplement-filter');
  select.innerHTML = '<option value="">All Supplements</option>';

  supplements.forEach(supplement => {
    const option = document.createElement('option');
    option.value = supplement.id;
    option.textContent = supplement.name;
    select.appendChild(option);
  });
}

// Render logs
function renderLogs() {
  const list = document.getElementById('logs-list');
  const emptyState = document.getElementById('empty-state');

  if (filteredLogs.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  list.style.display = 'flex';
  emptyState.style.display = 'none';
  list.innerHTML = '';

  filteredLogs.forEach(log => {
    const item = createLogItem(log);
    list.appendChild(item);
  });
}

// Create log item element
function createLogItem(log) {
  const item = document.createElement('div');
  item.className = 'log-item';

  // Get supplement for color
  const supplement = supplements.find(s => s.id === log.supplement_id);
  const color = supplement?.button_color || '#6c757d';

  // Color bar
  const colorBar = document.createElement('div');
  colorBar.className = 'log-color-bar';
  colorBar.style.backgroundColor = color;
  item.appendChild(colorBar);

  // Content
  const content = document.createElement('div');
  content.className = 'log-content';

  // Header (supplement name and time)
  const header = document.createElement('div');
  header.className = 'log-header';

  const supplementName = document.createElement('div');
  supplementName.className = 'log-supplement';
  supplementName.textContent = log.supplement_name;
  header.appendChild(supplementName);

  const time = document.createElement('div');
  time.className = 'log-time';
  time.textContent = formatDateTime(log.taken_at);
  header.appendChild(time);

  content.appendChild(header);

  // Details (dosage and notes)
  const details = document.createElement('div');
  details.className = 'log-details';

  const dosage = document.createElement('div');
  dosage.className = 'log-dosage';
  dosage.textContent = `Dosage: ${log.dosage}`;
  details.appendChild(dosage);

  if (log.notes) {
    const notes = document.createElement('div');
    notes.className = 'log-notes';
    notes.textContent = `Note: ${log.notes}`;
    details.appendChild(notes);
  }

  content.appendChild(details);
  item.appendChild(content);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'log-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Edit';
  editBtn.onclick = () => openEditModal(log);
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn delete';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Delete';
  deleteBtn.onclick = () => openDeleteModal(log);
  actions.appendChild(deleteBtn);

  item.appendChild(actions);

  return item;
}

// Format date and time
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let dayLabel;
  if (dateStr.getTime() === today.getTime()) {
    dayLabel = 'Today';
  } else if (dateStr.getTime() === yesterday.getTime()) {
    dayLabel = 'Yesterday';
  } else {
    dayLabel = date.toLocaleDateString();
  }

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dayLabel} at ${timeStr}`;
}

// Initialize filters
function initializeFilters() {
  const supplementFilter = document.getElementById('supplement-filter');
  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');
  const search = document.getElementById('search');
  const clearBtn = document.getElementById('clear-filters-btn');

  supplementFilter.addEventListener('change', applyFilters);
  dateFrom.addEventListener('change', applyFilters);
  dateTo.addEventListener('change', applyFilters);
  search.addEventListener('input', applyFilters);

  clearBtn.addEventListener('click', () => {
    supplementFilter.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    search.value = '';
    applyFilters();
  });
}

// Apply filters
function applyFilters() {
  const supplementFilter = document.getElementById('supplement-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  const search = document.getElementById('search').value.toLowerCase();

  filteredLogs = allLogs.filter(log => {
    // Filter by supplement
    if (supplementFilter && log.supplement_id !== parseInt(supplementFilter)) {
      return false;
    }

    // Filter by date range
    const logDate = new Date(log.taken_at);
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (logDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }

    // Filter by search
    if (search) {
      const searchableText = `${log.supplement_name} ${log.dosage} ${log.notes || ''}`.toLowerCase();
      if (!searchableText.includes(search)) return false;
    }

    return true;
  });

  renderLogs();
}

// Initialize modals
function initializeModals() {
  // Edit form submission
  document.getElementById('edit-log-form').addEventListener('submit', handleEditSubmit);

  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEditModal();
        closeDeleteModal();
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeDeleteModal();
    }
  });
}

// Open edit modal
function openEditModal(log) {
  editingLogId = log.id;
  const supplement = supplements.find(s => s.id === log.supplement_id);

  document.getElementById('log-id').value = log.id;
  document.getElementById('edit-supplement').value = log.supplement_name;
  document.getElementById('edit-dosage').value = log.dosage;
  document.getElementById('edit-notes').value = log.notes || '';

  // Convert ISO timestamp to local datetime format
  const date = new Date(log.taken_at);
  const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  document.getElementById('edit-taken-at').value = localDateTime;

  document.getElementById('edit-log-modal').classList.add('active');
  setTimeout(() => document.getElementById('edit-dosage').focus(), 100);
}

// Close edit modal
function closeEditModal() {
  document.getElementById('edit-log-modal').classList.remove('active');
  editingLogId = null;
}

// Handle edit form submit
async function handleEditSubmit(e) {
  e.preventDefault();

  const formData = {
    taken_at: new Date(document.getElementById('edit-taken-at').value).toISOString(),
    dosage: document.getElementById('edit-dosage').value.trim(),
    notes: document.getElementById('edit-notes').value.trim() || null
  };

  if (!formData.dosage) {
    showAlert('Please enter a dosage', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/logs/${editingLogId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update log');
    }

    showAlert('Log updated successfully', 'success');
    closeEditModal();
    await loadLogs();
    applyFilters();
  } catch (error) {
    console.error('Error updating log:', error);
    showAlert(error.message, 'error');
  }
}

// Open delete modal
function openDeleteModal(log) {
  deleteLogId = log.id;
  document.getElementById('delete-log-message').textContent =
    `Are you sure you want to delete this ${log.supplement_name} log from ${formatDateTime(log.taken_at)}?`;

  document.getElementById('confirm-delete-log-btn').onclick = confirmDelete;
  document.getElementById('delete-log-modal').classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
  document.getElementById('delete-log-modal').classList.remove('active');
  deleteLogId = null;
}

// Confirm delete
async function confirmDelete() {
  if (!deleteLogId) return;

  try {
    const response = await fetch(`/api/logs/${deleteLogId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete log');
    }

    showAlert('Log deleted', 'success');
    closeDeleteModal();
    await loadLogs();
    applyFilters();
  } catch (error) {
    console.error('Error deleting log:', error);
    showAlert(error.message, 'error');
  }
}

// Initialize export buttons
function initializeExport() {
  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
  document.getElementById('export-json-btn').addEventListener('click', exportJSON);
}

// Export CSV
function exportCSV() {
  window.location.href = '/api/export/csv';
}

// Export JSON
function exportJSON() {
  window.location.href = '/api/export/json';
}

