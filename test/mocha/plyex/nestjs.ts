import { Controller, Get, Post } from '../../../src/plyex/nestjs';
import { Logger } from '../../../src/logger';

export interface Greeting {
    salutation: string;
    name: string;
}

@Controller('greeting')
export class PlyexClass {
    private logger = new Logger();

    /**
     * Retrieve a greeting
     * @ply
     *   responses:
     *     200:
     *       - 'test/mocha/requests/retrieve-greeting.ply.yaml#getGreetingDefault'
     *       - 'test/mocha/requests/retrieve-greeting.ply.yaml#getGreetingLinus'
     */
    @Get(':name?')
    getGreeting(name: string = 'World'): Greeting {
        return { salutation: 'Hello', name };
    }

    /**
     * Create a greeting
     * Emit a greeting based on the greeting payload
     * @ply
     *   request: 'test/mocha/requests/create-greeting.ply.yaml#postGreetingGood'
     *   responses:
     *     201: 'test/mocha/requests/create-greeting.ply.yaml#postGreetingGood'
     *     400: 'test/mocha/requests/create-greeting.ply.yaml#postGreetingBad'
     */
    @Post()
    postGreeting(greeting: Greeting) {
        this.logger.info('Create greeting', greeting);
    }
}
