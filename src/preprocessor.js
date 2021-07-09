'use strict';

const topology = require('./topology');
const compactor = require('./compactor');

/**
 * Processes a graph to calculate the weight to travel down a given edge
 * a lookup for geojson data against these edges
 * @param  {Object} graph       The graph
 * @param  {Object} options     The PathFinder options
 * @return {Object}
 */
function preprocess(graph, options) {
    const { edgeDataSeed, edgeDataReduceFn, weightFn } = options;

    /**
     * Creates a lookup of Feature.properties that are stored against the graph edges
     * @param  {Object} graph   The graph
     * @param  {String} node    The key for the node
     */
    function makeEdgeList(graph, node) {
        const { edgeDataReduceFn } = options;

        if (!graph.vertices[node]) {
            graph.vertices[node] = {};

            // If we're storing properties from the features
            // then we need to create an edgeData entry to store them
            if (edgeDataReduceFn) {
                graph.edgeData[node] = {};
            }
        }
    }

    /**
     * Stores the weight to travel between two nodes and the edge properties
     * @param  {Object} graph       The graph
     * @param  {String} startNode   The key for the start node
     * @param  {String} endNode     The key for the end node
     * @param  {Number} weight      The calculated weight
     */
    function concatEdge(graph, startNode, endNode, weight, props) {
        const { edgeDataReduceFn } = options;

        // Store the weight travelling from startNode->endNode in the vertex lookup
        const vertex = graph.vertices[startNode];
        vertex[endNode] = weight;

        // If we're storing properties from the features
        // then save the information between the two nodes in the edgeData
        if (edgeDataReduceFn) {
            graph.edgeData[startNode][endNode] = edgeDataReduceFn(edgeDataSeed, props);
        }
    }

    // Grab the topology which is either GeoJSON and needs processing, or is already pre-processed
    const topo = graph.type === 'FeatureCollection' ? topology(graph, options) : graph;

    // This calculates how expensive it is to move along an edge between two nodes. What is a node?
    // Essentially a node is placed at each end of each line which is what the vertices are.
    let processedGraph = topo.edges.reduce(
        // topo.edges looks like [[fromKey, toKey, feature.properties],]
        function buildGraph(graph, edge) {
            const a = edge[0];
            const b = edge[1];
            const props = edge[2];
            const weight = weightFn(topo.vertices[a], topo.vertices[b], props);

            let log = () => {};

            if (a === '54,1,0') {
                if (b === '54,1,1') {
                    console.log(topo.vertices[a]);
                    console.log(topo.vertices[b]);
                    console.log(weight);
                }
            }

            // If we've calculated a weight then we need to save it between  the two nodes
            if (weight) {
                makeEdgeList(graph, a);
                makeEdgeList(graph, b);

                if (weight instanceof Object) {
                    if (weight.forward) {
                        concatEdge(graph, a, b, weight.forward, props);
                    }
                    if (weight.backward) {
                        concatEdge(graph, b, a, weight.backward, props);
                    }
                } else {
                    concatEdge(graph, a, b, weight, props);
                    concatEdge(graph, b, a, weight, props);
                }
            }

            return graph;
        },
        { edgeData: {}, vertices: {} }
    );

    const compact = compactor.compactGraph(
        processedGraph.vertices,
        topo.vertices,
        processedGraph.edgeData,
        options
    );

    return {
        vertices: processedGraph.vertices,
        edgeData: processedGraph.edgeData,
        sourceVertices: topo.vertices,
        compactedVertices: compact.graph,
        compactedCoordinates: compact.coordinates,
        compactedEdges: options.edgeDataReduceFn ? compact.reducedEdges : null,
    };
}

module.exports = preprocess;
