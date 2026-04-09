const DB_NAME = 'GroceryPOS';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: '_id' });
          productStore.createIndex('barcode', 'barcode', { unique: true });
        }
        if (!db.objectStoreNames.contains('pendingSales')) {
          db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: '_id' });
          customerStore.createIndex('phone', 'phone', { unique: true });
        }
      };
    });
  }

  async saveProducts(products) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      for (const product of products) {
        store.put(product);
      }
    });
  }

  async getProducts() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductByBarcode(barcode) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('barcode');
      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePendingSale(sale) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('pendingSales', 'readwrite');
      const store = tx.objectStore('pendingSales');
      const request = store.add({
        ...sale,
        timestamp: new Date().toISOString(),
        synced: false,
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSales() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('pendingSales', 'readonly');
      const store = tx.objectStore('pendingSales');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingSale(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('pendingSales', 'readwrite');
      const store = tx.objectStore('pendingSales');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomers(customers) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      for (const customer of customers) {
        store.put(customer);
      }
    });
  }

  async getCustomerByPhone(phone) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const index = store.index('phone');
      const request = index.get(phone);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProductQuantity(productId, newQuantity) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const getRequest = store.get(productId);

      getRequest.onsuccess = () => {
        const product = getRequest.result;
        if (product) {
          product.quantity = newQuantity;
          const putRequest = store.put(product);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

const offlineDBInstance = new OfflineDB();
export default offlineDBInstance;