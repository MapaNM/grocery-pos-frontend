// IndexedDB helper for offline storage
const DB_NAME = 'GroceryPOS';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
  }

  // Initialize database
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

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: '_id' });
          productStore.createIndex('barcode', 'barcode', { unique: true });
        }

        // Pending sales store (for offline sales)
        if (!db.objectStoreNames.contains('pendingSales')) {
          db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
        }

        // Synced sales store
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: '_id' });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: '_id' });
          customerStore.createIndex('phone', 'phone', { unique: true });
        }
      };
    });
  }

  // Save products to local DB
  async saveProducts(products) {
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      await store.put(product);
    }
    
    return tx.complete;
  }

  // Get all products from local DB
  async getProducts() {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return store.getAll();
  }

  // Get product by barcode
  async getProductByBarcode(barcode) {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('barcode');
    return index.get(barcode);
  }

  // Save pending sale (offline)
  async savePendingSale(sale) {
    const tx = this.db.transaction('pendingSales', 'readwrite');
    const store = tx.objectStore('pendingSales');
    return store.add({
      ...sale,
      timestamp: new Date().toISOString(),
      synced: false
    });
  }

  // Get all pending sales
  async getPendingSales() {
    const tx = this.db.transaction('pendingSales', 'readonly');
    const store = tx.objectStore('pendingSales');
    return store.getAll();
  }

  // Delete pending sale after sync
  async deletePendingSale(id) {
    const tx = this.db.transaction('pendingSales', 'readwrite');
    const store = tx.objectStore('pendingSales');
    return store.delete(id);
  }

  // Save customers
  async saveCustomers(customers) {
    const tx = this.db.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');
    
    for (const customer of customers) {
      await store.put(customer);
    }
    
    return tx.complete;
  }

  // Get customer by phone
  async getCustomerByPhone(phone) {
    const tx = this.db.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');
    const index = store.index('phone');
    return index.get(phone);
  }

  // Update product quantity locally
  async updateProductQuantity(productId, newQuantity) {
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const product = await store.get(productId);
    
    if (product) {
      product.quantity = newQuantity;
      await store.put(product);
    }
  }
}

const offlineDBInstance = new OfflineDB();
export default offlineDBInstance;