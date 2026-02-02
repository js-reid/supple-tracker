// State
let supplements = [];
let allLogs = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initializeDarkMode();
  highlightActiveNav();
  await loadSupplements();
  await loadLogs();
  renderCalendar();
  calculateStatistics();
  initializeNavigation();
});

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

// Load logs from API
async function loadLogs() {
  try {
    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('Failed to fetch logs');
    allLogs = await response.json();
  } catch (error) {
    console.error('Error loading logs:', error);
    showAlert('Failed to load logs', 'error');
  }
}

// Initialize month navigation
function initializeNavigation() {
  document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
    calculateStatistics();
    closeDayDetail();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
    calculateStatistics();
    closeDayDetail();
  });
}

// Render the calendar grid
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('current-month');

  // Update month title
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // Clear grid
  grid.innerHTML = '';

  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get today's date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  // Get logs for this month
  const monthLogs = getLogsForMonth(currentYear, currentMonth);

  // Add empty cells for days before first of month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    grid.appendChild(emptyDay);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    // Check if this is today
    if (isCurrentMonth && day === today.getDate()) {
      dayElement.classList.add('today');
    }

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // Get logs for this day
    const dayLogs = monthLogs.filter(log => {
      const logDate = new Date(log.taken_at);
      return logDate.getDate() === day;
    });

    // Add indicators for supplements taken
    if (dayLogs.length > 0) {
      dayElement.classList.add('has-logs');
      const indicators = document.createElement('div');
      indicators.className = 'day-indicators';

      // Get unique supplements for this day
      const uniqueSupplements = [...new Set(dayLogs.map(log => log.supplement_id))];

      // Show up to 4 indicators
      const maxIndicators = 4;
      uniqueSupplements.slice(0, maxIndicators).forEach(suppId => {
        const supplement = supplements.find(s => s.id === suppId);
        const dot = document.createElement('div');
        dot.className = 'indicator-dot';
        dot.style.backgroundColor = supplement?.button_color || '#6c757d';
        indicators.appendChild(dot);
      });

      // If more than 4 supplements, show a "more" indicator
      if (uniqueSupplements.length > maxIndicators) {
        const more = document.createElement('div');
        more.className = 'indicator-more';
        more.textContent = `+${uniqueSupplements.length - maxIndicators}`;
        indicators.appendChild(more);
      }

      dayElement.appendChild(indicators);

      // Add click handler to open day detail
      dayElement.addEventListener('click', () => {
        openDayDetail(currentYear, currentMonth, day, dayLogs);
      });
    }

    grid.appendChild(dayElement);
  }
}

// Get logs for a specific month
function getLogsForMonth(year, month) {
  return allLogs.filter(log => {
    const logDate = new Date(log.taken_at);
    return logDate.getFullYear() === year && logDate.getMonth() === month;
  });
}

// Calculate and display statistics
function calculateStatistics() {
  const monthLogs = getLogsForMonth(currentYear, currentMonth);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Total logs
  document.getElementById('stat-total-logs').textContent = monthLogs.length;

  // Unique supplements
  const uniqueSupplements = new Set(monthLogs.map(log => log.supplement_id));
  document.getElementById('stat-unique-supplements').textContent = uniqueSupplements.size;

  // Most logged supplement
  if (monthLogs.length > 0) {
    const supplementCounts = {};
    monthLogs.forEach(log => {
      supplementCounts[log.supplement_id] = (supplementCounts[log.supplement_id] || 0) + 1;
    });
    const mostLoggedId = Object.keys(supplementCounts).reduce((a, b) =>
      supplementCounts[a] > supplementCounts[b] ? a : b
    );
    const mostLoggedSupplement = supplements.find(s => s.id === parseInt(mostLoggedId));
    document.getElementById('stat-most-logged').textContent = mostLoggedSupplement?.name || '-';
  } else {
    document.getElementById('stat-most-logged').textContent = '-';
  }

  // Daily average
  const daysWithLogs = new Set(monthLogs.map(log => new Date(log.taken_at).getDate())).size;
  const dailyAvg = daysWithLogs > 0 ? (monthLogs.length / daysWithLogs).toFixed(1) : '0';
  document.getElementById('stat-daily-average').textContent = dailyAvg;

  // Calculate streaks
  const streaks = calculateStreaks();
  document.getElementById('stat-current-streak').textContent = `${streaks.current} days`;
  document.getElementById('stat-longest-streak').textContent = `${streaks.longest} days`;
}

// Calculate current and longest streaks
function calculateStreaks() {
  if (allLogs.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get unique dates with logs (in YYYY-MM-DD format)
  const datesWithLogs = new Set(
    allLogs.map(log => {
      const d = new Date(log.taken_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  // Sort dates
  const sortedDates = Array.from(datesWithLogs).sort();

  // Calculate longest streak
  let longestStreak = 1;
  let currentStreakLength = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreakLength++;
      longestStreak = Math.max(longestStreak, currentStreakLength);
    } else {
      currentStreakLength = 1;
    }
  }

  // Calculate current streak (from today going backwards)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check if today has logs
  if (datesWithLogs.has(todayStr)) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday has logs (streak might still be "current" if user hasn't logged today yet)
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (datesWithLogs.has(yesterdayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Continue counting backwards
  while (currentStreak > 0) {
    const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (datesWithLogs.has(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak
  };
}

// Open day detail panel
function openDayDetail(year, month, day, logs) {
  const panel = document.getElementById('day-detail-panel');
  const title = document.getElementById('day-detail-title');
  const content = document.getElementById('day-detail-content');

  // Format date
  const date = new Date(year, month, day);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  title.textContent = date.toLocaleDateString(undefined, options);

  // Sort logs by time
  const sortedLogs = [...logs].sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at));

  // Build content
  content.innerHTML = '';

  if (sortedLogs.length === 0) {
    content.innerHTML = '<p class="no-logs">No logs for this day.</p>';
  } else {
    sortedLogs.forEach(log => {
      const supplement = supplements.find(s => s.id === log.supplement_id);
      const color = supplement?.button_color || '#6c757d';
      const time = new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const logItem = document.createElement('div');
      logItem.className = 'day-log-item';
      logItem.innerHTML = `
        <div class="day-log-color" style="background-color: ${color};"></div>
        <div class="day-log-content">
          <div class="day-log-header">
            <span class="day-log-name">${log.supplement_name}</span>
            <span class="day-log-time">${time}</span>
          </div>
          <div class="day-log-dosage">Dosage: ${log.dosage}</div>
          ${log.notes ? `<div class="day-log-notes">${log.notes}</div>` : ''}
        </div>
      `;
      content.appendChild(logItem);
    });
  }

  // Show panel
  panel.style.display = 'block';

  // Highlight selected day
  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
  const dayIndex = day + new Date(year, month, 1).getDay() - 1;
  const dayElements = document.querySelectorAll('.calendar-day:not(.empty)');
  if (dayElements[day - 1]) {
    dayElements[day - 1].classList.add('selected');
  }
}

// Close day detail panel
function closeDayDetail() {
  document.getElementById('day-detail-panel').style.display = 'none';
  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
}
