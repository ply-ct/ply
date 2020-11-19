import * as assert from 'assert';
import { Retrieval } from '../../src/retrieval';
import { Import } from '../../src/import';
import { Logger } from '../../src/logger';
import { Ply } from '../../src/ply';
import { Request } from '../../src/request';
import { Values } from '../../src/values';

describe('Import', () => {

    const reqRoot = 'test/mocha/postman/requests';
    const valRoot = 'test/mocha/postman/values';

    it('should import postman requests', async () => {
        const retrieval = new Retrieval('test/mocha/postman/movies.postman_collection.json');
        assert.ok(retrieval.location.ext);
        assert.ok(await retrieval.exists);
        const importer = new Import('postman', reqRoot, 2, new Logger());
        await importer.doImport(retrieval);

        const ply = new Ply();
        const topRequests = ply.loadSuiteSync(`${reqRoot}/movies.ply.yaml`);
        assert.ok(topRequests);

        const after1935 = topRequests.get('after 1935') as Request;
        assert.strictEqual(after1935.url, '${baseUrl}?year=>1935');
        assert.strictEqual(after1935.method, 'GET');

        const create = topRequests.get('create') as Request;
        assert.strictEqual(create.url, '${baseUrl}');
        assert.strictEqual(create.method, 'POST');
        assert.strictEqual(create.headers['Content-Type'], 'application/json');
        assert.ok(create.body);
        const movie = JSON.parse(create.body);
        assert.strictEqual(movie.title, 'The Case of the Howling Dog');
        assert.strictEqual(movie.year, 1934);

        const moviesRequests = ply.loadSuiteSync(`${reqRoot}/movies/actors.ply.yaml`);
        assert.ok(moviesRequests);

        const lugosi = moviesRequests.get('Lugosi') as Request;
        assert.strictEqual(lugosi.url, '${baseUrl}?search=Bela%20Lugosi');
        assert.strictEqual(lugosi.method, 'GET');

        const karloff = moviesRequests.get('Karloff') as Request;
        assert.strictEqual(karloff.url, '${baseUrl}?search=Boris%20Karloff');
        assert.strictEqual(karloff.method, 'GET');

        const greatRequests = ply.loadSuiteSync(`${reqRoot}/movies/by rating/great.ply.yaml`);
        assert.ok(greatRequests);

        const greatsOf1931 = greatRequests.get('great movies of 1931') as Request;
        assert.strictEqual(greatsOf1931.url, '${baseUrl}?rating=5&year=1931');
        assert.strictEqual(greatsOf1931.method, 'GET');

        const greatsAfter1935 = greatRequests.get('great movies after 1935') as Request;
        assert.strictEqual(greatsAfter1935.url, '${baseUrl}?rating=5&year=>1935');
        assert.strictEqual(greatsAfter1935.method, 'GET');
    });

    it('should import postman graphql', async () => {
        const retrieval = new Retrieval('test/mocha/postman/github.postman_collection.json');
        assert.ok(await retrieval.exists);
        const importer = new Import('postman', reqRoot, 2, new Logger());
        await importer.doImport(retrieval);

        const ply = new Ply();
        const githubRequests = ply.loadSuiteSync(`${reqRoot}/github.ply.yaml`);
        assert.ok(githubRequests);

        const repositoryTopicsQuery = githubRequests.get('repositoryTopicsQuery') as Request;
        assert.strictEqual(repositoryTopicsQuery.url, 'https://api.github.com/graphql');
        assert.strictEqual(repositoryTopicsQuery.method, 'POST');
        assert.strictEqual(repositoryTopicsQuery.headers.Authorization, 'Bearer ${githubToken}');
        assert.ok(repositoryTopicsQuery.body);
        const repositoryTopicsQueryBody = JSON.parse(repositoryTopicsQuery.body);
        const repositoryTopicsQueryQuery = repositoryTopicsQueryBody.query;
        assert.ok(repositoryTopicsQueryQuery);

        const repositoryTopicsGraphql = githubRequests.get('repositoryTopicsGraphql') as Request;
        assert.strictEqual(repositoryTopicsGraphql.url, 'https://api.github.com/graphql');
        assert.strictEqual(repositoryTopicsGraphql.method, 'POST');
        assert.strictEqual(repositoryTopicsGraphql.headers.Authorization, 'Bearer ${githubToken}');
        assert.ok(repositoryTopicsGraphql.body);
        const repositoryTopicsGraphqlBody = repositoryTopicsGraphql.body;
        assert.strictEqual(repositoryTopicsGraphqlBody, repositoryTopicsQueryQuery);
    });

    it('should import postman values', async () => {
        const retrieval = new Retrieval('test/mocha/postman/localhost.postman_environment.json');
        assert.ok(await retrieval.exists);
        const importer = new Import('postman', valRoot, 2, new Logger());
        await importer.doImport(retrieval);
        const values = new Values([`${valRoot}/localhost.json`], new Logger());
        const obj = await values.read();
        assert.ok(obj);
        assert.strictEqual(obj.baseUrl, 'http://localhost:8080/movies');
    });

});
