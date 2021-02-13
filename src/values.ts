import * as path from 'path';
import * as deepmerge from 'deepmerge';
import { Retrieval } from './retrieval';
import { Logger } from './logger';

/**
 * Environment variable for additional values
 */
const PLY_VALUES = 'PLY_VALUES';

export class Values {
    constructor(
        private readonly locations: string[],
        private readonly logger: Logger
    ) { }

    async read(): Promise<any> {
        let values = {};
        for (const location of this.locations) {
            const contents = await new Retrieval(location).read();
            if (contents) {
                try {
                    const obj = JSON.parse(contents);
                    values = deepmerge(values, obj);
                } catch (err) {
                    throw new Error(`Cannot parse values file: ${location} (${err.message})`);
                }
            } else {
                this.logger.debug(`Values file not found: ${path.normalize(path.resolve(location))}`);
            }
        }
        this.logger.debug('Values (excluding PLY_VALUES env var)', values);
        const envValues = process.env[PLY_VALUES];
        if (envValues) {
            try {
                const obj = JSON.parse(envValues);
                values = deepmerge(values, obj);
            } catch (err) {
                throw new Error(`Cannot parse ${PLY_VALUES} (${err.message})`);
            }
        }
        return values;
    }
}