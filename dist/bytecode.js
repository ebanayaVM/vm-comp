"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytecodeCompiler = void 0;
const Opcodes = new Map([
    ['ADD', 0],
    ['SUB', 1],
    ['MUL', 2],
    ['DIV', 3],
    ['MOD', 4],
    ['NEG', 5],
    ['STORE', 6],
    ['GET_PROPERTY', 7],
    ['SET_PROPERTY', 8],
    ['EXISTS', 9],
    ['DELETE_PROPERTY', 10],
    ['INSTANCE_OF', 11],
    ['TYPEOF', 12],
    ['CALL', 13],
    ['EQUAL', 14],
    ['NOT_EQUAL', 15],
    ['LESS_THAN', 16],
    ['LESS_THAN_EQUAL', 17],
    ['STRICT_NOT_EQUAL', 18],
    ['JMP_IF', 19],
    ['NOT', 20],
    ['PUSH', 21],
    ['POP', 22],
    ['INIT_CONSTRUCTOR', 23],
    ['INIT_ARRAY', 24],
    ['EXIT', 25],
    ['APPLY', 33],
    ['CALL_MEMBER_EXPRESSION', 34],
    ['STRICT_EQUAL', 35], // Добавьте этот опкод для обработки оператора ===
    ['NEW_XMLHTTPREQUEST', 36],
    ['OPEN', 37],
    ['CALL_XMLHTTPREQUEST', 38],
    ['XMLHTTPREQUEST_SEND', 39], // Добавьте этот опкод для обработки метода send
    ['XMLHTTPREQUEST_RESPONSETEXT', 40],
    ['FUNCTION_HEADER', 41]
]);
const Headers = new Map([
    ['string', 0],
    ['number', 1],
    ['stack', 2],
    ['variable', 3],
    ['dependency', 4],
    ['undefined', 5],
    ['array', 6],
    ['object', 7],
    ['boolean', 8], //булевые значения
    ['function', 9]
]);
class BytecodeCompiler {
    constructor(ir) {
        this.ir = ir;
        this.encryptedStrings = [];
        this.bytecode = [];
        this.lookUpTable = {};
    }
    encryptXor(text, key) {
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    longToByteArray(long) {
        // we want to represent the input as a 8-bytes array
        var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
        for (var index = 0; index < byteArray.length; index++) {
            var byte = long & 0xff;
            byteArray[index] = byte;
            long = (long - byte) / 256;
        }
        return byteArray;
    }
    ;
    makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 8; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    stringToByteArray(key) {
        var bytes = [];
        for (var i = 0; i < key.length; i++) {
            bytes.push(key.charCodeAt(i));
        }
        return bytes;
    }
    compileInstructionArgument(arg) {
        const header = Headers.get(arg.type);
        if (header == undefined) {
            console.log(arg.type);
            throw 'UNKNOWN_HEADER';
        }
        switch (arg.type) {
            case "undefined":
                return [header];
            case "object":
                return [header];
            case "array":
                return [header];
            case "string":
                var key = this.makeid();
                var keyArray = this.stringToByteArray(key);
                const encoded = this.encryptXor(arg.value, key);
                this.encryptedStrings.push(encoded);
                var stringPointer = this.longToByteArray(this.encryptedStrings.length - 1);
                return [header, ...stringPointer, ...keyArray];
            case "number":
                return [header, ...this.longToByteArray(arg.value)];
            case "stack":
                return [];
            case "variable":
                return [header, arg.value];
            case "dependency":
                return [header, arg.value];
            case "boolean": // Добавьте эту часть для обработки булевых значений
                return [header, arg.value ? 1 : 0];
            case "NEW_XMLHTTPREQUEST":
                return [header];
            case "XMLHTTPREQUEST_SEND":
                return [header, ...this.stringToByteArray(arg.value)];
            case "XMLHTTPREQUEST_RESPONSETEXT":
                return [header, ...this.stringToByteArray(arg.value)];
            case "FUNCTION_HEADER": // Добавляем обработку FUNCTION_HEADER
                return [header];
            default:
                throw 'UNKNOWN_HEADER';
        }
    }
    compileBlock(block, bytes) {
        for (var i = 0; i < block.instructions.length; i++) {
            var instruction = block.instructions[i];
            var opcode = Opcodes.get(instruction.opcode);
            if (opcode == undefined) {
                throw "UNHANDLED_OPCODE";
            }
            if (instruction.opcode == "JMP_IF") {
                var pushOpcode = Opcodes.get("PUSH");
                if (pushOpcode) {
                    bytes.push(pushOpcode);
                    bytes.push(...this.compileInstructionArgument({ type: "string", value: this.encryptXor(instruction.args[0].value, "label") }));
                }
                bytes.push(opcode);
            } else {
                bytes.push(opcode);
                for (var j = 0; j < instruction.args.length; j++) {
                    bytes.push(...this.compileInstructionArgument(instruction.args[j]));
                }
            }
        }
    }
    compile() {
        const bytes = [];
        for (const [label, block] of Object.entries(this.ir)) {
            console.log(`SET LOCATION ${label}: ${bytes.length}`);
            this.lookUpTable[this.encryptXor(label, 'label')] = bytes.length;
            this.compileBlock(block, bytes);
            var exitOpcode = Opcodes.get("EXIT");
            if (exitOpcode) {
                bytes.push(exitOpcode);
            }
        }
        this.bytecode = bytes;
        const encodedBytecode = Buffer.from(bytes).toString('base64');
        return {
            bytecode: encodedBytecode,
            encryptedStrings: this.encryptedStrings,
            lookUpTable: this.lookUpTable
        };
    }
}
exports.BytecodeCompiler = BytecodeCompiler;
