import { API_PATHS } from '../config/api';
import { ApiError, apiRequest, ApiEnvelope } from './client';
import { resolveMediaUrl } from './photos';

export type TreatStatus = 'pending' | 'accepted' | 'rejected';

export type TreatUser = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  ProfileImage?: string | null;
};

export type Treat = {
  id: number;
  sender: TreatUser;
  receiver: TreatUser;
  itemTypeCode?: string | null;
  itemTypeName?: string | null;
  itemValue: string;
  message?: string | null;
  status: TreatStatus;
  createdDate: string;
  respondedAt?: string | null;
  conversationId?: number | null;
  isMine: boolean;
};

/** Store payload forwarded to the API for server-side verification. */
export type StorePayment = {
  Platform: 'ios' | 'android';
  ProductId: string;
  TransactionId?: string | null;
  PurchaseToken: string;
};

export type TreatQuote = {
  requiresPayment: boolean;
  productId: string;
  messageMaxLength: number;
};

type TreatResponse = ApiEnvelope & { treat?: Treat };

async function unwrap(res: TreatResponse): Promise<Treat> {
  if (!res.IsSuccess || !res.treat) {
    throw new ApiError(400, res.ErrorMessage ?? []);
  }
  const t = res.treat;
  const [senderImg, receiverImg] = await Promise.all([
    resolveMediaUrl(t.sender.ProfileImage),
    resolveMediaUrl(t.receiver.ProfileImage),
  ]);
  return {
    ...t,
    sender: { ...t.sender, ProfileImage: senderImg ?? t.sender.ProfileImage },
    receiver: { ...t.receiver, ProfileImage: receiverImg ?? t.receiver.ProfileImage },
  };
}

export async function getTreatQuote(): Promise<TreatQuote> {
  const res = await apiRequest<ApiEnvelope & Partial<TreatQuote>>(API_PATHS.treatQuote);
  return {
    requiresPayment: res.requiresPayment ?? true,
    productId: res.productId ?? '',
    messageMaxLength: res.messageMaxLength ?? 60,
  };
}

export async function createTreat(input: {
  receiverUserId: number;
  userInterestId: number;
  message?: string;
  payment?: StorePayment;
}): Promise<Treat> {
  const res = await apiRequest<TreatResponse>(API_PATHS.treat, {
    method: 'POST',
    body: {
      ReceiverUserId: input.receiverUserId,
      UserInterestId: input.userInterestId,
      Message: input.message?.trim() || undefined,
      Payment: input.payment,
    },
  });
  return unwrap(res);
}

export async function getTreat(id: number): Promise<Treat> {
  return unwrap(await apiRequest<TreatResponse>(API_PATHS.treatById(id)));
}

export async function acceptTreat(id: number): Promise<Treat> {
  return unwrap(await apiRequest<TreatResponse>(API_PATHS.treatAccept(id), { method: 'POST' }));
}

export async function rejectTreat(id: number): Promise<Treat> {
  return unwrap(await apiRequest<TreatResponse>(API_PATHS.treatReject(id), { method: 'POST' }));
}

export function treatUserName(user: TreatUser): string {
  const full = `${user.FirstName} ${user.LastName}`.trim();
  return full || user.Username;
}
