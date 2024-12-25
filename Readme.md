
# Advanced Screenshot Extension

A powerful Chrome extension for capturing screenshots with advanced features including full-page capture, region selection, and image editing capabilities.

## Features

- **Multiple Capture Modes:**
    - Visible Area Capture
    - Region Selection
    - Full Page Scrolling Capture
    - Delayed Capture (3-second countdown)

- **Advanced Editing Tools:**
    - Drawing/Annotation
    - Text Addition
    - Arrow Marking
    - Rectangle Drawing
    - Highlighting
    - Blur Effect
    - Emoji Placement
    - Size and Color Controls

- **Post-Capture Actions:**
    - Copy to Clipboard
    - Save to Disk
    - Share Functionality
    - Undo Support
    - Filter Application

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Required Permissions

```json
{
  "permissions": [
    "downloads",
    "activeTab",
    "scripting",
    "tabs"
  ]
}
```

## Usage

### Basic Capture

1. Click the extension icon in your Chrome toolbar
2. Select your desired capture mode:
    - **Visible**: Captures currently visible area
    - **Region**: Allows selecting a specific area
    - **Full Page**: Captures entire scrollable page
    - **Delayed**: Takes screenshot after 3-second countdown

### Editing Tools

- **Pen Tool**: Free-hand drawing
- **Text Tool**: Add text annotations
- **Arrow Tool**: Draw directional arrows
- **Rectangle Tool**: Draw rectangular shapes
- **Highlight Tool**: Semi-transparent highlighting
- **Blur Tool**: Apply blur effect to sensitive information
- **Emoji Tool**: Add emoji decorations

### Image Actions

- **Copy**: Copy screenshot to clipboard
- **Save**: Download screenshot to local device
- **Share**: Share screenshot (if supported by system)
- **Undo**: Revert last action
- **Filters**: Apply visual filters to screenshot

## Technical Details

### Core Components

- `background.js`: Handles extension background processes and capture logic
- `popup.js`: Manages the extension popup interface and user interactions
- Canvas-based editor for image manipulation
- Robust full-page capture implementation

### Key Functions

```javascript
// Capture full page
async function captureFullPage()

// Region selection
function captureRegion()

// Visible area capture
function captureVisible()

// Delayed capture
function captureDelayed()
```

### Image Processing

- Uses `OffscreenCanvas` for efficient image processing
- Handles device pixel ratio for high-quality captures
- Implements smooth scrolling for full-page captures
- Manages memory efficiently for large captures

## Development

### Project Structure

```
├── manifest.json
├── background.js
├── popup.js
├── popup.html
├── styles/
│   └── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building

No build process required - the extension can be loaded directly into Chrome in developer mode.

### Testing

1. Load the extension in developer mode
2. Test each capture mode on various types of websites
3. Verify editor tools function correctly
4. Test on different screen sizes and zoom levels

## Troubleshooting

### Common Issues

1. **Full-page capture not working:**
    - Ensure all permissions are granted
    - Check if page uses dynamic loading
    - Verify scroll positions are calculating correctly

2. **Region selection issues:**
    - Check if page has z-index conflicts
    - Verify overlay is positioning correctly

3. **Editor tools not responding:**
    - Clear extension cache
    - Reload extension
    - Check console for errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

