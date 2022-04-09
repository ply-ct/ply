import * as assert from 'assert';
import { Logger, LogLevel, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';
import { RESULTS } from '../../src/names';
import * as subst from '../../src/subst';

const logger = new Logger(
    {
        ...new LogOptions(),
        level: LogLevel.info
    },
    new Storage('temp/output.log')
);

describe('subst', () => {
    it('ignores unmatched expression lines', () => {
        const values = {
            x: 'foo',
            y: 'bar'
        };
        // note windows newline converted to \n
        const template = 'here is z: ${b.something},\r\nand here is y: ${y}; finally f: ${x}';
        const res = subst.replace(template, values, logger);
        assert.strictEqual(res, 'here is z: ${b.something},\nand here is y: bar; finally f: foo');
    });

    it('handles result values', () => {
        const values = {
            baseUrl: 'http://localhost:3000',
            __ply_results: {
                moviesByYearAndRating: {
                    response: {
                        body: {
                            movies: [{ id: '8f180e68' }, { id: 'eec22a97' }]
                        }
                    }
                }
            }
        };

        const template = '${baseUrl}/movies/${@moviesByYearAndRating.response.body.movies[1].id}';
        const res = subst.replace(template, values, logger);
        assert.strictEqual(res, 'http://localhost:3000/movies/eec22a97');
    });

    it('retains escaped characters', () => {
        const before = 'Dear Sir,\\n\\nGo jump in the \\"lake\\".\\n\\n - A Friend';
        const after = subst.replace(before, {}, logger);
        assert.strictEqual(before, after);
    });

    it('handles implicit with spaces', () => {
        const values = {
            x: 'foo',
            [RESULTS]: {
                'Movies by Year & Rating': { y: 'bar' }
            }
        };
        const before = "${x}/${@['Movies by Year & Rating'].y}";
        const after = subst.replace(before, values, logger);
        assert.strictEqual(after, 'foo/bar');
    });

    it('handles subprop names with dots', () => {
        const values = {
            [RESULTS]: {
                greeting: {
                    response: {
                        body: {
                            'friendly.greetings': [
                                {
                                    salutation: 'hello',
                                    name: 'stranger'
                                }
                            ]
                        }
                    }
                }
            }
        };
        const before = "${@greeting.response.body['friendly.greetings'][0].salutation}";
        const after = subst.replace(before, values, logger);
        assert.strictEqual(after, 'hello');
    });

    it('tokenizes complex expressions', () => {
        let tokens = subst.tokenize(
            "greeting.response.body['friendly.greetings'][0].salutation",
            {}
        );
        assert.strictEqual(tokens[0], 'greeting');
        assert.strictEqual(tokens[1], 'response');
        assert.strictEqual(tokens[2], 'body');
        assert.strictEqual(tokens[3], 'friendly.greetings');
        assert.strictEqual(tokens[4], 0);
        assert.strictEqual(tokens[5], 'salutation');

        tokens = subst.tokenize('multidim[0][3][1001]', {});
        assert.strictEqual(tokens[0], 'multidim');
        assert.strictEqual(tokens[1], 0);
        assert.strictEqual(tokens[2], 3);
        assert.strictEqual(tokens[3], 1001);

        tokens = subst.tokenize('foos[12].bar.baz[3]', {});
        assert.strictEqual(tokens[0], 'foos');
        assert.strictEqual(tokens[1], 12);
        assert.strictEqual(tokens[2], 'bar');
        assert.strictEqual(tokens[3], 'baz');
        assert.strictEqual(tokens[4], 3);
    });

    it('evaluates untrusted array index', () => {
        const input = '${titles[loopCount]}';
        const values = {
            loopCount: 0,
            titles: ['Frankenstein', 'Island of Lost Souls', 'The Invisible Man']
        };
        const output = subst.get(input, values);
        assert.strictEqual(output, 'Frankenstein');
    });

    it('evaluates untrusted object index', () => {
        const input = '${titles[item]}';
        const values = {
            item: 'two',
            titles: {
                one: 'Frankenstein',
                two: 'Island of Lost Souls',
                three: 'The Invisible Man'
            }
        };
        const output = subst.get(input, values);
        assert.strictEqual(output, 'Island of Lost Souls');
    });
});
