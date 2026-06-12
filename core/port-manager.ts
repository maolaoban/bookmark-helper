/**
 * Port 连接管理模块
 * 管理 popup 与 background 的持久连接
 */

import type { IndexStatus } from '../types';

export class PortManager {
  private ports = new Set<chrome.runtime.Port>();

  addPort(port: chrome.runtime.Port): void {
    this.ports.add(port);
    port.onDisconnect.addListener(() => {
      this.ports.delete(port);
    });
  }

  async broadcastStatus(status: IndexStatus): Promise<void> {
    if (this.ports.size === 0) return;

    for (const port of this.ports) {
      try {
        port.postMessage({ type: 'index-status', payload: status });
      } catch {
        this.ports.delete(port);
      }
    }
  }

  get portCount(): number {
    return this.ports.size;
  }
}

export default PortManager;
