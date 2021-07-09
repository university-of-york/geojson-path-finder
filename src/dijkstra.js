const Queue = require('tinyqueue');

/**
 * Run dijkstra's algorithm to find the route
 * @param  {Object} graph   The graph to search
 * @param  {Array} start    The start coordinate
 * @param  {Array} end      The end coordinate
 * @return {Array}          The result
 */
function dijkstra(graph, start, end) {
    const costs = {};
    const initialState = [0, [start], start];
    const queue = new Queue([initialState], function (a, b) {
        return a[0] - b[0];
    });

    costs[start] = 0;

    while (queue.length) {
        const state = queue.pop();
        const cost = state[0];
        const node = state[2];
        if (node === end) {
            return state.slice(0, 2);
        }

        const neighbours = graph[node];
        Object.keys(neighbours).forEach(function (n) {
            const newCost = cost + neighbours[n];
            if (!(n in costs) || newCost < costs[n]) {
                costs[n] = newCost;
                const newState = [newCost, state[1].concat([n]), n];
                queue.push(newState);
            }
        });
    }

    return null;
}

module.exports = dijkstra;
