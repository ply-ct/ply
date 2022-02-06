import * as assert from 'assert';
import { Retrieval } from '../../src/retrieval';
import { Import } from '../../src/import/import';
import { Logger } from '../../src/logger';
import { Ply } from '../../src/ply';
import { Request } from '../../src/request';
import { Values } from '../../src/values';

describe('Insomnia', () => {

    const reqRoot = 'test/mocha/insomnia/requests';
    const valRoot = 'test/mocha/insomnia/values';

    it('should import insomnia yaml suites', async () => {
        const retrieval = new Retrieval('test/mocha/insomnia/insomnia-movies.yaml');

        assert.ok(retrieval.location.ext);
        assert.ok(await retrieval.exists);
        const importer = new Import('insomnia', new Logger());
        await importer.doImport(retrieval, { testsLocation: reqRoot, valuesLocation: valRoot, indent: 2 });

        const ply = new Ply();
        const topRequests = await ply.loadSuite(`${reqRoot}/testing.ply.yaml`);
        assert.ok(topRequests);

        const after1935 = topRequests.get('after 1935') as Request;
        assert.strictEqual(after1935.url, '${baseUrl}/movies?year=>1935');
        assert.strictEqual(after1935.method, 'GET');

        const movieRequests = await ply.loadSuite(`${reqRoot}/testing/movies.ply.yaml`);
        const create = movieRequests.get('create') as Request;
        assert.strictEqual(create.url, '${baseUrl}/movies');
        assert.strictEqual(create.method, 'POST');
        assert.strictEqual(create.headers['Content-Type'], 'application/json');
        assert.ok(create.body);
        const movie = JSON.parse(create.body);
        assert.strictEqual(movie.title, 'The Case of the Howling Dog');
        assert.strictEqual(movie.year, 1934);
        assert.strictEqual(movie.webRef.ref, '${webref}');

        // qualify by method name
        const getById = movieRequests.get('GET by id');
        assert.ok(getById);
        assert.strictEqual(getById.method, 'GET');
        assert.strictEqual(getById.url, '${baseUrl}/movies/${movieId}');
        const delById = movieRequests.get('DELETE by id');
        assert.ok(delById);
        assert.strictEqual(delById.method, 'DELETE');
        assert.strictEqual(delById.url, '${baseUrl}/movies/${movieId}');

        const actorsRequests = await ply.loadSuite(`${reqRoot}/testing/movies/actors.ply.yaml`);
        assert.ok(actorsRequests);

        const lugosi = actorsRequests.get('Lugosi') as Request;
        assert.strictEqual(lugosi.url, '${baseUrl}/movies?search=Bela%20Lugosi');
        assert.strictEqual(lugosi.method, 'GET');

        const karloff = actorsRequests.get('Karloff') as Request;
        assert.strictEqual(karloff.url, '${baseUrl}/movies?search=Boris%20Karloff');
        assert.strictEqual(karloff.method, 'GET');

        const greatRequests = await ply.loadSuite(`${reqRoot}/testing/movies/by rating/great.ply.yaml`);
        assert.ok(greatRequests);

        const greatsOf1931 = greatRequests.get('great movies of 1931') as Request;
        assert.strictEqual(greatsOf1931.url, '${baseUrl}/movies?rating=5&year=1931');
        assert.strictEqual(greatsOf1931.method, 'GET');

        const greatsAfter1935 = greatRequests.get('great movies after 1935') as Request;
        assert.strictEqual(greatsAfter1935.url, '${baseUrl}/movies?rating=5&year=>1935');
        assert.strictEqual(greatsAfter1935.method, 'GET');


        const baseValues = new Values([`${valRoot}/Base Environment.json`], new Logger());
        const baseObj = await baseValues.read();
        assert.ok(baseObj);
        assert.strictEqual(baseObj.movieId, '435b30ad');

        const plyctValues = new Values([`${valRoot}/ply-ct.json`], new Logger());
        const plyctObj = await plyctValues.read();
        assert.ok(plyctObj);
        assert.strictEqual(plyctObj.baseUrl, 'https://ply-ct.org');
    });

    it('should import insomnia yaml requests', async () => {
        const retrieval = new Retrieval('test/mocha/insomnia/insomnia-movies.yaml');

        assert.ok(retrieval.location.ext);
        assert.ok(await retrieval.exists);
        const importer = new Import('insomnia', new Logger());
        await importer.doImport(retrieval, { testsLocation: reqRoot, valuesLocation: valRoot, indent: 2, individualRequests: true });

        const ply = new Ply();

        const after1935 = await ply.loadRequest(`${reqRoot}/testing/after 1935.ply`);
        assert.strictEqual(after1935.url, '${baseUrl}/movies?year=>1935');
        assert.strictEqual(after1935.method, 'GET');

        const create = await ply.loadRequest(`${reqRoot}/testing/movies/create.ply`);
        assert.strictEqual(create.url, '${baseUrl}/movies');
        assert.strictEqual(create.method, 'POST');
        assert.strictEqual(create.headers['Content-Type'], 'application/json');
        assert.ok(create.body);
        const movie = JSON.parse(create.body);
        assert.strictEqual(movie.title, 'The Case of the Howling Dog');
        assert.strictEqual(movie.year, 1934);

        const lugosi = await ply.loadRequest(`${reqRoot}/testing/movies/actors/Lugosi.ply`);
        assert.ok(lugosi);
        assert.strictEqual(lugosi.url, '${baseUrl}/movies?search=Bela%20Lugosi');
        assert.strictEqual(lugosi.method, 'GET');

        const karloff = await ply.loadRequest(`${reqRoot}/testing/movies/actors/Karloff.ply`);
        assert.ok(karloff);
        assert.strictEqual(karloff.url, '${baseUrl}/movies?search=Boris%20Karloff');
        assert.strictEqual(karloff.method, 'GET');

        const greatsOf1931 = await ply.loadRequest(`${reqRoot}/testing/movies/by rating/great/great movies of 1931.ply`);
        assert.strictEqual(greatsOf1931.url, '${baseUrl}/movies?rating=5&year=1931');
        assert.strictEqual(greatsOf1931.method, 'GET');

        const greatsAfter1935 = await ply.loadRequest(`${reqRoot}/testing/movies/by rating/great/great movies after 1935.ply`);
        assert.strictEqual(greatsAfter1935.url, '${baseUrl}/movies?rating=5&year=>1935');
        assert.strictEqual(greatsAfter1935.method, 'GET');
    });

    it('should import insomnia graphql from json', async () => {
        const retrieval = new Retrieval('test/mocha/insomnia/insomnia-github-graphql.json');
        assert.ok(await retrieval.exists);
        const importer = new Import('insomnia', new Logger());
        await importer.doImport(retrieval, { testsLocation: reqRoot, valuesLocation: valRoot, indent: 2, individualRequests: true });

        const ply = new Ply();
        const repositoryTopicsQuery = await ply.loadRequest(`${reqRoot}/github-graphql/GitHub/repositoryTopicsQuery.ply`);
        assert.ok(repositoryTopicsQuery);
        assert.strictEqual(repositoryTopicsQuery.url, 'https://api.github.com/graphql');
        assert.strictEqual(repositoryTopicsQuery.method, 'POST');
        assert.strictEqual(repositoryTopicsQuery.headers.Authorization, 'Bearer ${token}');
        assert.ok(repositoryTopicsQuery.body);

        const repositoryIdQuery = await ply.loadRequest(`${reqRoot}/github-graphql/GitHub/repositoryIdQuery.ply`);
        assert.strictEqual(repositoryIdQuery.url, 'https://api.github.com/graphql');
        assert.strictEqual(repositoryIdQuery.method, 'POST');
        assert.strictEqual(repositoryIdQuery.headers.Authorization, 'Bearer ${token}');
        assert.ok(repositoryIdQuery.body);
    });
});