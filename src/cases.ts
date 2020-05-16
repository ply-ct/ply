import * as ts from 'typescript';
import * as osLocale from 'os-locale';
import { PlyOptions } from './options';
import { Suite } from './suite';
import { Case, PlyCase } from './case';
import { Retrieval } from './retrieval';
import { ResultPaths, Runtime } from './runtime';
import { Logger, LogLevel } from './logger';

interface SuiteDecoration {
    name: string;
    classDeclaration: ts.ClassDeclaration;
    className: string;
    // TODO other decorator params
}

interface CaseDecoration {
    name: string;
    methodDeclaration: ts.MethodDeclaration;
    methodName: string;
    // TODO other decorator params
}

export class CaseLoader {

    private program: ts.Program;
    private checker: ts.TypeChecker;

    constructor(
        sourceFiles: string[],
        private options: PlyOptions,
        compilerOptions: ts.CompilerOptions) {

        this.program = ts.createProgram(sourceFiles, compilerOptions);
        this.checker = this.program.getTypeChecker();
    }

    async load(): Promise<Suite<Case>[]> {

        const suites: Suite<Case>[] = [];

        for (const sourceFile of this.program.getSourceFiles()) {
            let suiteDecorations = this.findSuites(sourceFile);
            if (suiteDecorations) {
                let retrieval = new Retrieval(sourceFile.fileName);

                for (let suiteDecoration of suiteDecorations) {
                    // every suite instance gets its own runtime

                    let results = await ResultPaths.create(this.options, suiteDecoration.name, retrieval);
                    const runtime = new Runtime(
                        await osLocale(),
                        this.options,
                        retrieval,
                        results
                    );

                    let logger = new Logger({
                        level: this.options.verbose ? LogLevel.debug : LogLevel.info,
                        prettyIndent: this.options.prettyIndent
                    }, runtime.results.log);

                    let suite = new Suite<Case>(
                        suiteDecoration.name,
                        'case',
                        retrieval.location.relativeTo(this.options.testsLocation),
                        runtime,
                        logger,
                        sourceFile.getLineAndCharacterOfPosition(suiteDecoration.classDeclaration.getStart()).line,
                        sourceFile.getLineAndCharacterOfPosition(suiteDecoration.classDeclaration.getEnd()).line,
                        suiteDecoration.className
                    );

                    for (let caseDecoration of this.findCases(suiteDecoration)) {
                        let c = new PlyCase(
                            caseDecoration.name,
                            caseDecoration.methodName,
                            sourceFile.getLineAndCharacterOfPosition(caseDecoration.methodDeclaration.getStart()).line,
                            sourceFile.getLineAndCharacterOfPosition(caseDecoration.methodDeclaration.getEnd()).line,
                            logger
                        );
                        suite.add(c);
                    }
                    suites.push(suite);
                }
            }
        }

        return suites;
    }

    private findSuites(sourceFile: ts.SourceFile): SuiteDecoration[] {
        let suites: SuiteDecoration[] = [];
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, node => {
                if (ts.isClassDeclaration(node) && node.name && this.isExported(node)) {
                    let suiteDecoration = this.findSuiteDecoration(node as ts.ClassDeclaration);
                    if (suiteDecoration) {
                        suites.push(suiteDecoration);
                    }
                }
            });
        }
        return suites;
    }

    private findSuiteDecoration(classDeclaration: ts.ClassDeclaration): SuiteDecoration | undefined {
        let classSymbol = this.checker.getSymbolAtLocation(<ts.Node>classDeclaration.name);
        if (classSymbol && classDeclaration.decorators) {
            for (const decorator of classDeclaration.decorators) {
                if (decorator.expression) {
                    let decoratorSymbol: ts.Symbol | undefined;
                    const firstToken = decorator.expression.getFirstToken();
                    if (firstToken) {
                        decoratorSymbol = this.checker.getSymbolAtLocation(firstToken);
                    }
                    else {
                        decoratorSymbol = this.checker.getSymbolAtLocation(decorator.expression);
                    }
                    if (decoratorSymbol && this.checker.getAliasedSymbol(decoratorSymbol).name === 'suite') {
                        let suiteName = classSymbol.name;
                        if (decorator.expression.getChildCount() >= 3) {
                            // suite name arg
                            const text = decorator.expression.getChildAt(2).getText();
                            suiteName = text.substring(1, text.length - 1);
                        }
                        return {
                            name: suiteName,
                            classDeclaration: classDeclaration,
                            className: classSymbol.name
                        };
                    }
                }
            }
        }
    }

    private findCases(suiteDecoration: SuiteDecoration): CaseDecoration[] {
        const cases: CaseDecoration[] = [];
        suiteDecoration.classDeclaration.forEachChild(node => {
            if (ts.isMethodDeclaration(node) && node.name && !ts.isPrivateIdentifier(node)) {
                let caseDecoration = this.findCaseDecoration(node as ts.MethodDeclaration);
                if (caseDecoration) {
                    cases.push(caseDecoration);
                }
            }
        });
        return cases;
    }

    private findCaseDecoration(methodDeclaration: ts.MethodDeclaration): CaseDecoration | undefined {
        let methodSymbol = this.checker.getSymbolAtLocation(<ts.Node>methodDeclaration.name);
        if (methodSymbol && methodDeclaration.decorators) {
            for (const decorator of methodDeclaration.decorators) {
                if (decorator.expression) {
                    let decoratorSymbol: ts.Symbol | undefined;
                    const firstToken = decorator.expression.getFirstToken();
                    if (firstToken) {
                        decoratorSymbol = this.checker.getSymbolAtLocation(firstToken);
                    }
                    else {
                        decoratorSymbol = this.checker.getSymbolAtLocation(decorator.expression);
                    }
                    if (decoratorSymbol && this.checker.getAliasedSymbol(decoratorSymbol).name === 'test') {
                        let testName = methodSymbol.name;
                        if (decorator.expression.getChildCount() >= 3) {
                            const text = decorator.expression.getChildAt(2).getText();
                            testName = text.substring(1, text.length - 1);
                        }
                        return {
                            name: testName,
                            methodDeclaration: methodDeclaration,
                            methodName: methodSymbol.name
                        };
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