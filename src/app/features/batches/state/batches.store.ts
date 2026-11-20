import { Injectable, signal, computed } from '@angular/core';
import { BatchViewModel, BatchStatus } from '../models/batches-view.model';

const DEFAULT_BATCHES: BatchViewModel[] = [
  {
    id: 'batch-morn-01',
    batchName: 'Morning Fresh Produce Batch',
    productName: 'Fresh Nagpur Palak & Methi Leaves',
    productId: 'prod-palak-001',
    productionDate: new Date().toISOString().split('T')[0],
    readyTime: '10:30',
    cutoffTime: '09:45',
    bookedUnits: 14,
    totalCapacityUnits: 25,
    unitPricePaise: 5000,
    instructions: 'Harvested early morning, sorted, washed, ready for 10:30 AM pickup.',
    status: 'OPEN_FOR_ORDERS',
    preorders: [
      { orderId: '#ORD78291', customerName: 'Rahul Deshmukh', quantity: 2, paymentStatus: 'PAID', pickupSlot: '10:30 AM' },
      { orderId: '#ORD78290', customerName: 'Priya Kulkarni', quantity: 2, paymentStatus: 'PAID', pickupSlot: '10:30 AM' }
    ]
  },
  {
    id: 'batch-eve-02',
    batchName: 'Evening Fresh Desi Tomatoes Batch',
    productName: 'Farm Fresh Desi Tomatoes (1 kg)',
    productId: 'prod-tomato-002',
    productionDate: new Date().toISOString().split('T')[0],
    readyTime: '17:30',
    cutoffTime: '16:00',
    bookedUnits: 20,
    totalCapacityUnits: 30,
    unitPricePaise: 8000,
    instructions: 'Packed in eco-friendly paper bags for evening rush.',
    status: 'OPEN_FOR_ORDERS',
    preorders: [
      { orderId: '#ORD78289', customerName: 'Amit Patil', quantity: 2, paymentStatus: 'PAID', pickupSlot: '05:30 PM' }
    ]
  }
];

@Injectable()
export class BatchesStore {
  readonly batches = signal<BatchViewModel[]>([...DEFAULT_BATCHES]);
  readonly filter = signal<string>('ALL');

  readonly filteredBatches = computed(() => {
    const list = this.batches();
    const f = this.filter();
    if (f === 'ACTIVE') {
      return list.filter(b => b.status === 'OPEN_FOR_ORDERS' || b.status === 'PREPARING');
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (f === 'TODAY') {
      return list.filter(b => b.productionDate === todayStr);
    }
    if (f === 'UPCOMING') {
      return list.filter(b => b.productionDate > todayStr);
    }
    return list;
  });

  readonly totalPreorderValuePaise = computed(() => {
    return this.batches().reduce((sum, b) => sum + (b.bookedUnits * b.unitPricePaise), 0);
  });

  readonly totalActiveBatches = computed(() => {
    return this.batches().filter(b => b.status === 'OPEN_FOR_ORDERS' || b.status === 'PREPARING').length;
  });

  readonly totalBookedUnits = computed(() => {
    return this.batches().reduce((sum, b) => sum + b.bookedUnits, 0);
  });

  setFilter(f: string): void {
    this.filter.set(f);
  }

  addBatch(newBatch: Omit<BatchViewModel, 'id' | 'bookedUnits' | 'preorders' | 'status'>): void {
    const batch: BatchViewModel = {
      ...newBatch,
      id: `batch-${Date.now()}`,
      bookedUnits: 0,
      preorders: [],
      status: 'OPEN_FOR_ORDERS'
    };
    this.batches.update(list => [batch, ...list]);
  }

  addCapacity(batchId: string, extraUnits: number): void {
    this.batches.update(list =>
      list.map(b => b.id === batchId ? { ...b, totalCapacityUnits: b.totalCapacityUnits + extraUnits } : b)
    );
  }

  closeCutoffEarly(batchId: string): void {
    this.batches.update(list =>
      list.map(b => b.id === batchId ? { ...b, status: 'CUTOFF_REACHED' as BatchStatus } : b)
    );
  }

  advanceBatchStatus(batchId: string): void {
    const nextMap: Record<BatchStatus, BatchStatus> = {
      'SCHEDULED': 'OPEN_FOR_ORDERS',
      'OPEN_FOR_ORDERS': 'PREPARING',
      'CUTOFF_REACHED': 'PREPARING',
      'PREPARING': 'READY_FOR_PICKUP',
      'READY_FOR_PICKUP': 'COMPLETED',
      'COMPLETED': 'COMPLETED'
    };

    this.batches.update(list =>
      list.map(b => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          status: nextMap[b.status]
        };
      })
    );
  }
}
