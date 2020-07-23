interface String {
    lines(): string[];
}

String.prototype.lines = function(): string[] {
    return this.split(/\r?\n/);
};