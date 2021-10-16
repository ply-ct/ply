import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as glob from 'glob';

export type Args = { [key: string]: string | number | boolean };

export interface Decorator {
    file: string;
    class: string;
    method?: string;
    decorator: string;
    arg?: string;
    args?: Args;
}

export class Ts {

    readonly program: ts.Program;
    readonly checker: ts.TypeChecker;

    constructor(tsConfig = 'tsconfig.json', sourcePatterns = ['src/**/*.ts']) {
        let files: string[] = [];
        for (const sourcePattern of sourcePatterns) {
            files = [...files, ...glob.sync(sourcePattern)];
        }
        const configPath = ts.findConfigFile('.', ts.sys.fileExists, tsConfig);
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json' from " + path.resolve('.'));
        }
        const configContents = fs.readFileSync(configPath).toString();
        const compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents);
        this.program = ts.createProgram(files, compilerOptions as ts.CompilerOptions);
        this.checker = this.program.getTypeChecker();
    }


    scanClassDecorators(decs: string[]): Decorator[] {
        let decorators: Decorator[] = [];
        for (const sourceFile of this.program.getSourceFiles().filter((sf) => !sf.isDeclarationFile)) {
            ts.forEachChild(sourceFile, (node) => {
                if (ts.isClassDeclaration(node) && node.name && Ts.isExported(node)) {
                    decorators = [
                        ...decorators,
                        ...this.findClassDecorators(sourceFile, node as ts.ClassDeclaration, decs)
                    ];
                }
            });
        }

        return decorators;
    }

    findClassDecorators(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration, decs: string[]): Decorator[] {
        const decorators: Decorator[] = [];
        const classSymbol = this.checker.getSymbolAtLocation(<ts.Node>classDeclaration.name);
        if (classSymbol && classDeclaration.decorators) {
            for (const decorator of classDeclaration.decorators) {
                const decoratorSymbol = this.getDecoratorSymbol(decorator);
                if (decoratorSymbol) {
                    const decoratorType = this.checker.getAliasedSymbol(decoratorSymbol).name;
                    if (decs.includes(decoratorType)) {
                        decorators.push({
                            file: sourceFile.fileName,
                            class: classSymbol.name,
                            decorator: decoratorType,
                            ...Ts.decoratorArgs(decorator)
                        });
                    }
                }
            }
        }
        return decorators;
    }

    findMethodDecorators(classDecorator: Decorator, decs: string[]): Decorator[] {
        const decorators: Decorator[] = [];
        const classDeclaration = this.getClassDeclaration(classDecorator.file, classDecorator.class);
        if (classDeclaration) {
            for (const methodDeclaration of Ts.methodDeclarations(classDeclaration)) {
                const methodSymbol = this.checker.getSymbolAtLocation(<ts.Node>methodDeclaration.name);
                if (methodSymbol && methodDeclaration.decorators) {
                    for (const decorator of methodDeclaration.decorators) {
                        const decoratorSymbol = this.getDecoratorSymbol(decorator);
                        if (decoratorSymbol) {
                            const decoratorType = this.checker.getAliasedSymbol(decoratorSymbol).name;
                            if (decs.includes(decoratorType)) {
                                decorators.push({
                                    file: classDecorator.file,
                                    class: classDecorator.class,
                                    decorator: decoratorType,
                                    method: methodSymbol.name,
                                    ...Ts.decoratorArgs(decorator)
                                });
                            }
                        }
                    }
                }
            }
        }

        return decorators;
    }

    getClassDeclaration(file: string, className: string): ts.ClassDeclaration | undefined {
        const sourceFile = this.program.getSourceFile(file);
        if (sourceFile) {
            let classDeclaration: ts.ClassDeclaration | undefined;
            ts.forEachChild(sourceFile, (node) => {
                if (ts.isClassDeclaration(node) && node.name && Ts.isExported(node)) {
                    const classDecl = node as ts.ClassDeclaration;
                    const classSymbol = this.checker.getSymbolAtLocation(<ts.Node>classDecl.name);
                    if (classSymbol?.name === className) {
                        classDeclaration = classDecl;
                    }
                }
            });
            return classDeclaration;
        }
    }

    getDecoratorSymbol(decorator: ts.Decorator): ts.Symbol | undefined {
        if (decorator.expression) {
            const firstToken = decorator.expression.getFirstToken();
            if (firstToken) {
                return this.checker.getSymbolAtLocation(firstToken);
            }
            else {
                return this.checker.getSymbolAtLocation(decorator.expression);
            }
        }
    }

    static decoratorArgs(decorator: ts.Decorator): { arg?: string, args?: Args, } {
        const args: { arg?: string, args?: Args, } = {};
        if (decorator.expression.getChildCount() >= 3) {
            let text = decorator.expression.getChildAt(2).getText().trim();
            if (
                decorator.expression.getChildAt(2).getChildCount() >= 3 &&
                ts.isObjectLiteralExpression(decorator.expression.getChildAt(2).getChildAt(2))
            ) {
                args.args = Ts.parseObjectLiteral(decorator.expression.getChildAt(2).getChildAt(2));
                text = decorator.expression.getChildAt(2).getChildAt(0).getText().trim();
            }
            args.arg = text.substring(1, text.length - 1);
        }
        return args;
    }

    static methodDeclarations(classDeclaration: ts.ClassDeclaration): ts.MethodDeclaration[] {
        const methodDeclaration: ts.MethodDeclaration[] = [];
        classDeclaration.forEachChild((node) => {
            if (ts.isMethodDeclaration(node) && !ts.isPrivateIdentifier(node)) {
                methodDeclaration.push(node);
            }
        });
        return methodDeclaration;
    }

    static symbolAtNode(node: ts.Node): ts.Symbol | undefined {
        return (node as any).symbol;
    }

    static isExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }

    /**
     * Only handles simple types
     */
    static parseObjectLiteral(objLit: any): Args {
        const res: Args = {};
        for (const prop of objLit.properties) {
            const propName = prop.name?.getText();
            if (propName && (prop as any).initializer) {
                if ((prop as any).initializer.text) {
                    res[propName] = (prop as any).initializer.text;
                } else {
                    const textVal = (prop as any).initializer.getText();
                    if (textVal === 'true' || textVal === 'false') {
                        res[propName] = textVal === 'true';
                    } else if (parseInt(textVal)) {
                        res[propName] = parseInt(textVal);
                    }
                }
            }
        }
        return res;
    }
}


