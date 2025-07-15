import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, OfflineTransaction } from './offlineStorage';
import { toast } from 'sonner';

class SyncService {
  private isSyncing = false;

  async syncTransactions(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) return { success: 0, failed: 0 };
    
    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      await offlineStorage.init();
      const unsyncedTransactions = await offlineStorage.getUnsyncedTransactions();
      
      if (unsyncedTransactions.length === 0) {
        this.isSyncing = false;
        return { success: 0, failed: 0 };
      }

      toast.info(`Syncing ${unsyncedTransactions.length} offline transactions...`);

      for (const transaction of unsyncedTransactions) {
        try {
          // Validate integrity before syncing
          if (!offlineStorage.validateIntegrity(transaction)) {
            console.error('Integrity check failed for transaction:', transaction.id);
            failed++;
            continue;
          }

          // Create order in database
          const orderNumber = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              store_id: transaction.storeId,
              user_id: transaction.userId,
              customer_id: transaction.customerId || null,
              subtotal: transaction.subtotal,
              tax_amount: transaction.tax,
              tip_amount: transaction.tip,
              discount_amount: transaction.discount,
              total: transaction.total,
              payment_method: transaction.paymentMethod,
              status: 'completed',
              created_at: transaction.timestamp
            })
            .select()
            .single();

          if (orderError) throw orderError;

          // Create order items
          const orderItems = transaction.items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            shipping_required: item.shipping_required || false
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;

          // Mark as synced
          await offlineStorage.markTransactionSynced(transaction.id);
          success++;

        } catch (error) {
          console.error('Failed to sync transaction:', transaction.id, error);
          failed++;
        }
      }

      if (success > 0) {
        toast.success(`Successfully synced ${success} transactions`);
      }
      
      if (failed > 0) {
        toast.error(`Failed to sync ${failed} transactions`);
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      toast.error('Sync process failed');
    } finally {
      this.isSyncing = false;
    }

    return { success, failed };
  }

  async autoSync(): Promise<void> {
    if (!navigator.onLine) return;
    
    try {
      await this.syncTransactions();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  startAutoSync(): void {
    // Sync when coming back online
    window.addEventListener('online', () => {
      setTimeout(() => this.autoSync(), 1000);
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine) {
        this.autoSync();
      }
    }, 5 * 60 * 1000);
  }
}

export const syncService = new SyncService();