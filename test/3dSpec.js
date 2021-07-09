var PathFinder = require('../src/PathFinder'),
    geojson = require('../data/3d.json'),
    test = require('tap').test,
    point = require('turf-point'),
    distance = require('@turf/distance').default;

const options = {
    edgeDataReduceFn: (seed, props) => props,
};

test('can find basic path between floors', function (t) {
    const pathfinder = new PathFinder(geojson);
    const path = pathfinder.findPath(point([53, 0, 0]), point([53, 1, 2]));

    t.ok(path, 'has path');
    t.ok(path.path, 'path has vertices');
    t.equal(path.path.length, 5, 'path has 5 vertices');
    t.equal(
        JSON.stringify(path.path),
        JSON.stringify([
            [53, 0],
            [54, 0],
            [54, 1],
            [55, 1],
            [56, 1],
        ])
    );
    t.ok(path.weight, 'path has a weight');
    t.end();
});

// test('can find path between floors only using lifts', function (t) {});

// test('favours single floor routes', function (t) {});

// // This test ensures that point rounding doesn't connect two different floors together
// test('is unable to find routes between floors if no stairs/lifts allowed', function (t) {});
