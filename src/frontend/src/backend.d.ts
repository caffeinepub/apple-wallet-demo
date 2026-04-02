export interface Card {
  id: string;
  owner: string;
  name: string;
  last4: string;
  network: string;
  gradient: string;
  expiry: string;
  balance: bigint;
}

export interface Tx {
  cardId: string;
  amount: bigint;
  timestamp: bigint;
  chargedBy: string;
}

type OkErr<T> = { ok: T } | { err: string };

export interface backendInterface {
  register(username: string, password: string): Promise<OkErr<string>>;
  login(username: string, password: string): Promise<OkErr<string>>;
  loginWithPrincipal(principal: string): Promise<OkErr<string>>;
  enrollCard(
    token: string,
    name: string,
    last4: string,
    network: string,
    gradient: string,
    expiry: string,
    balance: bigint
  ): Promise<OkErr<string>>;
  getMyCards(token: string): Promise<Card[]>;
  getAllCards(): Promise<Card[]>;
  chargeCard(token: string, cardId: string, amount: bigint): Promise<OkErr<bigint>>;
  getTransactions(): Promise<Tx[]>;
}
