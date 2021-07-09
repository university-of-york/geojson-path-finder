const { PathFinder } = require('./src');
const point = require('turf-point');
const distance = require('@turf/distance').default;
const network = require('./data/3d.json');

const edgeDataReduceFn = (seed, props) => props;
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
const pathFinder = new PathFinder(network, { precision: 1e-9, edgeDataReduceFn, weightFn });

const start = {
    type: 'Feature',
    geometry: {
        coordinates: [53, 0, 0],
        type: 'Point',
    },
};

const end = {
    type: 'Feature',
    geometry: {
        coordinates: [53, 1, 2],
        type: 'Point',
    },
};

const startTime = +new Date();

const result = pathFinder.findPath(start, end);
console.log(result);

const endTime = +new Date();
console.log(`Distance: ${result.weight}, Paths: ${result.path.length}`);
console.log(`Calculation took ${endTime - startTime}ms`);
