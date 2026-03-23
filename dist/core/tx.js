import { bytesToBase64, encodeUInt32LE } from "../internal/bytes.js";
import { sha256Bytes } from "../compat/hashes.js";
import { H160, H256 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryWriter, serialize } from "./serializing.js";
import { Witness, WitnessScope, witnessScopeName } from "./witness.js";
import { WitnessRule } from "./witness-rule.js";
function sha256(data) {
    return sha256Bytes(data);
}
export class Signer {
    account;
    scopes;
    allowedContracts;
    allowedGroups;
    rules;
    constructor({ account, scopes, allowedContracts = [], allowedGroups = [], rules = [], }) {
        this.account = typeof account === "string" ? new H160(account) : account;
        this.scopes = scopes;
        this.allowedContracts = allowedContracts.map((contract) => typeof contract === "string" ? new H160(contract) : contract);
        this.allowedGroups = allowedGroups.map((group) => (typeof group === "string" ? new PublicKey(group) : group));
        this.rules = rules;
    }
    toJSON() {
        return {
            account: this.account.toString(),
            scopes: witnessScopeName(this.scopes),
            allowedcontracts: this.allowedContracts.map((contract) => contract.toString()),
            allowedgroups: this.allowedGroups.map((group) => group.toString()),
            rules: this.rules.map((rule) => rule.toJSON()),
        };
    }
    marshalTo(writer) {
        this.account.marshalTo(writer);
        writer.writeUInt8(this.scopes);
        if (this.scopes & WitnessScope.CustomContracts) {
            writer.writeMultiple(this.allowedContracts);
        }
        if (this.scopes & WitnessScope.CustomGroups) {
            writer.writeMultiple(this.allowedGroups);
        }
        if (this.scopes & WitnessScope.WitnessRules) {
            writer.writeMultiple(this.rules);
        }
    }
    static unmarshalFrom(reader) {
        const account = H160.unmarshalFrom(reader);
        const scopes = reader.readUInt8();
        const allowedContracts = scopes & WitnessScope.CustomContracts ? reader.readMultiple(H160) : [];
        const allowedGroups = scopes & WitnessScope.CustomGroups ? reader.readMultiple(PublicKey) : [];
        const rules = scopes & WitnessScope.WitnessRules ? reader.readMultiple(WitnessRule) : [];
        return new Signer({ account, scopes, allowedContracts, allowedGroups, rules });
    }
}
export var TxAttributeType;
(function (TxAttributeType) {
    TxAttributeType[TxAttributeType["HighPriority"] = 1] = "HighPriority";
    TxAttributeType[TxAttributeType["OracleResponse"] = 17] = "OracleResponse";
    TxAttributeType[TxAttributeType["NotValidBefore"] = 32] = "NotValidBefore";
    TxAttributeType[TxAttributeType["Conflicts"] = 33] = "Conflicts";
    TxAttributeType[TxAttributeType["NotaryAssisted"] = 34] = "NotaryAssisted";
})(TxAttributeType || (TxAttributeType = {}));
export var OracleResponseCode;
(function (OracleResponseCode) {
    OracleResponseCode[OracleResponseCode["Success"] = 0] = "Success";
    OracleResponseCode[OracleResponseCode["ProtocolNotSupported"] = 16] = "ProtocolNotSupported";
    OracleResponseCode[OracleResponseCode["ConsensusUnreachable"] = 18] = "ConsensusUnreachable";
    OracleResponseCode[OracleResponseCode["NotFound"] = 20] = "NotFound";
    OracleResponseCode[OracleResponseCode["Timeout"] = 22] = "Timeout";
    OracleResponseCode[OracleResponseCode["Forbidden"] = 24] = "Forbidden";
    OracleResponseCode[OracleResponseCode["ResponseTooLarge"] = 26] = "ResponseTooLarge";
    OracleResponseCode[OracleResponseCode["InsufficientFunds"] = 28] = "InsufficientFunds";
    OracleResponseCode[OracleResponseCode["ContentTypeNotSupported"] = 31] = "ContentTypeNotSupported";
    OracleResponseCode[OracleResponseCode["Error"] = 255] = "Error";
})(OracleResponseCode || (OracleResponseCode = {}));
export class TxAttribute {
    type;
    constructor(type) {
        this.type = type;
    }
    marshalTo(writer) {
        writer.writeUInt8(this.type);
    }
    static unmarshalFrom(reader) {
        const type = reader.readUInt8();
        switch (type) {
            case TxAttributeType.HighPriority:
                return new HighPriorityAttribute();
            case TxAttributeType.OracleResponse:
                return new OracleResponseAttribute(reader.readUInt64LE(), reader.readUInt8(), reader.readVarBytes());
            case TxAttributeType.NotValidBefore:
                return new NotValidBeforeAttribute(reader.readUInt32LE());
            case TxAttributeType.Conflicts:
                return new ConflictsAttribute(H256.unmarshalFrom(reader));
            case TxAttributeType.NotaryAssisted:
                return new NotaryAssistedAttribute(reader.readUInt8());
            default:
                throw new Error(`unexpected TxAttributeType: ${type}`);
        }
    }
    toJSON() {
        return { type: TxAttributeType[this.type] };
    }
}
export class HighPriorityAttribute extends TxAttribute {
    constructor() {
        super(TxAttributeType.HighPriority);
    }
    toJSON() {
        return { type: "HighPriority" };
    }
}
export class OracleResponseAttribute extends TxAttribute {
    id;
    code;
    result;
    constructor(id, code, result) {
        super(TxAttributeType.OracleResponse);
        this.id = id;
        this.code = code;
        this.result = result;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeUInt64LE(this.id);
        writer.writeUInt8(this.code);
        writer.writeVarBytes(this.result);
    }
    toJSON() {
        return {
            type: "OracleResponse",
            id: this.id.toString(),
            code: OracleResponseCode[this.code],
            result: bytesToBase64(this.result),
        };
    }
}
export class NotValidBeforeAttribute extends TxAttribute {
    height;
    constructor(height) {
        super(TxAttributeType.NotValidBefore);
        this.height = height;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeUInt32LE(this.height);
    }
    toJSON() {
        return { type: "NotValidBefore", height: this.height };
    }
}
export class ConflictsAttribute extends TxAttribute {
    hash;
    constructor(hash) {
        super(TxAttributeType.Conflicts);
        this.hash = hash;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.hash.marshalTo(writer);
    }
    toJSON() {
        return { type: "Conflicts", hash: this.hash.toString() };
    }
}
export class NotaryAssistedAttribute extends TxAttribute {
    nKeys;
    constructor(nKeys) {
        super(TxAttributeType.NotaryAssisted);
        this.nKeys = nKeys;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeUInt8(this.nKeys);
    }
    toJSON() {
        return { type: "NotaryAssisted", nkeys: this.nKeys };
    }
}
export class Tx {
    version = 0;
    nonce;
    systemFee;
    networkFee;
    validUntilBlock;
    script;
    signers;
    attributes;
    witnesses;
    constructor({ nonce, systemFee, networkFee, validUntilBlock, script, signers = [], witnesses = [], attributes = [], }) {
        this.nonce = nonce;
        this.systemFee = BigInt(systemFee);
        this.networkFee = BigInt(networkFee);
        this.validUntilBlock = validUntilBlock;
        this.script = script;
        this.signers = signers;
        this.attributes = attributes;
        this.witnesses = witnesses;
    }
    getSignData(networkId) {
        const writer = new BinaryWriter();
        this.marshalUnsignedTo(writer);
        const digest = sha256(writer.toBytes());
        return new Uint8Array([...encodeUInt32LE(networkId), ...digest]);
    }
    marshalUnsignedTo(writer) {
        writer.writeUInt8(this.version);
        writer.writeUInt32LE(this.nonce);
        writer.writeUInt64LE(this.systemFee);
        writer.writeUInt64LE(this.networkFee);
        writer.writeUInt32LE(this.validUntilBlock);
        writer.writeMultiple(this.signers);
        writer.writeMultiple(this.attributes);
        writer.writeVarBytes(this.script);
    }
    marshalTo(writer) {
        this.marshalUnsignedTo(writer);
        writer.writeMultiple(this.witnesses);
    }
    static unmarshalFrom(reader) {
        const version = reader.readUInt8();
        if (version !== 0) {
            throw new Error(`unexpected tx version: ${version}`);
        }
        return new Tx({
            nonce: reader.readUInt32LE(),
            systemFee: reader.readUInt64LE(),
            networkFee: reader.readUInt64LE(),
            validUntilBlock: reader.readUInt32LE(),
            signers: reader.readMultiple(Signer),
            attributes: reader.readMultiple(TxAttribute),
            script: reader.readVarBytes(),
            witnesses: reader.readMultiple(Witness),
        });
    }
    static unmarshalUnsignedFrom(reader) {
        const version = reader.readUInt8();
        if (version !== 0) {
            throw new Error(`unexpected tx version: ${version}`);
        }
        return new Tx({
            nonce: reader.readUInt32LE(),
            systemFee: reader.readUInt64LE(),
            networkFee: reader.readUInt64LE(),
            validUntilBlock: reader.readUInt32LE(),
            signers: reader.readMultiple(Signer),
            attributes: reader.readMultiple(TxAttribute),
            script: reader.readVarBytes(),
        });
    }
    toBytes() {
        return serialize(this);
    }
    toJSON() {
        return {
            version: this.version,
            nonce: this.nonce,
            sysfee: this.systemFee.toString(),
            netfee: this.networkFee.toString(),
            validuntilblock: this.validUntilBlock,
            script: bytesToBase64(this.script),
            signers: this.signers.map((signer) => signer.toJSON()),
            attributes: this.attributes.map((attribute) => attribute.toJSON()),
            witnesses: this.witnesses.map((witness) => witness.toJSON()),
        };
    }
}
