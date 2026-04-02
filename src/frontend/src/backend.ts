/* eslint-disable */
// @ts-nocheck
import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
import type { backendInterface, Card, Tx } from "./backend.d";
export type { backendInterface, Card, Tx };

export class ExternalBlob {
  _blob?: Uint8Array<ArrayBuffer> | null;
  directURL: string;
  onProgress?: (percentage: number) => void = undefined;
  private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null) {
    if (blob) this._blob = blob;
    this.directURL = directURL;
  }
  static fromURL(url: string): ExternalBlob { return new ExternalBlob(url, null); }
  static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
    const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
    return new ExternalBlob(url, blob);
  }
  public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this._blob) return this._blob;
    const response = await fetch(this.directURL);
    const blob = await response.blob();
    this._blob = new Uint8Array(await blob.arrayBuffer());
    return this._blob;
  }
  public getDirectURL(): string { return this.directURL; }
  public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  processError?: (error: unknown) => never;
}

export class Backend implements backendInterface {
  constructor(
    private actor: ActorSubclass<_SERVICE>,
    private _uploadFile?: (file: ExternalBlob) => Promise<Uint8Array>,
    private _downloadFile?: (file: Uint8Array) => Promise<ExternalBlob>,
    private processError?: (error: unknown) => never,
  ) {}

  async register(username: string, password: string) {
    return this.actor.register(username, password);
  }
  async login(username: string, password: string) {
    return this.actor.login(username, password);
  }
  async loginWithPrincipal(principal: string) {
    return this.actor.loginWithPrincipal(principal);
  }
  async enrollCard(token: string, name: string, last4: string, network: string, gradient: string, expiry: string, balance: bigint) {
    return this.actor.enrollCard(token, name, last4, network, gradient, expiry, balance);
  }
  async getMyCards(token: string): Promise<Card[]> {
    return this.actor.getMyCards(token) as any;
  }
  async getAllCards(): Promise<Card[]> {
    return this.actor.getAllCards() as any;
  }
  async chargeCard(token: string, cardId: string, amount: bigint) {
    return this.actor.chargeCard(token, cardId, amount);
  }
  async getTransactions(): Promise<Tx[]> {
    return this.actor.getTransactions() as any;
  }
}

export function createActor(
  canisterId: string,
  _uploadFile?: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile?: (file: Uint8Array) => Promise<ExternalBlob>,
  options: CreateActorOptions = {},
): Backend {
  const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
  if (options.agent && options.agentOptions) {
    console.warn('Detected both agent and agentOptions passed to createActor. Ignoring agentOptions.');
  }
  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
