import { CartItem } from '@/pages/POS';

export interface OfflineTransaction {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerId?: string;
  storeId: string;
  userId: string;
  businessId: string;
  synced: boolean;
  integrity_hash: string;
}

class OfflineStorageService {
  private dbName = 'memapos_offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }

        if (!db.objectStoreNames.contains('receipts')) {
          const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
          receiptStore.createIndex('transactionId', 'transactionId');
        }
      };
    });
  }

  async storeTransaction(transaction: OfflineTransaction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      
      // Convert boolean to number for IndexedDB compatibility
      const dbTransaction = {
        ...transaction,
        synced: transaction.synced ? 1 : 0
      };
      
      const request = store.put(dbTransaction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(['transactions'], 'readonly');
        const store = tx.objectStore('transactions');
        
        // Get all transactions and filter manually to handle both boolean and number values
        const request = store.getAll();
        request.onsuccess = () => {
          const allTransactions = request.result;
          const unsyncedTransactions = allTransactions
            .filter(transaction => transaction.synced === false || transaction.synced === 0)
            .map(transaction => ({
              ...transaction,
              synced: Boolean(transaction.synced) // Convert back to boolean
            }));
          resolve(unsyncedTransactions);
        };
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.error('Error in getUnsyncedTransactions:', error);
        resolve([]); // Return empty array on error
      }
    });
  }

  async markTransactionSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const transaction = getRequest.result;
        if (transaction) {
          transaction.synced = 1;
          const putRequest = store.put(transaction);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Transaction not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async storeReceipt(receipt: { id: string; transactionId: string; content: string; timestamp: string }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['receipts'], 'readwrite');
      const store = tx.objectStore('receipts');
      
      const request = store.put(receipt);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getReceipt(transactionId: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['receipts'], 'readonly');
      const store = tx.objectStore('receipts');
      const index = store.index('transactionId');
      
      const request = index.get(transactionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  generateIntegrityHash(transaction: Omit<OfflineTransaction, 'integrity_hash'>): string {
    const data = JSON.stringify({
      items: transaction.items,
      total: transaction.total,
      timestamp: transaction.timestamp
    });
    
    // Simple hash function for demo - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  validateIntegrity(transaction: OfflineTransaction): boolean {
    const calculatedHash = this.generateIntegrityHash(transaction);
    return calculatedHash === transaction.integrity_hash;
  }
}

export const offlineStorage = new OfflineStorageService();