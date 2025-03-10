import React from 'react';
import { createRoot } from 'react-dom/client';
import { Console } from '../components/Console';
import '../index.css';

export class FrameworkPlugin {
  private container: HTMLElement | null = null;

  constructor(private config: { 
    apiKey: string;
    containerId?: string;
  }) {}

  mount(container?: HTMLElement) {
    if (container) {
      this.container = container;
    } else if (this.config.containerId) {
      this.container = document.getElementById(this.config.containerId);
    } else {
      this.container = document.createElement('div');
      document.body.appendChild(this.container);
    }

    if (!this.container) {
      throw new Error('Could not find or create container element');
    }

    const root = createRoot(this.container);
    root.render(
      <div className="framew0rk-plugin">
        <Console />
      </div>
    );
  }

  unmount() {
    if (this.container) {
      const root = createRoot(this.container);
      root.unmount();
    }
  }
}

// Auto-initialize if window.FRAMEW0RK_CONFIG exists
declare global {
  interface Window {
    FRAMEW0RK_CONFIG?: {
      apiKey: string;
      containerId?: string;
    };
  }
}

if (typeof window !== 'undefined' && window.FRAMEW0RK_CONFIG) {
  const plugin = new FrameworkPlugin(window.FRAMEW0RK_CONFIG);
  plugin.mount();
}