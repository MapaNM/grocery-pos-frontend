import offlineDB from './offlineDB';
import { getProducts, createSale, getProductByBarcode } from '../services/api';

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 Back online!');
      this.syncPendingSales();
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 Gone offline!');
    });
  }

  // Sync products from server to local DB
  async syncProducts() {
    if (!this.isOnline) return;

    try {
      const { data } = await getProducts();
      await offlineDB.saveProducts(data);
      console.log('✅ Products synced:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to sync products:', error);
    }
  }

  // Sync pending sales to server
  async syncPendingSales() {
    if (!this.isOnline) return;

    try {
      const pendingSales = await offlineDB.getPendingSales();
      console.log('📤 Syncing pending sales:', pendingSales.length);

      for (const sale of pendingSales) {
        try {
          await createSale(sale);
          await offlineDB.deletePendingSale(sale.id);
          console.log('✅ Sale synced:', sale.id);
        } catch (error) {
          console.error('❌ Failed to sync sale:', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync pending sales:', error);
    }
  }

  // Sync all data
  async syncData() {
    await this.syncProducts();
    await this.syncPendingSales();
  }

  // Get products (online or offline)
  async getProducts() {
    if (this.isOnline) {
      try {
        const { data } = await getProducts();
        await offlineDB.saveProducts(data);
        return data;
      } catch (error) {
        console.log('📱 Using offline data');
        return await offlineDB.getProducts();
      }
    } else {
      return await offlineDB.getProducts();
    }
  }

  // Get product by barcode (online or offline)
  async getProductByBarcode(barcode) {
  // First try offline DB
  const offlineProduct = await offlineDB.getProductByBarcode(barcode);
  if (offlineProduct) return offlineProduct;

  // If not found offline and we're online, try server
  if (this.isOnline) {
    try {
      const { data } = await getProductByBarcode(barcode); // ← need to import this
      await offlineDB.saveProducts([data]); // cache it
      return data;
    } catch (error) {
      console.error('❌ Product not found on server:', error);
      return null;
    }
  }

  return null;
}

  // Create sale (online or offline)
  async createSale(saleData) {
    if (this.isOnline) {
      try {
        const { data } = await createSale(saleData);
        return { success: true, data, offline: false };
      } catch (error) {
        // If online but failed, save offline
        console.log('❌ Online sale failed, saving offline');
        await offlineDB.savePendingSale(saleData);
        return { success: true, offline: true };
      }
    } else {
      // Offline: save to pending
      await offlineDB.savePendingSale(saleData);
      return { success: true, offline: true };
    }
  }

  // Update product quantity locally
  async updateProductQuantity(productId, quantity) {
    await offlineDB.updateProductQuantity(productId, quantity);
  }
}

const offlineManagerInstance = new OfflineManager();
export default offlineManagerInstance;