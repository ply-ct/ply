import * as assert from 'assert';
import { Logger } from '../../src/logger';
import { Storage } from '../../src/storage';
import { Compare } from '../../src/compare';

describe('Compare', () => {
    const logger = new Logger({}, new Storage('temp/output.log'));

    it('handles regex', () => {
        const compare = new Compare(logger);

        const expected =
            'before\n' + 'headers:\n' + '  content-type: application/json${~.*}\n' + 'after\n';

        const actual =
            'before\n' +
            'headers:\n' +
            '  content-type: application/json; charset=utf-8\n' +
            'after\n';

        const diffs = compare.diffLines(expected, actual, {});

        assert.strictEqual(diffs[1].ignored, true);
        assert.strictEqual(diffs[2].ignored, true);
    });

    it('handles multiline regex', () => {
        const compare = new Compare(logger);

        const expected =
            'before\n' +
            'headers:\n' +
            '  content-type: application/json${~.*}\n' +
            "  location: '${baseUrl}/movies/${~[0-9a-f]+}'\n";
        ('after\n');

        const actual =
            'before\n' +
            'headers:\n' +
            '  content-type: application/json; charset=utf-8\n' +
            "  location: 'http://localhost:3000/movies/435b30ad'\n";
        ('after\n');

        const values = {
            baseUrl: 'http://localhost:3000'
        };

        const diffs = compare.diffLines(expected, actual, values);

        assert.strictEqual(diffs[1].count, 2);
        assert.strictEqual(diffs[1].removed, true);
        assert.strictEqual(!!diffs[1].ignored, true);
        assert.strictEqual(diffs[2].count, 2);
        assert.strictEqual(diffs[2].added, true);
        assert.strictEqual(!!diffs[2].ignored, true);
    });

    it('handles regex with unmatched value', () => {
        const compare = new Compare(logger);

        const expected =
            'before\n' +
            'headers:\n' +
            '  content-type: application/json${~.*}\r\n' + // windows newline
            "  location: '${baseUrl}/movies/${id}'\n";
        ('after\n');

        const actual =
            'before\n' +
            'headers:\n' +
            '  content-type: application/json; charset=utf-8\r\n' + // windows newline
            "  location: 'http://localhost:3000/movies/435b30ad'\n";
        ('after\n');

        const values = {
            baseUrl: 'http://localhost:3000/movies'
        };

        const diffs = compare.diffLines(expected, actual, values);
        assert.strictEqual(diffs.length, 3);
        assert.strictEqual(
            diffs[1].value,
            "  content-type: application/json${~.*}\n  location: '${baseUrl}/movies/${id}'\n"
        );
        assert.strictEqual(diffs[1].ignored, undefined);
    });

    it('handles regex for any number of digits', () => {
        const expected =
            '<Ticket>\n' +
            '  <CreationTime>2022-02-21T21:34:41Z</CreationTime>\n' +
            '  <IdNumber>${~\\d+}</IdNumber>\n' +
            '</Ticket>\n';

        const actual =
            '<Ticket>\n' +
            '  <CreationTime>2022-02-21T21:34:41Z</CreationTime>\n' +
            '  <IdNumber>22712854</IdNumber>\n' +
            '</Ticket>\n';

        const compare = new Compare(logger);
        const diffs = compare.diffLines(expected, actual, {});

        assert.strictEqual(diffs.length, 4);
        assert.strictEqual(diffs[1].removed, true);
        assert.strictEqual(diffs[1].ignored, true);
        assert.strictEqual(diffs[2].added, true);
        assert.strictEqual(diffs[2].ignored, true);
    });
});
