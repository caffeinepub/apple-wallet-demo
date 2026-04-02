/* eslint-disable */
// @ts-nocheck
import { IDL } from '@icp-sdk/core/candid';

const Card = IDL.Record({
  id: IDL.Text,
  owner: IDL.Text,
  name: IDL.Text,
  last4: IDL.Text,
  network: IDL.Text,
  gradient: IDL.Text,
  expiry: IDL.Text,
  balance: IDL.Nat,
});

const Tx = IDL.Record({
  cardId: IDL.Text,
  amount: IDL.Nat,
  timestamp: IDL.Int,
  chargedBy: IDL.Text,
});

const OkErrText = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
const OkErrNat  = IDL.Variant({ ok: IDL.Nat,  err: IDL.Text });

export const idlService = IDL.Service({
  register:          IDL.Func([IDL.Text, IDL.Text], [OkErrText], []),
  login:             IDL.Func([IDL.Text, IDL.Text], [OkErrText], []),
  loginWithPrincipal: IDL.Func([IDL.Text], [OkErrText], []),
  enrollCard:        IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat], [OkErrText], []),
  getMyCards:        IDL.Func([IDL.Text], [IDL.Vec(Card)], ['query']),
  getAllCards:        IDL.Func([], [IDL.Vec(Card)], ['query']),
  chargeCard:        IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkErrNat], []),
  getTransactions:   IDL.Func([], [IDL.Vec(Tx)], ['query']),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const Card = IDL.Record({
    id: IDL.Text,
    owner: IDL.Text,
    name: IDL.Text,
    last4: IDL.Text,
    network: IDL.Text,
    gradient: IDL.Text,
    expiry: IDL.Text,
    balance: IDL.Nat,
  });
  const Tx = IDL.Record({
    cardId: IDL.Text,
    amount: IDL.Nat,
    timestamp: IDL.Int,
    chargedBy: IDL.Text,
  });
  const OkErrText = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const OkErrNat  = IDL.Variant({ ok: IDL.Nat,  err: IDL.Text });
  return IDL.Service({
    register:           IDL.Func([IDL.Text, IDL.Text], [OkErrText], []),
    login:              IDL.Func([IDL.Text, IDL.Text], [OkErrText], []),
    loginWithPrincipal: IDL.Func([IDL.Text], [OkErrText], []),
    enrollCard:         IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat], [OkErrText], []),
    getMyCards:         IDL.Func([IDL.Text], [IDL.Vec(Card)], ['query']),
    getAllCards:         IDL.Func([], [IDL.Vec(Card)], ['query']),
    chargeCard:         IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkErrNat], []),
    getTransactions:    IDL.Func([], [IDL.Vec(Tx)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
