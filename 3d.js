const { PathFinder } = require('./src');
const network = require('./data/3d.json');

const edgeDataReduceFn = (seed, props) => props;
const pathFinder = new PathFinder(network, { precision: 1e-9, edgeDataReduceFn });

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
