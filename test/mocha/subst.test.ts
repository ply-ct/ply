import * as assert from 'assert';
import { Logger, LogLevel, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';
import { RESULTS } from '../../src/names';
import * as subst from '../../src/subst';

const logger = new Logger({
    ...new LogOptions(),
    level: LogLevel.info
}, new Storage('temp/output.log'));

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
                            movies: [
                                { id: '8f180e68' },
                                { id: 'eec22a97' }
                            ]
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

});