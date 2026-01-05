# 💊 Supple Tracker

A mobile-first, self-hosted web application for tracking nutritional supplement intake. Inspired by [til.re](https://til.re/), Supple Tracker provides a simple, fast interface for logging your daily supplements with just a few taps.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

### 🏠 Home Page
- **One-click logging**: First time opens modal, subsequent clicks quick-log with last dosage
- **Smart timestamps**: See when you last took each supplement ("2h ago", "Yesterday")
- **Visual organization**: Color-coded left borders for easy identification
- **Last dosage display**: Know exactly what you took last time
- **Edit menu**: Three-dot (⋯) icon for customizing dosage or adding notes

### ⚙️ Settings Page
- **Full CRUD operations**: Create, edit, and delete supplements
- **Drag-and-drop reordering**: Organize supplements in your preferred order
- **Color customization**: Choose from 9 vibrant colors (Gray, Red, Orange, Yellow, Green, Blue, Purple, Pink, Cyan)
- **Default dosages**: Pre-fill common dosages for faster logging
- **Safety confirmations**: Warns before deleting supplements

### 📊 History Page
- **Chronological listing**: All logs sorted newest first
- **Powerful filtering**:
  - Filter by supplement
  - Filter by date range (from/to)
  - Real-time search across all fields
- **Edit/Delete**: Modify or remove past entries
- **Data export**: Download your complete history as CSV or JSON
- **Smart dates**: "Today at 2:30 PM", "Yesterday", or full dates

### 🌓 Dark Mode
- Full dark mode support
- Persists your preference
- Easy toggle in header (☀️/🌙)

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/js-reid/supple-tracker.git
   cd supple-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Seed the database** (optional - adds example supplements)
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in your browser**
   ```
   http://localhost:3000
   ```

The application will create a SQLite database in `./data/supplements.db` on first run.

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## 📱 Usage

### Adding Your First Supplement

1. Navigate to **Settings** (top navigation)
2. Click **+ Add Supplement**
3. Enter:
   - Name (e.g., "Vitamin D3")
   - Default dosage (e.g., "5000 IU") - optional
   - Choose a color
4. Click **Save**

### Logging a Supplement

**First time:**
1. Click the supplement button on the home page
2. Enter the dosage (pre-filled if you set a default)
3. Optionally adjust time or add notes
4. Click **Log It**

**After first log:**
- Simply click the button to quick-log with the same dosage
- Click the ⋯ icon to customize dosage/notes

### Viewing History

1. Navigate to **History**
2. Use filters to find specific logs:
   - Select a supplement from the dropdown
   - Set date range with From/To pickers
   - Type in the search box to find notes
3. Click ✏️ to edit or 🗑️ to delete
4. Export data with **Export CSV** or **Export JSON** buttons

## 🗂️ Project Structure

```
supple-tracker/
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
├── db/
│   ├── init.js           # Database initialization
│   ├── queries.js        # SQL query definitions
│   └── seed.js           # Sample data seeder
├── public/
│   ├── index.html        # Main page
│   ├── history.html      # History page
│   ├── settings.html     # Settings page
│   ├── css/
│   │   └── styles.css    # All styles (light/dark mode)
│   └── js/
│       ├── main.js       # Main page logic
│       ├── history.js    # History page logic
│       └── settings.js   # Settings page logic
└── data/
    └── supplements.db    # SQLite database (created on first run)
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript (no frameworks!)
- **Styling**: CSS3 with CSS variables for theming
- **Design**: Mobile-first responsive design

## 📊 Database Schema

### Supplements Table
```sql
CREATE TABLE supplements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  default_dosage TEXT,
  button_color TEXT DEFAULT '#6c757d',
  sort_order INTEGER DEFAULT 0,
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

## 🌐 API Endpoints

### Supplements
- `GET /api/supplements` - Get all supplements
- `POST /api/supplements` - Create new supplement
- `PUT /api/supplements/:id` - Update supplement
- `DELETE /api/supplements/:id` - Delete supplement
- `GET /api/supplements/last-taken` - Get last taken info for all supplements

### Logs
- `GET /api/logs` - Get all logs
- `POST /api/log` - Create new log entry
- `PUT /api/logs/:id` - Update log entry
- `DELETE /api/logs/:id` - Delete log entry

### Export
- `GET /api/export/csv` - Export logs as CSV
- `GET /api/export/json` - Export logs as JSON

## 🔗 External Integration

The API is fully accessible for external tools like Apple Shortcuts, IFTTT, or home automation systems.

### Logging via Apple Shortcuts

Create a shortcut that makes an HTTP POST request to log supplements:

**Example: Log Vitamin D3 (Full)**
```
POST http://your-server:3000/api/log
Content-Type: application/json

{
  "supplement_id": 1,
  "dosage": "5000 IU",
  "taken_at": "2026-01-05T10:30:00.000Z",
  "notes": "with breakfast"
}
```

**Example: Minimal (Auto-timestamp)**
```
POST http://your-server:3000/api/log
Content-Type: application/json

{
  "supplement_id": 1,
  "dosage": "5000 IU"
}
```
This will automatically use the current timestamp.

**Getting Supplement IDs:**
```
GET http://your-server:3000/api/supplements
```

This returns all supplements with their IDs, which you can use in your shortcuts.

**Use Case: RFID Tags**
1. Stick NFC/RFID tags on supplement bottles
2. Create an Apple Shortcut that POSTs to `/api/log` when scanned
3. Map each tag to a specific supplement_id
4. Scan the bottle to instantly log your supplement!

**Required Fields:**
- `supplement_id` (integer) - ID of the supplement
- `dosage` (string) - Amount taken (e.g., "500mg", "2 pills")
- `taken_at` (ISO 8601 timestamp) - When it was taken

**Optional Fields:**
- `notes` (string) - Any additional notes

## 🎨 Customization

### Changing the Port
Set the `PORT` environment variable:
```bash
PORT=3001 npm start
```

### Adding More Colors
Edit the color palette in `public/settings.html` (line 63):
```html
<button type="button" class="color-option" data-color="#yourcolor"
        style="background-color: #yourcolor;" title="Your Color"></button>
```

### Modifying the Theme
All colors are defined as CSS variables in `public/css/styles.css` (lines 1-41). Adjust the `:root` and `body.dark-mode` sections to customize the color scheme.

## 🐳 Docker Deployment

### Quick Start (Pull from GitHub Container Registry)

**Recommended for most users** - No build required:

1. **Create a directory for your data**
   ```bash
   mkdir -p ~/supple-tracker/data
   cd ~/supple-tracker
   ```

2. **Download the production docker-compose file**
   ```bash
   curl -O https://raw.githubusercontent.com/js-reid/supple-tracker/main/docker-compose.prod.yml
   ```

3. **Pull and start the container**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Access the application**
   ```
   http://localhost:3000
   ```

The SQLite database will be persisted in `./data/supplements.db` via volume mount.

### Build Locally (Development)

If you want to build the image yourself:

1. **Clone the repository**
   ```bash
   git clone https://github.com/js-reid/supple-tracker.git
   cd supple-tracker
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Using Docker Run

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/js-reid/supple-tracker:latest

# Or build locally
docker build -t supple-tracker .

docker run -d \
  --name supple-tracker \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e PORT=3000 \
  --restart unless-stopped \
  ghcr.io/js-reid/supple-tracker:latest
```

### Unraid Deployment

Supple Tracker works great on Unraid! Here's how to set it up:

1. **In Unraid Docker settings**, add a new container with these settings:
   - **Repository**: `ghcr.io/js-reid/supple-tracker:latest`
   - **Network Type**: Bridge
   - **Port Mapping**:
     - Container Port: `3000`
     - Host Port: `3000` (or your preferred port)
   - **Volume Mapping**:
     - Container Path: `/app/data`
     - Host Path: `/mnt/user/appdata/supple-tracker`
   - **Environment Variables** (optional):
     - `PORT=3000`
     - `NODE_ENV=production`

2. **Apply and start** the container

3. **Access via your reverse proxy** or directly at `http://your-unraid-ip:3000`

The app will automatically create the SQLite database on first run.

### Setting Up GitHub Container Registry (For Maintainers)

The included GitHub Actions workflow automatically builds and pushes to ghcr.io when you:
- Push to the `main` branch (creates `latest` tag)
- Create a version tag like `v1.0.0` (creates versioned tags)

**One-time setup:**
1. Push your code to GitHub
2. Go to your repo Settings → Actions → General
3. Under "Workflow permissions", select "Read and write permissions"
4. The workflow will run automatically on your next push

**Making the image public:**
1. Go to https://github.com/js-reid?tab=packages
2. Click on your `supple-tracker` package
3. Click "Package settings"
4. Scroll down and click "Change visibility" → Make public

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [til.re](https://til.re/)
- Built with vanilla JavaScript - no frameworks needed!
- Designed mobile-first for optimal use on phones

## 🗺️ Roadmap

Future enhancements being considered:

- **Multi-user support**: User authentication and individual profiles
- **Reminders**: Notifications for scheduled supplements
- **Analytics**: Charts and insights on supplement consistency
- **PWA**: Progressive Web App for offline support
- **Recurring schedules**: Auto-suggest supplements based on time of day
- **Mobile apps**: Native iOS/Android wrappers

## 📧 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for better health tracking**
