import { Platform } from 'react-native';
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import type { StorePayment } from '../../api/treats';

export const IAP_PRODUCTS = {
  treat: 'com.andersontech.bluedate.treat',
  standard: 'com.andersontech.bluedate.premium.standard.monthly',
  plus: 'com.andersontech.bluedate.premium.plus.monthly',
} as const;

export type IapKind = 'in-app' | 'subs';

export class IapCancelledError extends Error {
  constructor() {
    super('cancelled');
  }
}

export class IapUnavailableError extends Error {
  constructor() {
    super('unavailable');
  }
}

let connected: Promise<boolean> | null = null;

function ensureConnection(): Promise<boolean> {
  if (!connected) {
    connected = initConnection()
      .then(Boolean)
      .catch(() => {
        connected = null;
        return false;
      });
  }
  return connected;
}

export async function getDisplayPrices(
  skus: string[],
  type: IapKind,
): Promise<Record<string, string>> {
  if (!(await ensureConnection())) return {};
  try {
    const products = (await fetchProducts({ skus, type })) ?? [];
    const map: Record<string, string> = {};
    for (const p of products as { id: string; displayPrice: string }[]) {
      map[p.id] = p.displayPrice;
    }
    return map;
  } catch {
    return {};
  }
}

function toPayment(purchase: Purchase): StorePayment {
  return {
    Platform: Platform.OS === 'ios' ? 'ios' : 'android',
    ProductId: purchase.productId,
    TransactionId: purchase.id,
    PurchaseToken: purchase.purchaseToken ?? '',
  };
}

/**
 * Opens the store sheet and resolves once the store reports the purchase.
 * The caller must hand the payment to the API, then call `completePurchase`.
 */
export async function buyProduct(
  sku: string,
  type: IapKind,
): Promise<{ payment: StorePayment; purchase: Purchase }> {
  if (!(await ensureConnection())) {
    throw new IapUnavailableError();
  }

  const products = await fetchProducts({ skus: [sku], type }).catch(() => []);
  if (!products || products.length === 0) {
    throw new IapUnavailableError();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      updated.remove();
      failed.remove();
      fn();
    };

    const updated = purchaseUpdatedListener(purchase => {
      if (purchase.productId !== sku || !purchase.purchaseToken) return;
      done(() => resolve({ payment: toPayment(purchase), purchase }));
    });
    const failed = purchaseErrorListener((error: PurchaseError) => {
      done(() =>
        reject(error.code === ErrorCode.UserCancelled ? new IapCancelledError() : error),
      );
    });

    const request =
      type === 'subs'
        ? requestPurchase({ type: 'subs', request: { apple: { sku }, google: { skus: [sku] } } })
        : requestPurchase({ type: 'in-app', request: { apple: { sku }, google: { skus: [sku] } } });

    request
      .then(result => {
        const list = Array.isArray(result) ? result : result ? [result] : [];
        const match = list.find(p => p.productId === sku && p.purchaseToken);
        if (match) {
          done(() => resolve({ payment: toPayment(match), purchase: match }));
        }
      })
      .catch((error: PurchaseError) => {
        done(() =>
          reject(error?.code === ErrorCode.UserCancelled ? new IapCancelledError() : error),
        );
      });
  });
}

export async function completePurchase(purchase: Purchase, isConsumable: boolean) {
  try {
    await finishTransaction({ purchase, isConsumable });
  } catch {
    /* StoreKit re-delivers unfinished transactions on next launch */
  }
}

/** Active subscription transactions on this Apple ID, for "Restore purchases". */
export async function getOwnedSubscriptions(): Promise<StorePayment[]> {
  if (!(await ensureConnection())) return [];
  try {
    const purchases = await getAvailablePurchases();
    const subs = new Set<string>([IAP_PRODUCTS.standard, IAP_PRODUCTS.plus]);
    return purchases.filter(p => subs.has(p.productId) && p.purchaseToken).map(toPayment);
  } catch {
    return [];
  }
}
