import { Retrieval } from './retrieval';

export class Values {
    constructor(private readonly locations: string[]) {
    }

    async read(): Promise<any> {
        let values = {};
        for (const location of this.locations) {
            const contents = await new Retrieval(location).read();
            if (contents) {
                values = { ...values, ...JSON.parse(contents) };
            }
        }

        return values;
    }
}