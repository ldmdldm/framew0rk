# Framew0xrk DeFi Strategy Assistant

## Installation

Add the following script tags to your HTML:

```html
<!-- Required dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Framew0xrk Plugin -->
<script src="path/to/framew0xrk.umd.js"></script>

<script>
  // Configure the plugin
  window.FRAMEW0XRK_CONFIG = {
    apiKey: 'your-api-key',
    containerId: 'framew0xrk-container' // Optional
  };
</script>
```

## Usage

### Method 1: Auto-initialization
The plugin will automatically initialize if you provide the configuration through `window.FRAMEW0XRK_CONFIG`.

```html
<div id="framew0xrk-container"></div>
```

### Method 2: Manual initialization
You can also manually initialize the plugin:

```javascript
const plugin = new Framew0xrk.FrameworkPlugin({
  apiKey: 'your-api-key'
});

// Mount to a specific container
const container = document.getElementById('framew0xrk-container');
plugin.mount(container);

// Or let the plugin create its own container
plugin.mount();

// Unmount when needed
plugin.unmount();
```