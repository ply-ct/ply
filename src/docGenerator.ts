import * as ts from "typescript";

interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: string;
    constructors?: DocEntry[];
    parameters?: DocEntry[];
    returnType?: string;
    decorators?: DocEntry[];
}

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(
    fileNames: string[],
    options: ts.CompilerOptions
): void {
    // Build a program using the set of root file names in fileNames
    let program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();
    let output: DocEntry[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
    }

    // print out the doc
    console.log("CLASSES: " + JSON.stringify(output, undefined, 2));

    return;

    /** visit nodes finding exported classes */
    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (ts.isClassDeclaration(node) && node.name) {
            // This is a top level class, get its symbol
            let symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                output.push(serializeClass(node, symbol));
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Serialize a symbol into a json object */
    function serializeSymbol(symbol: ts.Symbol): DocEntry {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
            type: checker.typeToString(
                checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
            )
        };
    }

    /** Serialize a class symbol information */
    function serializeClass(node: ts.Node, symbol: ts.Symbol) {
        let details = serializeSymbol(symbol);

        if (node.decorators) {
            let decorators = node.decorators.map(serializeDecorator);
            if (decorators) {
                details.decorators = <DocEntry[]>decorators;
            }
        }

        // Get the construct signatures
        let constructorType = checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration!
        );
        details.constructors = constructorType
            .getConstructSignatures()
            .map(serializeSignature);



        return details;
    }

    function serializeDecorator(decorator: ts.Decorator) {
        if (decorator.expression) {
            const firstToken = decorator.expression.getFirstToken();
            if (firstToken) {
                let symbol = checker.getSymbolAtLocation(firstToken);
                if (symbol) {
                    let decoratorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                    let details = serializeSymbol(symbol);
//                     console.log("DETAILSxx: " + JSON.stringify(details, null, 2));
                    details.constructors = decoratorType.getCallSignatures().map(serializeSignature);
                    if (decorator.expression.getChildCount() >= 3) {
                        const secondChild = decorator.expression.getChildAt(2);
                        console.log("CHILD: " + secondChild.getText());
                    }
                    return details;
                }
            }
        }
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature(signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment(checker))
        };
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }
}

generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES2018,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    emitDecoratorMetadata: true
});