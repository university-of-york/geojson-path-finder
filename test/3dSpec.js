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
    t.equal(path.path.length, 6, 'path has 6 vertices');
    t.equal(
        JSON.stringify(path.path),
        JSON.stringify([
            [53, 0, 0],
            [54, 0, 0],
            [54, 1, 0],
            [54, 1, 1],
            [54, 1, 2],
            [53, 1, 2],
        ])
    );
    t.ok(path.weight, 'path has a weight');
    t.end();
});

test('can find path between floors only using lifts', function (t) {
    const weightFn = (a, b, props) => {
        if (props.Stairs) {
            return null;
        }

        let altitudeDiff = Math.abs(b[2] - a[2]);
        if (isNaN(altitudeDiff)) {
            altitudeDiff = 0;
        }

        return distance(point(a), point(b)) + altitudeDiff;
    };

    const pathfinder = new PathFinder(geojson, { ...options, weightFn });
    const path = pathfinder.findPath(point([53, 0, 0]), point([53, 1, 2]));

    t.ok(path, 'has path');
    t.ok(path.path, 'path has vertices');
    t.equal(path.path.length, 10, 'path has 10 vertices');
    t.equal(
        JSON.stringify(path.path),
        JSON.stringify([
            [53, 0, 0],
            [54, 0, 0],
            [54, 1, 0],
            [54, 1, 1],
            [55, 1, 1],
            [55, 0, 1],
            [55, 0, 2],
            [55, 1, 2],
            [54, 1, 2],
            [53, 1, 2],
        ])
    );
    t.ok(path.weight, 'path has a weight');
    t.end();
});

test('is unable to find routes between floors if no stairs/lifts allowed', function (t) {
    const weightFn = (a, b, props) => {
        if (props.Stairs || props.Lift) {
            return null;
        }

        let altitudeDiff = Math.abs(b[2] - a[2]);
        if (isNaN(altitudeDiff)) {
            altitudeDiff = 0;
        }

        return distance(point(a), point(b)) + altitudeDiff;
    };

    const pathfinder = new PathFinder(geojson, { ...options, weightFn });
    const path = pathfinder.findPath(point([53, 0, 0]), point([53, 1, 2]));

    t.equal(path, null, 'expected to find no valid path');
    t.end();
});
