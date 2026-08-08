import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  companySecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerProduct(context: __compactRuntime.CircuitContext<PS>,
                  productId_0: string,
                  batchId_0: string,
                  quantity_0: bigint,
                  suppliers_0: { identityHash: Uint8Array,
                                 isCertified: boolean,
                                 isEthical: boolean,
                                 certExpiry: bigint,
                                 pricePaid: bigint,
                                 routeCompliant: boolean
                               }[]): __compactRuntime.CircuitResults<PS, []>;
  recertifyProduct(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   minExpiry_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  proveFairPricing(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   fairFloor_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  shipProduct(context: __compactRuntime.CircuitContext<PS>,
              productId_0: string,
              suppliers_0: { identityHash: Uint8Array,
                             isCertified: boolean,
                             isEthical: boolean,
                             certExpiry: bigint,
                             pricePaid: bigint,
                             routeCompliant: boolean
                           }[]): __compactRuntime.CircuitResults<PS, []>;
  deliverProduct(context: __compactRuntime.CircuitContext<PS>,
                 productId_0: string,
                 quantityDelivered_0: bigint,
                 suppliers_0: { identityHash: Uint8Array,
                                isCertified: boolean,
                                isEthical: boolean,
                                certExpiry: bigint,
                                pricePaid: bigint,
                                routeCompliant: boolean
                              }[]): __compactRuntime.CircuitResults<PS, []>;
  withdrawClaim(context: __compactRuntime.CircuitContext<PS>,
                productId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerProduct(context: __compactRuntime.CircuitContext<PS>,
                  productId_0: string,
                  batchId_0: string,
                  quantity_0: bigint,
                  suppliers_0: { identityHash: Uint8Array,
                                 isCertified: boolean,
                                 isEthical: boolean,
                                 certExpiry: bigint,
                                 pricePaid: bigint,
                                 routeCompliant: boolean
                               }[]): __compactRuntime.CircuitResults<PS, []>;
  recertifyProduct(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   minExpiry_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  proveFairPricing(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   fairFloor_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  shipProduct(context: __compactRuntime.CircuitContext<PS>,
              productId_0: string,
              suppliers_0: { identityHash: Uint8Array,
                             isCertified: boolean,
                             isEthical: boolean,
                             certExpiry: bigint,
                             pricePaid: bigint,
                             routeCompliant: boolean
                           }[]): __compactRuntime.CircuitResults<PS, []>;
  deliverProduct(context: __compactRuntime.CircuitContext<PS>,
                 productId_0: string,
                 quantityDelivered_0: bigint,
                 suppliers_0: { identityHash: Uint8Array,
                                isCertified: boolean,
                                isEthical: boolean,
                                certExpiry: bigint,
                                pricePaid: bigint,
                                routeCompliant: boolean
                              }[]): __compactRuntime.CircuitResults<PS, []>;
  withdrawClaim(context: __compactRuntime.CircuitContext<PS>,
                productId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerProduct(context: __compactRuntime.CircuitContext<PS>,
                  productId_0: string,
                  batchId_0: string,
                  quantity_0: bigint,
                  suppliers_0: { identityHash: Uint8Array,
                                 isCertified: boolean,
                                 isEthical: boolean,
                                 certExpiry: bigint,
                                 pricePaid: bigint,
                                 routeCompliant: boolean
                               }[]): __compactRuntime.CircuitResults<PS, []>;
  recertifyProduct(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   minExpiry_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  proveFairPricing(context: __compactRuntime.CircuitContext<PS>,
                   productId_0: string,
                   fairFloor_0: bigint,
                   suppliers_0: { identityHash: Uint8Array,
                                  isCertified: boolean,
                                  isEthical: boolean,
                                  certExpiry: bigint,
                                  pricePaid: bigint,
                                  routeCompliant: boolean
                                }[]): __compactRuntime.CircuitResults<PS, []>;
  shipProduct(context: __compactRuntime.CircuitContext<PS>,
              productId_0: string,
              suppliers_0: { identityHash: Uint8Array,
                             isCertified: boolean,
                             isEthical: boolean,
                             certExpiry: bigint,
                             pricePaid: bigint,
                             routeCompliant: boolean
                           }[]): __compactRuntime.CircuitResults<PS, []>;
  deliverProduct(context: __compactRuntime.CircuitContext<PS>,
                 productId_0: string,
                 quantityDelivered_0: bigint,
                 suppliers_0: { identityHash: Uint8Array,
                                isCertified: boolean,
                                isEthical: boolean,
                                certExpiry: bigint,
                                pricePaid: bigint,
                                routeCompliant: boolean
                              }[]): __compactRuntime.CircuitResults<PS, []>;
  withdrawClaim(context: __compactRuntime.CircuitContext<PS>,
                productId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  products: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: string): boolean;
    lookup(key_0: string): { batchId: string,
                             quantity: bigint,
                             stage: bigint,
                             isEthical: boolean,
                             allCertified: boolean,
                             certifiedCount: bigint,
                             allRoutesCompliant: boolean,
                             fairFloor: bigint,
                             fairPricing: boolean,
                             auditCount: bigint,
                             complianceScore: bigint
                           };
    [Symbol.iterator](): Iterator<[string, { batchId: string,
  quantity: bigint,
  stage: bigint,
  isEthical: boolean,
  allCertified: boolean,
  certifiedCount: bigint,
  allRoutesCompliant: boolean,
  fairFloor: bigint,
  fairPricing: boolean,
  auditCount: bigint,
  complianceScore: bigint
}]>
  };
  readonly authority: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               ownerSk_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
