var PathFinder = require('../src/PathFinder'),
    geojson = require('../data/2d.json'),
    test = require('tap').test,
    point = require('turf-point'),
    distance = require('@turf/distance').default;

const options = {
    edgeDataReduceFn: (seed, props) => props,
};

test('can find basic path', function (t) {
    const pathfinder = new PathFinder(geojson);
    const path = pathfinder.findPath(point([53, 0]), point([56, 1]));

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

test('can avoid a route with an accessible requirement', function (t) {
    const weightFn = (a, b, props) => {
        if (!props.Accessible) {
            return 0;
        }
        return distance(point(a), point(b));
    };

    const pathfinder = new PathFinder(geojson, { ...options, weightFn });
    const path = pathfinder.findPath(point([53, 0]), point([56, 1]));

    t.ok(path, 'has path');
    t.ok(path.path, 'path has vertices');
    t.equal(path.path.length, 5, 'path has 5 vertices');
    t.equal(
        JSON.stringify(path.path),
        JSON.stringify([
            [53, 0],
            [54, 0],
            [55, 0],
            [55, 1],
            [56, 1],
        ])
    );
    t.ok(path.weight, 'path has a weight');
    t.end();
});
