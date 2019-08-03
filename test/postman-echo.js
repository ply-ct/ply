'use strict';

const ply = require('../src/ply');

const testsLoc = '../../ply-demo/src/test/ply';
var requests = ply.loadRequests(testsLoc + '/requests/postman/movies-api.postman_collection.json');
// var requests = ply.loadRequests(testsLoc + '/requests/postman/Postman Echo.postman_collection.json');
console.log("REQUESTS: " + JSON.stringify(requests, null, 2));
