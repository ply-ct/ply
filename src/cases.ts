import * as ts from 'typescript';
import { PlyOptions } from './options';
import { TsCompileOptions } from './compile';
import { Suite } from './suite';
import { Case, PlyCase } from './case';
import { Retrieval } from './retrieval';
import { Location } from './location';
import { Runtime } from './runtime';
import { ResultPaths } from './result';
import { Log, Logger, LogLevel } from './logger';
import { Skip } from './skip';

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
    private skip: Skip | undefined;

    constructor(
        sourceFiles: string[],
        private options: PlyOptions,
        private compileOptions: TsCompileOptions,
        private logger?: Log
    ) {
        this.program = ts.createProgram(sourceFiles, compileOptions.compilerOptions);
        this.checker = this.program.getTypeChecker();

        if (options.skip) {
            this.skip = new Skip(options.testsLocation, options.skip);
        }
    }

    async load(): Promise<Suite<Case>[]> {
        const suites: Suite<Case>[] = [];

        for (const sourceFile of this.program.getSourceFiles()) {
            const suiteDecorations = this.findSuites(sourceFile);
            if (suiteDecorations.length > 0) {
                const retrieval = new Retrieval(sourceFile.fileName);
                const suitePath = retrieval.location.relativeTo(this.options.testsLocation);

                for (const suiteDecoration of suiteDecorations) {
                    // every suite instance gets its own runtime

                    const results = await ResultPaths.create(
                        this.options,
                        retrieval,
                        suiteDecoration.name
                    );
                    const runtime = new Runtime(this.options, retrieval, results);

                    const logger =
                        this.logger ||
                        new Logger(
                            {
                                level: this.options.verbose
                                    ? LogLevel.debug
                                    : this.options.quiet
                                    ? LogLevel.error
                                    : LogLevel.info,
                                prettyIndent: this.options.prettyIndent
                            },
                            runtime.results.log
                        );

                    let outFile = this.compileOptions.outFile;
                    if (!outFile) {
                        let suiteLoc = new Location(this.options.testsLocation + '/' + suitePath);
                        if (suiteLoc.isAbsolute) {
                            suiteLoc = new Location(suiteLoc.relativeTo('.'));
                        }
                        outFile = new Location(
                            new Location(this.compileOptions.outDir).absolute +
                                '/' +
                                suiteLoc.parent +
                                '/' +
                                suiteLoc.base +
                                '.js'
                        ).path;
                    }

                    const suite = new Suite<Case>(
                        suiteDecoration.name,
                        'case',
                        suitePath,
                        runtime,
                        logger,
                        sourceFile.getLineAndCharacterOfPosition(
                            suiteDecoration.classDeclaration.getStart()
                        ).line,
                        sourceFile.getLineAndCharacterOfPosition(
                            suiteDecoration.classDeclaration.getEnd()
                        ).line,
                        suiteDecoration.className,
                        outFile
                    );

                    for (const caseDecoration of this.findCases(suiteDecoration)) {
                        const c = new PlyCase(
                            caseDecoration.name,
                            caseDecoration.methodName,
                            sourceFile.getLineAndCharacterOfPosition(
                                caseDecoration.methodDeclaration.getStart()
                            ).line,
                            sourceFile.getLineAndCharacterOfPosition(
                                caseDecoration.methodDeclaration.getEnd()
                            ).line,
                            logger
                        );
                        suite.add(c);
                    }

                    // mark if skipped
                    if (this.skip?.isSkipped(suite.path)) {
                        suite.skip = true;
                    }

                    suites.push(suite);
                }
            }
        }

        suites.sort((s1, s2) => {
            if (s1.path === s2.path) {
                // within a file suites are ordered as declared
                return 0;
            }
            return s1.name.localeCompare(s2.name);
        });
        return suites;
    }

    private findSuites(sourceFile: ts.SourceFile): SuiteDecoration[] {
        const suites: SuiteDecoration[] = [];
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, (node) => {
                if (ts.isClassDeclaration(node) && node.name && this.isExported(node)) {
                    const suiteDecoration = this.findSuiteDecoration(node as ts.ClassDeclaration);
                    if (suiteDecoration) {
                        suites.push(suiteDecoration);
                    }
                }
            });
        }
        return suites;
    }

    private findSuiteDecoration(
        classDeclaration: ts.ClassDeclaration
    ): SuiteDecoration | undefined {
        const classSymbol = this.checker.getSymbolAtLocation(<ts.Node>classDeclaration.name);
        if (classSymbol) {
            let decorators: ts.Decorator[] | undefined;
            if ((ts as any).getDecorators) {
                decorators = (ts as any).getDecorators(classDeclaration);
            } else {
                // old typescript compiler sdk incompatible
                decorators = (classDeclaration as any).decorators;
            }
            if (decorators) {
                for (const decorator of decorators) {
                    if (decorator.expression) {
                        let decoratorSymbol: ts.Symbol | undefined;
                        const firstToken = decorator.expression.getFirstToken();
                        if (firstToken) {
                            decoratorSymbol = this.checker.getSymbolAtLocation(firstToken);
                        } else {
                            decoratorSymbol = this.checker.getSymbolAtLocation(
                                decorator.expression
                            );
                        }
                        if (
                            decoratorSymbol &&
                            (decoratorSymbol.name === 'suite' ||
                                this.checker.getAliasedSymbol(decoratorSymbol).name === 'suite')
                        ) {
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
    }

    private findCases(suiteDecoration: SuiteDecoration): CaseDecoration[] {
        const cases: CaseDecoration[] = [];
        suiteDecoration.classDeclaration.forEachChild((node) => {
            if (ts.isMethodDeclaration(node) && node.name && !ts.isPrivateIdentifier(node)) {
                const caseDecoration = this.findCaseDecoration(node as ts.MethodDeclaration);
                if (caseDecoration) {
                    cases.push(caseDecoration);
                }
            }
        });
        return cases;
    }

    private findCaseDecoration(
        methodDeclaration: ts.MethodDeclaration
    ): CaseDecoration | undefined {
        const methodSymbol = this.checker.getSymbolAtLocation(<ts.Node>methodDeclaration.name);
        if (methodSymbol) {
            let decorators: ts.Decorator[] | undefined;
            if ((ts as any).getDecorators) {
                decorators = (ts as any).getDecorators(methodDeclaration);
            } else {
                // old typescript compiler sdk incompatible
                decorators = (methodDeclaration as any).decorators;
            }
            if (decorators) {
                for (const decorator of decorators) {
                    if (decorator.expression) {
                        let decoratorSymbol: ts.Symbol | undefined;
                        const firstToken = decorator.expression.getFirstToken();
                        if (firstToken) {
                            decoratorSymbol = this.checker.getSymbolAtLocation(firstToken);
                        } else {
                            decoratorSymbol = this.checker.getSymbolAtLocation(
                                decorator.expression
                            );
                        }
                        if (
                            decoratorSymbol &&
                            (decoratorSymbol.name === 'test' ||
                                this.checker.getAliasedSymbol(decoratorSymbol).name === 'test')
                        ) {
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
    }

    isExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }
}
