import * as ts from "typescript";
import { Case } from './case';

interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: string;
    constructors?: DocEntry[];
    parameters?: DocEntry[];
    returnType?: string;
    decorators?: DocEntry[];
    decParam?: string;
}

export class CaseLoader {

    program: ts.Program;
    checker: ts.TypeChecker;
    output: DocEntry[] = [];

    constructor(sourceFiles: string[], compilerOptions: ts.CompilerOptions) {

        this.program = ts.createProgram(sourceFiles, compilerOptions);

        // Get the checker, we will use it to find more about classes
        this.checker = this.program.getTypeChecker();

    }

    load(): Map<string,Case> {

        // Visit every sourceFile in the program
        for (const sourceFile of this.program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                // Walk the tree to search for classes
                ts.forEachChild(sourceFile, node => this.visit(node));
            }
        }

        // print out the doc
        console.log("CLASSES: " + JSON.stringify(this.output, undefined, 2));



        const cases = new Map();
        return cases;
    }

    visit(node: ts.Node) {

        // Only consider exported nodes
        if (!this.isNodeExported(node)) {
            return;
        }

        if (ts.isClassDeclaration(node) && node.name) {
            // This is a top level class, get its symbol
            let symbol = this.checker.getSymbolAtLocation(node.name);
            if (symbol) {
                this.output.push(this.serializeClass(node, symbol));
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, node => this.visit(node));
        }
    }

    isNodeExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }

    serializeSymbol(symbol: ts.Symbol): DocEntry {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
            type: this.checker.typeToString(
                this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
            )
        };
    }

    serializeClass(node: ts.Node, symbol: ts.Symbol) {
        let details = this.serializeSymbol(symbol);

        if (node.decorators) {
            let decorators = node.decorators.map(this.serializeDecorator, this);
            if (decorators) {
                details.decorators = <DocEntry[]>decorators;
            }
        }

        // Get the construct signatures
        let constructorType = this.checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration!
        );
        details.constructors = constructorType
            .getConstructSignatures()
            .map(this.serializeSignature, this);



        return details;
    }

    serializeSignature(signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(this.serializeSymbol, this),
            returnType: this.checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment(this.checker))
        };
    }

    serializeDecorator(decorator: ts.Decorator) {
        if (decorator.expression) {
            const firstToken = decorator.expression.getFirstToken();
            if (firstToken) {
                let symbol = this.checker.getSymbolAtLocation(firstToken);
                if (symbol) {
                    let decoratorType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                    let details = this.serializeSymbol(symbol);
                    //                     console.log("DETAILSxx: " + JSON.stringify(details, null, 2));
                    details.constructors = decoratorType.getCallSignatures().map(this.serializeSignature, this);
                    if (decorator.expression.getChildCount() >= 3) {
                        const secondChild = decorator.expression.getChildAt(2);
                        details.decParam = secondChild.getText();
                    }
                    return details;
                }
            }
        }
    }

    // processCaseNode(node: ts.Node) {

    //     if (node.kind === ts.SyntaxKind.Decorator) {
    //         const decorator = node as ts.Decorator;
    //         this.processDecorator(decorator);
    //     }

    //     ts.forEachChild(node, child => this.processCaseNode(child));
    // }


}