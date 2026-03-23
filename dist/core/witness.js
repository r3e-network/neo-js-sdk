import { bytesToBase64, equalBytes } from "../internal/bytes.js";
export var WitnessScope;
(function (WitnessScope) {
    WitnessScope[WitnessScope["None"] = 0] = "None";
    WitnessScope[WitnessScope["CalledByEntry"] = 1] = "CalledByEntry";
    WitnessScope[WitnessScope["CustomContracts"] = 16] = "CustomContracts";
    WitnessScope[WitnessScope["CustomGroups"] = 32] = "CustomGroups";
    WitnessScope[WitnessScope["WitnessRules"] = 64] = "WitnessRules";
    WitnessScope[WitnessScope["Global"] = 128] = "Global";
})(WitnessScope || (WitnessScope = {}));
export function witnessScopeName(scope) {
    if (scope === WitnessScope.None) {
        return "None";
    }
    const flags = [];
    if (scope & WitnessScope.CalledByEntry) {
        flags.push("CalledByEntry");
    }
    if (scope & WitnessScope.CustomContracts) {
        flags.push("CustomContracts");
    }
    if (scope & WitnessScope.CustomGroups) {
        flags.push("CustomGroups");
    }
    if (scope & WitnessScope.WitnessRules) {
        flags.push("WitnessRules");
    }
    if (scope & WitnessScope.Global) {
        flags.push("Global");
    }
    return flags.join(",");
}
export class Witness {
    invocation;
    verification;
    constructor(invocation, verification) {
        this.invocation = invocation;
        this.verification = verification;
    }
    get invocationScript() {
        return this.invocation;
    }
    get verificationScript() {
        return this.verification;
    }
    marshalTo(writer) {
        writer.writeVarBytes(this.invocation);
        writer.writeVarBytes(this.verification);
    }
    static unmarshalFrom(reader) {
        return new Witness(reader.readVarBytes(), reader.readVarBytes());
    }
    toJSON() {
        return {
            invocation: bytesToBase64(this.invocation),
            verification: bytesToBase64(this.verification),
        };
    }
    equals(other) {
        return equalBytes(this.invocation, other.invocation) && equalBytes(this.verification, other.verification);
    }
}
