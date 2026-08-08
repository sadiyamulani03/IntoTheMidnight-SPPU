import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = __compactRuntime.CompactTypeOpaqueString;

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_3 = __compactRuntime.CompactTypeBoolean;

class _ProductRecord_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment()))))))))));
  }
  fromValue(value_0) {
    return {
      batchId: _descriptor_0.fromValue(value_0),
      quantity: _descriptor_1.fromValue(value_0),
      stage: _descriptor_2.fromValue(value_0),
      isEthical: _descriptor_3.fromValue(value_0),
      allCertified: _descriptor_3.fromValue(value_0),
      certifiedCount: _descriptor_2.fromValue(value_0),
      allRoutesCompliant: _descriptor_3.fromValue(value_0),
      fairFloor: _descriptor_1.fromValue(value_0),
      fairPricing: _descriptor_3.fromValue(value_0),
      auditCount: _descriptor_1.fromValue(value_0),
      complianceScore: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.batchId).concat(_descriptor_1.toValue(value_0.quantity).concat(_descriptor_2.toValue(value_0.stage).concat(_descriptor_3.toValue(value_0.isEthical).concat(_descriptor_3.toValue(value_0.allCertified).concat(_descriptor_2.toValue(value_0.certifiedCount).concat(_descriptor_3.toValue(value_0.allRoutesCompliant).concat(_descriptor_1.toValue(value_0.fairFloor).concat(_descriptor_3.toValue(value_0.fairPricing).concat(_descriptor_1.toValue(value_0.auditCount).concat(_descriptor_2.toValue(value_0.complianceScore)))))))))));
  }
}

const _descriptor_4 = new _ProductRecord_0();

const _descriptor_5 = new __compactRuntime.CompactTypeBytes(32);

class _Supplier_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment())))));
  }
  fromValue(value_0) {
    return {
      identityHash: _descriptor_5.fromValue(value_0),
      isCertified: _descriptor_3.fromValue(value_0),
      isEthical: _descriptor_3.fromValue(value_0),
      certExpiry: _descriptor_1.fromValue(value_0),
      pricePaid: _descriptor_1.fromValue(value_0),
      routeCompliant: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.identityHash).concat(_descriptor_3.toValue(value_0.isCertified).concat(_descriptor_3.toValue(value_0.isEthical).concat(_descriptor_1.toValue(value_0.certExpiry).concat(_descriptor_1.toValue(value_0.pricePaid).concat(_descriptor_3.toValue(value_0.routeCompliant))))));
  }
}

const _descriptor_6 = new _Supplier_0();

const _descriptor_7 = new __compactRuntime.CompactTypeVector(8, _descriptor_6);

const _descriptor_8 = new __compactRuntime.CompactTypeVector(2, _descriptor_5);

class _Either_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_5.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_5.fromValue(value_0),
      right: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_5.toValue(value_0.left).concat(_descriptor_5.toValue(value_0.right)));
  }
}

const _descriptor_9 = new _Either_0();

const _descriptor_10 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_5.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.bytes);
  }
}

const _descriptor_11 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.companySecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named companySecretKey');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      registerProduct: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`registerProduct: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        const batchId_0 = args_1[2];
        const quantity_0 = args_1[3];
        const suppliers_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('registerProduct',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 126 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(quantity_0) === 'bigint' && quantity_0 >= 0n && quantity_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('registerProduct',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'supply-chain.compact line 126 char 1',
                                     'Uint<0..18446744073709551616>',
                                     quantity_0)
        }
        if (!(Array.isArray(suppliers_0) && suppliers_0.length === 8 && suppliers_0.every((t) => typeof(t) === 'object' && t.identityHash.buffer instanceof ArrayBuffer && t.identityHash.BYTES_PER_ELEMENT === 1 && t.identityHash.length === 32 && typeof(t.isCertified) === 'boolean' && typeof(t.isEthical) === 'boolean' && typeof(t.certExpiry) === 'bigint' && t.certExpiry >= 0n && t.certExpiry <= 18446744073709551615n && typeof(t.pricePaid) === 'bigint' && t.pricePaid >= 0n && t.pricePaid <= 18446744073709551615n && typeof(t.routeCompliant) === 'boolean'))) {
          __compactRuntime.typeError('registerProduct',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'supply-chain.compact line 126 char 1',
                                     'Vector<8, struct Supplier<identityHash: Bytes<32>, isCertified: Boolean, isEthical: Boolean, certExpiry: Uint<0..18446744073709551616>, pricePaid: Uint<0..18446744073709551616>, routeCompliant: Boolean>>',
                                     suppliers_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0).concat(_descriptor_0.toValue(batchId_0).concat(_descriptor_1.toValue(quantity_0).concat(_descriptor_7.toValue(suppliers_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_7.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._registerProduct_0(context,
                                                 partialProofData,
                                                 productId_0,
                                                 batchId_0,
                                                 quantity_0,
                                                 suppliers_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      recertifyProduct: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`recertifyProduct: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        const minExpiry_0 = args_1[2];
        const suppliers_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('recertifyProduct',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 155 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(minExpiry_0) === 'bigint' && minExpiry_0 >= 0n && minExpiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('recertifyProduct',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'supply-chain.compact line 155 char 1',
                                     'Uint<0..18446744073709551616>',
                                     minExpiry_0)
        }
        if (!(Array.isArray(suppliers_0) && suppliers_0.length === 8 && suppliers_0.every((t) => typeof(t) === 'object' && t.identityHash.buffer instanceof ArrayBuffer && t.identityHash.BYTES_PER_ELEMENT === 1 && t.identityHash.length === 32 && typeof(t.isCertified) === 'boolean' && typeof(t.isEthical) === 'boolean' && typeof(t.certExpiry) === 'bigint' && t.certExpiry >= 0n && t.certExpiry <= 18446744073709551615n && typeof(t.pricePaid) === 'bigint' && t.pricePaid >= 0n && t.pricePaid <= 18446744073709551615n && typeof(t.routeCompliant) === 'boolean'))) {
          __compactRuntime.typeError('recertifyProduct',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'supply-chain.compact line 155 char 1',
                                     'Vector<8, struct Supplier<identityHash: Bytes<32>, isCertified: Boolean, isEthical: Boolean, certExpiry: Uint<0..18446744073709551616>, pricePaid: Uint<0..18446744073709551616>, routeCompliant: Boolean>>',
                                     suppliers_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0).concat(_descriptor_1.toValue(minExpiry_0).concat(_descriptor_7.toValue(suppliers_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_7.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._recertifyProduct_0(context,
                                                  partialProofData,
                                                  productId_0,
                                                  minExpiry_0,
                                                  suppliers_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      proveFairPricing: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`proveFairPricing: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        const fairFloor_0 = args_1[2];
        const suppliers_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('proveFairPricing',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 186 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(fairFloor_0) === 'bigint' && fairFloor_0 >= 0n && fairFloor_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('proveFairPricing',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'supply-chain.compact line 186 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fairFloor_0)
        }
        if (!(Array.isArray(suppliers_0) && suppliers_0.length === 8 && suppliers_0.every((t) => typeof(t) === 'object' && t.identityHash.buffer instanceof ArrayBuffer && t.identityHash.BYTES_PER_ELEMENT === 1 && t.identityHash.length === 32 && typeof(t.isCertified) === 'boolean' && typeof(t.isEthical) === 'boolean' && typeof(t.certExpiry) === 'bigint' && t.certExpiry >= 0n && t.certExpiry <= 18446744073709551615n && typeof(t.pricePaid) === 'bigint' && t.pricePaid >= 0n && t.pricePaid <= 18446744073709551615n && typeof(t.routeCompliant) === 'boolean'))) {
          __compactRuntime.typeError('proveFairPricing',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'supply-chain.compact line 186 char 1',
                                     'Vector<8, struct Supplier<identityHash: Bytes<32>, isCertified: Boolean, isEthical: Boolean, certExpiry: Uint<0..18446744073709551616>, pricePaid: Uint<0..18446744073709551616>, routeCompliant: Boolean>>',
                                     suppliers_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0).concat(_descriptor_1.toValue(fairFloor_0).concat(_descriptor_7.toValue(suppliers_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_7.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._proveFairPricing_0(context,
                                                  partialProofData,
                                                  productId_0,
                                                  fairFloor_0,
                                                  suppliers_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      shipProduct: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`shipProduct: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        const suppliers_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('shipProduct',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 210 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(Array.isArray(suppliers_0) && suppliers_0.length === 8 && suppliers_0.every((t) => typeof(t) === 'object' && t.identityHash.buffer instanceof ArrayBuffer && t.identityHash.BYTES_PER_ELEMENT === 1 && t.identityHash.length === 32 && typeof(t.isCertified) === 'boolean' && typeof(t.isEthical) === 'boolean' && typeof(t.certExpiry) === 'bigint' && t.certExpiry >= 0n && t.certExpiry <= 18446744073709551615n && typeof(t.pricePaid) === 'bigint' && t.pricePaid >= 0n && t.pricePaid <= 18446744073709551615n && typeof(t.routeCompliant) === 'boolean'))) {
          __compactRuntime.typeError('shipProduct',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'supply-chain.compact line 210 char 1',
                                     'Vector<8, struct Supplier<identityHash: Bytes<32>, isCertified: Boolean, isEthical: Boolean, certExpiry: Uint<0..18446744073709551616>, pricePaid: Uint<0..18446744073709551616>, routeCompliant: Boolean>>',
                                     suppliers_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0).concat(_descriptor_7.toValue(suppliers_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_7.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._shipProduct_0(context,
                                             partialProofData,
                                             productId_0,
                                             suppliers_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      deliverProduct: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`deliverProduct: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        const quantityDelivered_0 = args_1[2];
        const suppliers_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('deliverProduct',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 240 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(quantityDelivered_0) === 'bigint' && quantityDelivered_0 >= 0n && quantityDelivered_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('deliverProduct',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'supply-chain.compact line 240 char 1',
                                     'Uint<0..18446744073709551616>',
                                     quantityDelivered_0)
        }
        if (!(Array.isArray(suppliers_0) && suppliers_0.length === 8 && suppliers_0.every((t) => typeof(t) === 'object' && t.identityHash.buffer instanceof ArrayBuffer && t.identityHash.BYTES_PER_ELEMENT === 1 && t.identityHash.length === 32 && typeof(t.isCertified) === 'boolean' && typeof(t.isEthical) === 'boolean' && typeof(t.certExpiry) === 'bigint' && t.certExpiry >= 0n && t.certExpiry <= 18446744073709551615n && typeof(t.pricePaid) === 'bigint' && t.pricePaid >= 0n && t.pricePaid <= 18446744073709551615n && typeof(t.routeCompliant) === 'boolean'))) {
          __compactRuntime.typeError('deliverProduct',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'supply-chain.compact line 240 char 1',
                                     'Vector<8, struct Supplier<identityHash: Bytes<32>, isCertified: Boolean, isEthical: Boolean, certExpiry: Uint<0..18446744073709551616>, pricePaid: Uint<0..18446744073709551616>, routeCompliant: Boolean>>',
                                     suppliers_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0).concat(_descriptor_1.toValue(quantityDelivered_0).concat(_descriptor_7.toValue(suppliers_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_7.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._deliverProduct_0(context,
                                                partialProofData,
                                                productId_0,
                                                quantityDelivered_0,
                                                suppliers_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      withdrawClaim: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`withdrawClaim: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const productId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('withdrawClaim',
                                     'argument 1 (as invoked from Typescript)',
                                     'supply-chain.compact line 271 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(productId_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._withdrawClaim_0(context,
                                               partialProofData,
                                               productId_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      registerProduct: this.circuits.registerProduct,
      recertifyProduct: this.circuits.recertifyProduct,
      proveFairPricing: this.circuits.proveFairPricing,
      shipProduct: this.circuits.shipProduct,
      deliverProduct: this.circuits.deliverProduct,
      withdrawClaim: this.circuits.withdrawClaim
    };
    this.provableCircuits = {
      registerProduct: this.circuits.registerProduct,
      recertifyProduct: this.circuits.recertifyProduct,
      proveFairPricing: this.circuits.proveFairPricing,
      shipProduct: this.circuits.shipProduct,
      deliverProduct: this.circuits.deliverProduct,
      withdrawClaim: this.circuits.withdrawClaim
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const ownerSk_0 = args_0[1];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(ownerSk_0.buffer instanceof ArrayBuffer && ownerSk_0.BYTES_PER_ELEMENT === 1 && ownerSk_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'supply-chain.compact line 117 char 1',
                                 'Bytes<32>',
                                 ownerSk_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('registerProduct', new __compactRuntime.ContractOperation());
    state_0.setOperation('recertifyProduct', new __compactRuntime.ContractOperation());
    state_0.setOperation('proveFairPricing', new __compactRuntime.ContractOperation());
    state_0.setOperation('shipProduct', new __compactRuntime.ContractOperation());
    state_0.setOperation('deliverProduct', new __compactRuntime.ContractOperation());
    state_0.setOperation('withdrawClaim', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(1n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = this._publicKey_0(ownerSk_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(1n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _publicKey_0(sk_0) {
    return this._persistentHash_0([new Uint8Array([115, 117, 112, 112, 108, 121, 45, 99, 104, 97, 105, 110, 58, 99, 111, 109, 112, 97, 110, 121, 58, 112, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
  _companySecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.companySecretKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('companySecretKey',
                                 'return value',
                                 'supply-chain.compact line 103 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_5.toValue(result_0),
      alignment: _descriptor_5.alignment()
    });
    return result_0;
  }
  _scoreOf_0(certified_0, ethical_0, routes_0, fair_0) {
    const score_0 = (certified_0 ? 30n : 0n) + (ethical_0 ? 30n : 0n)
                    +
                    (routes_0 ? 20n : 0n)
                    +
                    (fair_0 ? 20n : 0n);
    return score_0;
  }
  _registerProduct_0(context,
                     partialProofData,
                     productId_0,
                     batchId_0,
                     quantity_0,
                     suppliers_0)
  {
    __compactRuntime.assert(!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(0n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Product already registered');
    const certified_0 = this._folder_0(context,
                                       partialProofData,
                                       ((context, partialProofData, acc_0, s_0) =>
                                        {
                                          return acc_0 && s_0.isCertified;
                                        }),
                                       true,
                                       suppliers_0);
    const ethical_0 = this._folder_1(context,
                                     partialProofData,
                                     ((context, partialProofData, acc_1, s_1) =>
                                      {
                                        return acc_1 && s_1.isEthical;
                                      }),
                                     true,
                                     suppliers_0);
    const routes_0 = this._folder_2(context,
                                    partialProofData,
                                    ((context, partialProofData, acc_2, s_2) =>
                                     {
                                       return acc_2 && s_2.routeCompliant;
                                     }),
                                    true,
                                    suppliers_0);
    const count_0 = this._folder_3(context,
                                   partialProofData,
                                   ((context, partialProofData, acc_3, s_3) =>
                                    {
                                      return __compactRuntime.addField(acc_3,
                                                                       s_3.isCertified
                                                                       ?
                                                                       1n :
                                                                       0n);
                                    }),
                                   0n,
                                   suppliers_0);
    __compactRuntime.assert(certified_0, 'Not all suppliers are certified');
    __compactRuntime.assert(ethical_0,
                            'Not all suppliers meet ethical sourcing rules');
    __compactRuntime.assert(routes_0, 'Not all logistics routes are compliant');
    const tmp_0 = { batchId: batchId_0,
                    quantity: quantity_0,
                    stage: 1n,
                    isEthical: ethical_0,
                    allCertified: certified_0,
                    certifiedCount:
                      ((t1) => {
                        if (t1 > 255n) {
                          throw new __compactRuntime.CompactError('supply-chain.compact line 141 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                        }
                        return t1;
                      })(count_0),
                    allRoutesCompliant: routes_0,
                    fairFloor: 0n,
                    fairPricing: false,
                    auditCount: 0n,
                    complianceScore:
                      this._scoreOf_0(certified_0, ethical_0, routes_0, false) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _recertifyProduct_0(context,
                      partialProofData,
                      productId_0,
                      minExpiry_0,
                      suppliers_0)
  {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(0n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Product is not registered');
    const certified_0 = this._folder_4(context,
                                       partialProofData,
                                       ((context, partialProofData, acc_0, s_0) =>
                                        {
                                          return acc_0 && s_0.isCertified;
                                        }),
                                       true,
                                       suppliers_0);
    const ethical_0 = this._folder_5(context,
                                     partialProofData,
                                     ((context, partialProofData, acc_1, s_1) =>
                                      {
                                        return acc_1 && s_1.isEthical;
                                      }),
                                     true,
                                     suppliers_0);
    const routes_0 = this._folder_6(context,
                                    partialProofData,
                                    ((context, partialProofData, acc_2, s_2) =>
                                     {
                                       return acc_2 && s_2.routeCompliant;
                                     }),
                                    true,
                                    suppliers_0);
    const count_0 = this._folder_7(context,
                                   partialProofData,
                                   ((context, partialProofData, acc_3, s_3) =>
                                    {
                                      return __compactRuntime.addField(acc_3,
                                                                       s_3.isCertified
                                                                       ?
                                                                       1n :
                                                                       0n);
                                    }),
                                   0n,
                                   suppliers_0);
    const notExpired_0 = this._folder_8(context,
                                        partialProofData,
                                        ((context, partialProofData, acc_4, s_4) =>
                                         {
                                           let t_0;
                                           return acc_4
                                                  &&
                                                  (t_0 = s_4.certExpiry,
                                                   t_0 >= minExpiry_0);
                                         }),
                                        true,
                                        suppliers_0);
    __compactRuntime.assert(certified_0, 'Not all suppliers are certified');
    __compactRuntime.assert(ethical_0,
                            'Not all suppliers meet ethical sourcing rules');
    __compactRuntime.assert(routes_0, 'Not all logistics routes are compliant');
    __compactRuntime.assert(notExpired_0,
                            'A supplier certificate expires before the policy threshold');
    const record_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(0n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(productId_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    const tmp_0 = { batchId: record_0.batchId,
                    quantity: record_0.quantity,
                    stage: record_0.stage,
                    isEthical: ethical_0,
                    allCertified: certified_0,
                    certifiedCount:
                      ((t1) => {
                        if (t1 > 255n) {
                          throw new __compactRuntime.CompactError('supply-chain.compact line 173 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                        }
                        return t1;
                      })(count_0),
                    allRoutesCompliant: routes_0,
                    fairFloor: record_0.fairFloor,
                    fairPricing: record_0.fairPricing,
                    auditCount:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('supply-chain.compact line 177 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(record_0.auditCount + 1n),
                    complianceScore:
                      this._scoreOf_0(certified_0,
                                      ethical_0,
                                      routes_0,
                                      record_0.fairPricing) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _proveFairPricing_0(context,
                      partialProofData,
                      productId_0,
                      fairFloor_0,
                      suppliers_0)
  {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(0n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Product is not registered');
    const fair_0 = this._folder_9(context,
                                  partialProofData,
                                  ((context, partialProofData, acc_0, s_0) =>
                                   {
                                     let t_0;
                                     return acc_0
                                            &&
                                            (t_0 = s_0.pricePaid,
                                             t_0 >= fairFloor_0);
                                   }),
                                  true,
                                  suppliers_0);
    __compactRuntime.assert(fair_0,
                            'Not every supplier is paid at least the fair-trade floor');
    const record_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(0n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(productId_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    const tmp_0 = { batchId: record_0.batchId,
                    quantity: record_0.quantity,
                    stage: record_0.stage,
                    isEthical: record_0.isEthical,
                    allCertified: record_0.allCertified,
                    certifiedCount: record_0.certifiedCount,
                    allRoutesCompliant: record_0.allRoutesCompliant,
                    fairFloor: fairFloor_0,
                    fairPricing: fair_0,
                    auditCount: record_0.auditCount,
                    complianceScore:
                      this._scoreOf_0(record_0.allCertified,
                                      record_0.isEthical,
                                      record_0.allRoutesCompliant,
                                      fair_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _shipProduct_0(context, partialProofData, productId_0, suppliers_0) {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(0n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Product is not registered');
    const record_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(0n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(productId_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(this._equal_0(record_0.stage, 1n),
                            'Product is not in MANUFACTURED stage');
    const certified_0 = this._folder_10(context,
                                        partialProofData,
                                        ((context, partialProofData, acc_0, s_0) =>
                                         {
                                           return acc_0 && s_0.isCertified;
                                         }),
                                        true,
                                        suppliers_0);
    const ethical_0 = this._folder_11(context,
                                      partialProofData,
                                      ((context, partialProofData, acc_1, s_1) =>
                                       {
                                         return acc_1 && s_1.isEthical;
                                       }),
                                      true,
                                      suppliers_0);
    const routes_0 = this._folder_12(context,
                                     partialProofData,
                                     ((context, partialProofData, acc_2, s_2) =>
                                      {
                                        return acc_2 && s_2.routeCompliant;
                                      }),
                                     true,
                                     suppliers_0);
    const count_0 = this._folder_13(context,
                                    partialProofData,
                                    ((context, partialProofData, acc_3, s_3) =>
                                     {
                                       return __compactRuntime.addField(acc_3,
                                                                        s_3.isCertified
                                                                        ?
                                                                        1n :
                                                                        0n);
                                     }),
                                    0n,
                                    suppliers_0);
    __compactRuntime.assert(certified_0, 'Not all suppliers are certified');
    __compactRuntime.assert(ethical_0,
                            'Not all suppliers meet ethical sourcing rules');
    __compactRuntime.assert(routes_0, 'Not all logistics routes are compliant');
    const tmp_0 = { batchId: record_0.batchId,
                    quantity: record_0.quantity,
                    stage: 2n,
                    isEthical: ethical_0,
                    allCertified: certified_0,
                    certifiedCount:
                      ((t1) => {
                        if (t1 > 255n) {
                          throw new __compactRuntime.CompactError('supply-chain.compact line 227 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                        }
                        return t1;
                      })(count_0),
                    allRoutesCompliant: routes_0,
                    fairFloor: record_0.fairFloor,
                    fairPricing: record_0.fairPricing,
                    auditCount: record_0.auditCount,
                    complianceScore:
                      this._scoreOf_0(certified_0,
                                      ethical_0,
                                      routes_0,
                                      record_0.fairPricing) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _deliverProduct_0(context,
                    partialProofData,
                    productId_0,
                    quantityDelivered_0,
                    suppliers_0)
  {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(0n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Product is not registered');
    const record_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(0n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(productId_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(this._equal_1(record_0.stage, 2n),
                            'Product is not in IN_TRANSIT stage');
    __compactRuntime.assert(quantityDelivered_0 <= record_0.quantity,
                            'Delivered quantity exceeds the committed batch');
    const certified_0 = this._folder_14(context,
                                        partialProofData,
                                        ((context, partialProofData, acc_0, s_0) =>
                                         {
                                           return acc_0 && s_0.isCertified;
                                         }),
                                        true,
                                        suppliers_0);
    const ethical_0 = this._folder_15(context,
                                      partialProofData,
                                      ((context, partialProofData, acc_1, s_1) =>
                                       {
                                         return acc_1 && s_1.isEthical;
                                       }),
                                      true,
                                      suppliers_0);
    const routes_0 = this._folder_16(context,
                                     partialProofData,
                                     ((context, partialProofData, acc_2, s_2) =>
                                      {
                                        return acc_2 && s_2.routeCompliant;
                                      }),
                                     true,
                                     suppliers_0);
    const count_0 = this._folder_17(context,
                                    partialProofData,
                                    ((context, partialProofData, acc_3, s_3) =>
                                     {
                                       return __compactRuntime.addField(acc_3,
                                                                        s_3.isCertified
                                                                        ?
                                                                        1n :
                                                                        0n);
                                     }),
                                    0n,
                                    suppliers_0);
    const fair_0 = this._folder_18(context,
                                   partialProofData,
                                   ((context, partialProofData, acc_4, s_4) =>
                                    {
                                      let t_0;
                                      return acc_4
                                             &&
                                             (t_0 = s_4.pricePaid,
                                              t_0 >= record_0.fairFloor);
                                    }),
                                   true,
                                   suppliers_0);
    __compactRuntime.assert(routes_0, 'Not all logistics routes are compliant');
    __compactRuntime.assert(fair_0,
                            'Not every supplier is paid at least the fair-trade floor');
    const tmp_0 = { batchId: record_0.batchId,
                    quantity: record_0.quantity,
                    stage: 3n,
                    isEthical: ethical_0,
                    allCertified: certified_0,
                    certifiedCount:
                      ((t1) => {
                        if (t1 > 255n) {
                          throw new __compactRuntime.CompactError('supply-chain.compact line 258 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                        }
                        return t1;
                      })(count_0),
                    allRoutesCompliant: routes_0,
                    fairFloor: record_0.fairFloor,
                    fairPricing: fair_0,
                    auditCount: record_0.auditCount,
                    complianceScore:
                      this._scoreOf_0(certified_0, ethical_0, routes_0, fair_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _withdrawClaim_0(context, partialProofData, productId_0) {
    const sk_0 = this._companySecretKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_2(this._publicKey_0(sk_0),
                                          _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_2.toValue(1n),
                                                                                                                                alignment: _descriptor_2.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Only the company can withdraw a claim');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(0n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Product is not registered');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(productId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _folder_0(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_1(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_2(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_3(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_4(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_5(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_6(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_7(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_8(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_9(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _folder_10(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_11(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_12(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_13(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _folder_14(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_15(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_16(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_17(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _folder_18(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    products: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_4.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get authority() {
      return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_2.toValue(1n),
                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  companySecretKey: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
