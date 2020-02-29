import * as ts from "typescript";

interface DocEntry {
    name?: string,
    fileName?: string,
    documentation?: string,
    type?: string,
    constructors?: DocEntry[],
    parameters?: DocEntry[],
    decorators?: DocEntry[],
    returnType?: string
};

export class Parser {

    private readonly options: ts.CompilerOptions;

    constructor(private readonly files: string[]) {
        this.options = {

        }
    }

    parseCases() {
   }
}