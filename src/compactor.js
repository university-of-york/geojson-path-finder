'use strict';

function findNextEnd(prev, v, vertices, ends, vertexCoords, edgeData, trackIncoming, options) {
    var weight = vertices[prev][v],
        reverseWeight = vertices[v][prev],
        coordinates = [],
        path = [],
        reducedEdge = options.edgeDataSeed;

    if (options.edgeDataReduceFn) {
        reducedEdge = options.edgeDataReduceFn(reducedEdge, edgeData[v][prev]);
    }

    while (!ends[v]) {
        var edges = vertices[v];

        if (!edges) {
            break;
        }

        var next = Object.keys(edges).filter(function notPrevious(k) {
            return k !== prev;
        })[0];
        weight += edges[next];

        if (trackIncoming) {
            reverseWeight += vertices[next][v];

            if (path.indexOf(v) >= 0) {
                ends[v] = vertices[v];
                break;
            }
            path.push(v);
        }

        if (options.edgeDataReduceFn) {
            reducedEdge = options.edgeDataReduceFn(reducedEdge, edgeData[v][next]);
        }

        coordinates.push(vertexCoords[v]);
        prev = v;
        v = next;
    }

    return {
        vertex: v,
        weight: weight,
        reverseWeight: reverseWeight,
        coordinates: coordinates,
        reducedEdge: reducedEdge,
    };
}

function compactNode(k, vertices, ends, vertexCoords, edgeData, trackIncoming, options) {
    options = options || {};
    var neighbors = vertices[k];
    return Object.keys(neighbors).reduce(
        function compactEdge(result, j) {
            var neighbor = findNextEnd(
                k,
                j,
                vertices,
                ends,
                vertexCoords,
                edgeData,
                trackIncoming,
                options
            );
            var weight = neighbor.weight;
            var reverseWeight = neighbor.reverseWeight;
            if (neighbor.vertex !== k) {
                if (!result.edges[neighbor.vertex] || result.edges[neighbor.vertex] > weight) {
                    result.edges[neighbor.vertex] = weight;
                    result.coordinates[neighbor.vertex] = [vertexCoords[k]].concat(
                        neighbor.coordinates
                    );
                    result.reducedEdges[neighbor.vertex] = neighbor.reducedEdge;
                }
                if (
                    trackIncoming &&
                    !isNaN(reverseWeight) &&
                    (!result.incomingEdges[neighbor.vertex] ||
                        result.incomingEdges[neighbor.vertex] > reverseWeight)
                ) {
                    result.incomingEdges[neighbor.vertex] = reverseWeight;
                    var coordinates = [vertexCoords[k]].concat(neighbor.coordinates);
                    coordinates.reverse();
                    result.incomingCoordinates[neighbor.vertex] = coordinates;
                }
            }
            return result;
        },
        { edges: {}, incomingEdges: {}, coordinates: {}, incomingCoordinates: {}, reducedEdges: {} }
    );
}

/**
 * Compacts the graph
 * Compacting the graph means removing all nodes that only have one
 * or two edges, which mean there isn't a choice in how to proceed from this node.
 * For common road networds, a large majority of the nodes are of this type, and
 * they don't affect routing, but they take a lot of extra time for the routing algorithm to traverse
 * @param  {[type]} vertices     [description]
 * @param  {[type]} vertexCoords [description]
 * @param  {[type]} edgeData     [description]
 * @param  {[type]} options      [description]
 * @return {[type]}              [description]
 */
function compactGraph(vertices, vertexCoords, edgeData, options) {
    const ends = Object.keys(vertices).reduce(function findEnds(ends, key, i, vs) {
        const vertex = vertices[key];
        const edges = Object.keys(vertex);
        const numberEdges = edges.length;
        let remove;

        if (options.compact === false) {
            remove = false;
        } else if (numberEdges === 1) {
            // If this vertex has just a single edge coming from it, then check the destination vertex.
            // If it's not possible to get back from the destination vertex to this one, then we
            // remove this vertex from the graph.
            //
            // Why? I have no idea... yet
            const edgeKey = edges[0];
            const destinationVertex = vertices[edgeKey];
            remove = !destinationVertex[key];
        } else if (numberEdges === 2) {
            // Removes edges where there is no option other than to traverse it (as there are no junction points)
            remove = edges.filter((n) => vertices[n][key]).length === numberEdges;
        } else {
            remove = false;
        }

        if (!remove) {
            ends[key] = vertex;
        }

        return ends;
    }, {});

    return Object.keys(ends).reduce(
        function compactEnd(result, k, i, es) {
            var compacted = compactNode(k, vertices, ends, vertexCoords, edgeData, false, options);
            result.graph[k] = compacted.edges;
            result.coordinates[k] = compacted.coordinates;

            if (options.edgeDataReduceFn) {
                result.reducedEdges[k] = compacted.reducedEdges;
            }

            return result;
        },
        { graph: {}, coordinates: {}, reducedEdges: {} }
    );
}

module.exports = {
    compactNode: compactNode,
    compactGraph: compactGraph,
};
