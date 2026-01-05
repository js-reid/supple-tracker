// State
let supplements = [];
let lastTaken = {}; // { supplement_id: { last_taken, last_dosage } }
let currentSupplement = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initializeDarkMode();
  await loadSupplements();
  await loadLastTaken();
  renderSupplements();
  initializeForm();
});

// Dark mode functionality
function initializeDarkMode() {
  // Check for saved preference or default to light mode
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    document.body.classList.add('dark-mode');
  }

  // Add click handler to toggle button
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

// Load last taken timestamps and dosages
async function loadLastTaken() {
  try {
    const response = await fetch('/api/supplements/last-taken');
    if (!response.ok) throw new Error('Failed to fetch last taken timestamps');
    const data = await response.json();

    // Convert array to object for easy lookup
    lastTaken = {};
    data.forEach(item => {
      lastTaken[item.supplement_id] = {
        last_taken: item.last_taken,
        last_dosage: item.last_dosage
      };
    });
  } catch (error) {
    console.error('Error loading last taken:', error);
  }
}

// Render supplement buttons
function renderSupplements() {
  const grid = document.getElementById('supplements-grid');
  const emptyState = document.getElementById('empty-state');

  if (supplements.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  grid.innerHTML = '';

  supplements.forEach(supplement => {
    const button = createSupplementButton(supplement);
    grid.appendChild(button);
  });
}

// Create supplement button element
function createSupplementButton(supplement) {
  const container = document.createElement('div');
  container.className = 'supplement-btn';

  // Apply button color as left border accent
  if (supplement.button_color) {
    container.style.borderLeft = `4px solid ${supplement.button_color}`;
  }

  const lastInfo = lastTaken[supplement.id];
  const hasBeenLogged = lastInfo && lastInfo.last_taken;

  // Main button area (for quick logging)
  const mainArea = document.createElement('div');
  mainArea.style.cursor = 'pointer';
  mainArea.onclick = (e) => {
    // Don't trigger if clicking the edit button
    if (e.target.closest('.edit-btn')) return;

    if (hasBeenLogged) {
      quickLogSupplement(supplement, container);
    } else {
      openLogModal(supplement);
    }
  };

  // Supplement name
  const name = document.createElement('div');
  name.className = 'supplement-name';
  name.textContent = supplement.name;
  mainArea.appendChild(name);

  // Last dosage
  const dosageDiv = document.createElement('div');
  if (hasBeenLogged && lastInfo.last_dosage) {
    dosageDiv.className = 'last-dosage';
    dosageDiv.textContent = lastInfo.last_dosage;
  } else {
    dosageDiv.className = 'last-dosage none';
    dosageDiv.textContent = 'Not yet logged';
  }
  mainArea.appendChild(dosageDiv);

  container.appendChild(mainArea);

  // Last taken timestamp
  const lastTakenDiv = document.createElement('div');
  if (hasBeenLogged) {
    lastTakenDiv.className = 'last-taken';
    lastTakenDiv.textContent = `Last: ${formatTimeAgo(lastInfo.last_taken)}`;
  } else {
    lastTakenDiv.className = 'last-taken never';
    lastTakenDiv.textContent = 'Never logged';
  }
  container.appendChild(lastTakenDiv);

  // Edit button (three dots)
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.innerHTML = '&ctdot;';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    openLogModal(supplement);
  };
  container.appendChild(editBtn);

  return container;
}

// Quick log supplement with last dosage
async function quickLogSupplement(supplement, buttonElement) {
  const lastInfo = lastTaken[supplement.id];

  if (!lastInfo || !lastInfo.last_dosage) {
    // Fallback to modal if no last dosage
    openLogModal(supplement);
    return;
  }

  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supplement_id: supplement.id,
        dosage: lastInfo.last_dosage,
        taken_at: new Date().toISOString(),
        notes: null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log supplement');
    }

    // Success! Show visual feedback
    buttonElement.classList.add('logged');
    setTimeout(() => {
      buttonElement.classList.remove('logged');
    }, 500);

    showAlert(`${supplement.name} logged (${lastInfo.last_dosage})`, 'success');

    // Reload last taken timestamps and re-render
    await loadLastTaken();
    renderSupplements();
  } catch (error) {
    console.error('Error quick-logging supplement:', error);
    showAlert(error.message, 'error');
  }
}

// Format time ago (e.g., "2 hours ago")
function formatTimeAgo(timestamp) {
  const now = new Date();
  const taken = new Date(timestamp);
  const diffMs = now - taken;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older dates, show actual date
  return taken.toLocaleDateString();
}

// Open log modal
function openLogModal(supplement) {
  currentSupplement = supplement;

  const modal = document.getElementById('log-modal');
  const modalTitle = document.getElementById('modal-title');
  const supplementIdInput = document.getElementById('supplement-id');
  const dosageInput = document.getElementById('dosage');
  const takenAtInput = document.getElementById('taken-at');
  const notesInput = document.getElementById('notes');

  // Set modal title
  modalTitle.textContent = `Log ${supplement.name}`;

  // Set supplement ID
  supplementIdInput.value = supplement.id;

  // Pre-fill dosage - prefer last dosage over default
  const lastInfo = lastTaken[supplement.id];
  if (lastInfo && lastInfo.last_dosage) {
    dosageInput.value = lastInfo.last_dosage;
  } else if (supplement.default_dosage) {
    dosageInput.value = supplement.default_dosage;
  } else {
    dosageInput.value = '';
  }

  // Set current time as default
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  takenAtInput.value = localDateTime;

  // Clear notes
  notesInput.value = '';

  // Show modal
  modal.classList.add('active');

  // Focus on dosage input
  setTimeout(() => dosageInput.focus(), 100);
}

// Close modal
function closeModal() {
  const modal = document.getElementById('log-modal');
  modal.classList.remove('active');
  currentSupplement = null;
}

// Initialize form submission
function initializeForm() {
  const form = document.getElementById('log-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      supplement_id: parseInt(document.getElementById('supplement-id').value),
      dosage: document.getElementById('dosage').value.trim(),
      taken_at: document.getElementById('taken-at').value,
      notes: document.getElementById('notes').value.trim() || null
    };

    // Validate
    if (!formData.dosage) {
      showAlert('Please enter a dosage', 'error');
      return;
    }

    // Convert local datetime to ISO string
    if (formData.taken_at) {
      formData.taken_at = new Date(formData.taken_at).toISOString();
    }

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log supplement');
      }

      // Success!
      showAlert('Supplement logged successfully', 'success');
      closeModal();

      // Reload last taken timestamps and re-render
      await loadLastTaken();
      renderSupplements();
    } catch (error) {
      console.error('Error logging supplement:', error);
      showAlert(error.message, 'error');
    }
  });

  // Close modal when clicking outside
  const modal = document.getElementById('log-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Show alert message
function showAlert(message, type = 'success') {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  // Create new alert
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  // Insert at top of main
  const main = document.querySelector('main');
  main.insertBefore(alert, main.firstChild);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Highlight active nav link
const currentPath = window.location.pathname;
document.querySelectorAll('nav a').forEach(link => {
  if (link.getAttribute('href') === currentPath) {
    link.classList.add('active');
  }
});
