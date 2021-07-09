var { topology } = require('../src'),
    geojson = require('./network.json'),
    test = require('tap').test;

const options = {
    precision: 1e-5,
    keyFn: (c) => c.join(','),
    weightFn: (a, b) => distance(point(a), point(b)),
};

test('can create topology', function (t) {
    var topo = topology(geojson, options);
    t.ok(topo);
    t.ok(topo.vertices);
    t.ok(topo.edges);
    t.equal(Object.keys(topo.vertices).length, 889);

    t.end();
});
