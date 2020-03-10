import * as ts from "typescript";
import { Case } from './case';

interface SuiteDeclaration {
    name: string;
    className: string;
    // TODO other decorator params
}

export class CaseLoader {

    program: ts.Program;
    checker: ts.TypeChecker;

    cases: Map<string,Case[]> = new Map();

    constructor(sourceFiles: string[], compilerOptions: ts.CompilerOptions) {

        this.program = ts.createProgram(sourceFiles, compilerOptions);
        this.checker = this.program.getTypeChecker();
    }


    load(): Map<string,Case> {

        for (const sourceFile of this.program.getSourceFiles()) {
            let suite = this.findSuite(sourceFile);
            if (suite) {
                console.log("SUITE: " + JSON.stringify(suite));
            }

        }

        const cases = new Map();
        return cases;
    }

    private findSuite(sourceFile: ts.SourceFile): SuiteDeclaration | undefined {
        if (!sourceFile.isDeclarationFile) {
            let suite: SuiteDeclaration | undefined;
            ts.forEachChild(sourceFile, node => {
                if (ts.isClassDeclaration(node) && node.name && this.isExported(node)) {
                    let suiteDeclaration = this.findSuiteDeclaration(node as ts.ClassDeclaration);
                    if (suiteDeclaration) {
                        if (suite) {
                            throw new Error(`Source file ${sourceFile.fileName} cannot contain more than one suite
                                    (${suite.name}, ${node.name})`);
                        }
                        suite = suiteDeclaration;
                    }
                }
            });
            return suite;
        }
    }

    private findSuiteDeclaration(classDeclaration: ts.ClassDeclaration): SuiteDeclaration | undefined {
        let classSymbol = this.checker.getSymbolAtLocation(<ts.Node>classDeclaration.name);
        if (classSymbol && classDeclaration.decorators) {
            for (const decorator of classDeclaration.decorators) {
                if (decorator.expression) {
                    const firstToken = decorator.expression.getFirstToken();
                    if (firstToken) {
                        let decoratorSymbol = this.checker.getSymbolAtLocation(firstToken);
                        if (decoratorSymbol && this.checker.getAliasedSymbol(decoratorSymbol).name === 'suite') {
                            if (decorator.expression.getChildCount() >= 3) {
                                const secondChild = decorator.expression.getChildAt(2);
                                return {
                                    name: secondChild.getText(),
                                    className: classSymbol.name
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    isExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }
}