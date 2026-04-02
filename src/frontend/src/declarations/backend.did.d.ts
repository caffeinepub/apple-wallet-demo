/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

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
type OkErrText = { ok: string } | { err: string };
type OkErrNat  = { ok: bigint } | { err: string };

export interface _SERVICE {
  register:           ActorMethod<[string, string], OkErrText>;
  login:              ActorMethod<[string, string], OkErrText>;
  loginWithPrincipal: ActorMethod<[string], OkErrText>;
  enrollCard:         ActorMethod<[string, string, string, string, string, string, bigint], OkErrText>;
  getMyCards:         ActorMethod<[string], Card[]>;
  getAllCards:         ActorMethod<[], Card[]>;
  chargeCard:         ActorMethod<[string, string, bigint], OkErrNat>;
  getTransactions:    ActorMethod<[], Tx[]>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
