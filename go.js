const { PathFinder } = require('./src');
const network = require('./data/campus.json');

const pathFinder = new PathFinder(network, {
    precision: 1e-9,
    edgeDataReduceFn: (seed, props) => props,
});

const start = {
    type: 'Feature',
    geometry: {
        coordinates: [-1.0520312784, 53.9457542122, 12.9],
        type: 'Point',
    },
};

const end = {
    type: 'Feature',
    geometry: {
        coordinates: [-1.0519334598, 53.9487236213, 14.91],
        type: 'Point',
    },
};

const startTime1 = +new Date();
const result = pathFinder.findPath(start, end);
const endTime1 = +new Date();

const startTime2 = +new Date();
pathFinder.findPath(start, end);
const endTime2 = +new Date();

const startTime3 = +new Date();
pathFinder.findPath(start, end);
const endTime3 = +new Date();

console.log(`Distance: ${result.weight}, Paths: ${result.path.length}`);

console.log(
    `Calculations took ${endTime1 - startTime1}ms, ${endTime2 - startTime2}ms & ${
        endTime3 - startTime3
    }ms`
);
