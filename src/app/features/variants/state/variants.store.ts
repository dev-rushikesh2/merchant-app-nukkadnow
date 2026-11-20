import { Injectable, signal, inject } from '@angular/core';
import { VariantsRepository } from '../data-access/variants.repository';
import { VariantsViewModel } from '../models/variants-view.model';

const DEFAULT_VARIANTS: VariantsViewModel[] = [
  {
    id: 'var-weight',
    title: '⚖️ Weight / Packaging Variants',
    subtitle: 'Standard pack sizes: 250 g, 500 g, 1 kg, 5 kg with individual unit prices and barcodes.'
  },
  {
    id: 'var-volume',
    title: '🥛 Liquid Volume Variants',
    subtitle: 'Bottle and pouch sizes: 200 ml, 500 ml, 1 L, 2 L with cold storage flags.'
  },
  {
    id: 'var-custom',
    title: '🌶️ Taste, Spice & Customization Add-ons',
    subtitle: 'Custom choices: Mild / Medium / Kolhapuri Spicy, Sugar-free, Extra Cheese, Eco Packaging.'
  }
];

@Injectable()
export class VariantsStore {
  private repo = inject(VariantsRepository);

  readonly items = signal<VariantsViewModel[]>([...DEFAULT_VARIANTS]);
  readonly loading = signal<boolean>(false);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.repo.getList().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.items.set(data);
        } else {
          this.items.set(DEFAULT_VARIANTS);
        }
        this.loading.set(false);
      },
      error: () => {
        this.items.set(DEFAULT_VARIANTS);
        this.loading.set(false);
      }
    });
  }
}
