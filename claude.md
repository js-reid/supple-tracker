# Supple Tracker - Supplement Intake Tracking Application

## Project Overview
A mobile-first, self-hosted web application for tracking nutritional supplement intake. Single-screen interface inspired by til.re, containerized with Docker, storing data in SQLite.

## Core Requirements

### Technical Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: SQLite
- **Containerization**: Docker
- **Target**: Mobile-first responsive design, browser-accessible

### User Mode
- Single user application
- No authentication required
- Anyone with access to the URL can log supplements

## Features

### Main Screen (Primary Interface)
- **Layout**: Single-screen, mobile-first design
- **Supplement Buttons**: Grid/list of configurable buttons for quick logging
- **Last Taken Display**: Show timestamp of when each supplement was last logged
- **Minimal UI**: Clean, simple interface focused on quick logging

### Logging Supplements
When a supplement button is clicked, capture:
- Supplement name (from button configuration)
- Timestamp (default: now)
- Dosage amount (required field)
- Optional notes field (e.g., "with food", "felt nauseous")
- Time editing capability (for retroactive logging)

**UI Flow**: Click button → Quick modal/form → Enter dosage → Optional: adjust time, add notes → Submit

### Settings Page
- Add new supplement buttons
- Edit existing supplements (name, default dosage, button order/color)
- Delete supplements
- Reorder button layout
- All supplement definitions stored in SQLite

### History Page
- Simple chronological list of all logged entries
- Display: supplement name, timestamp, dosage, notes
- Edit past entries (modify dosage, time, notes)
- Delete incorrect logs
- Export functionality:
  - CSV export
  - JSON export

## Data Model

### Supplements Table
```sql
CREATE TABLE supplements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    default_dosage TEXT,
    button_color TEXT,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Logs Table
```sql
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplement_id INTEGER NOT NULL,
    taken_at TIMESTAMP NOT NULL,
    dosage TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplement_id) REFERENCES supplements(id) ON DELETE CASCADE
);
```

## Application Structure

### Routes
- `GET /` - Main screen with supplement buttons
- `GET /history` - Historical logs page
- `GET /settings` - Supplement configuration page
- `POST /api/log` - Log a supplement intake
- `GET /api/logs` - Retrieve logs (with optional filtering)
- `PUT /api/logs/:id` - Update a log entry
- `DELETE /api/logs/:id` - Delete a log entry
- `GET /api/supplements` - Get all supplements
- `POST /api/supplements` - Create new supplement
- `PUT /api/supplements/:id` - Update supplement
- `DELETE /api/supplements/:id` - Delete supplement
- `GET /api/export/csv` - Export logs as CSV
- `GET /api/export/json` - Export logs as JSON

### File Structure
```
supple-tracker/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── db/
│   ├── init.js          # Database initialization
│   └── queries.js       # SQL queries
├── public/
│   ├── index.html       # Main screen
│   ├── history.html     # History page
│   ├── settings.html    # Settings page
│   ├── css/
│   │   └── styles.css   # Mobile-first styles
│   └── js/
│       ├── main.js      # Main screen logic
│       ├── history.js   # History page logic
│       └── settings.js  # Settings page logic
└── data/
    └── supplements.db   # SQLite database (volume mount)
```

## Docker Configuration

### Key Requirements
- Self-contained container
- SQLite database persisted via volume
- Expose web server on configurable port (default: 3000)
- Minimal base image (node:alpine or similar)

### Volume Mounts
- `./data:/app/data` - Persist SQLite database

## UI/UX Guidelines

### Mobile-First Design
- Touch-friendly button sizes (minimum 44x44px)
- Responsive grid layout for supplement buttons
- Optimized for portrait orientation
- Progressive enhancement for desktop

### Visual Design
- Clean, minimal interface
- High contrast for readability
- Clear visual feedback on interactions
- Fast load times (no heavy frameworks)

### Accessibility
- Semantic HTML
- Keyboard navigation support
- ARIA labels where appropriate
- Clear error messages

## Development Phases

### Phase 1: Core Functionality
1. Set up Node.js + Express server
2. Initialize SQLite database with schema
3. Create main screen with static buttons
4. Implement basic logging (POST /api/log)
5. Display last taken timestamps

### Phase 2: Configuration
1. Build settings page UI
2. Implement supplement CRUD operations
3. Dynamic button rendering from database
4. Button customization (colors, order)

### Phase 3: History & Data Management
1. Create history page with chronological list
2. Implement edit/delete functionality
3. Add CSV/JSON export endpoints
4. Build export UI

### Phase 4: Polish & Docker
1. Responsive CSS refinements
2. Error handling and validation
3. Dockerfile and docker-compose.yml
4. Documentation (README, setup instructions)

## Future Enhancements (Out of Scope for v1)
- Multi-user support with authentication
- Reminders/notifications
- Analytics and charts
- Mobile app wrapper (PWA)
- Recurring supplement schedules
- Integration with health apps

## Success Criteria
- Application runs in Docker container
- Main screen loads and displays supplement buttons
- One-click logging with dosage input
- Settings page allows full supplement management
- History page shows all logs with edit/delete
- Data exports to CSV/JSON
- Mobile-responsive on phones (375px width minimum)
- Works in modern browsers (Chrome, Firefox, Safari)
