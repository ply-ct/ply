import { ImportFormat, ImportOptions } from './model';
import { Retrieval } from '../retrieval';
import { Log } from '../logger';
import { Postman } from './postman';
import { Insomnia } from './insomnia';

export class Import {

    constructor(
        readonly format: ImportFormat,
        readonly root: string,
        readonly logger: Log
    ) { }

    async doImport(retrieval: Retrieval, options: ImportOptions): Promise<void> {
        switch(this.format) {
            case 'postman': {
                await new Postman(this.root, this.logger).import(retrieval, options);
                break;
            }
            case 'insomnia': {
                await new Insomnia(this.root, this.logger).import(retrieval, options);
                break;
            }
        }
    }
}

