import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Material } from '@shared/schema';

interface CartItem {
  id: number;
  material: Material;
}

interface CartStore {
  items: CartItem[];
  addItem: (material: Material) => void;
  removeItem: (materialId: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (material: Material) => {
        const items = get().items;
        const existingItem = items.find(item => item.material.id === material.id);
        
        if (!existingItem) {
          set({
            items: [...items, { id: Date.now(), material }]
          });
        }
      },
      
      removeItem: (materialId: number) => {
        set({
          items: get().items.filter(item => item.material.id !== materialId)
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + parseFloat(item.material.price), 0);
      },
      
      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
