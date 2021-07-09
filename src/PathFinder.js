'use strict';

const distance = require('@turf/distance').default;
const dijkstra = require('./dijkstra');
const preprocess = require('./preprocessor');
const compactor = require('./compactor');
const roundCoord = require('./roundCoord');
const point = require('turf-point');

class PathFinder {
    /**
     * Constructs a new instance of a PathFinder
     * @param  {Object} graph       The GeoJSON network of lines
     * @param  {Object} options     Configuration options for the PathFinder
     * @return {Object}
     */
    constructor(graph, options = {}) {
        this._options = {
            precision: 1e-5,
            compact: true,
            keyFn: (c) => c.join(','),
            weightFn: (a, b, props) => {
                let altitudeDiff = Math.abs(b[2] - a[2]);
                if (isNaN(altitudeDiff)) {
                    altitudeDiff = 0;
                }

                return distance(point(a), point(b)) + altitudeDiff;
            },
            ...options,
        };

        if (!graph.compactedVertices) {
            graph = preprocess(graph, this.options);
        }

        this._graph = graph;

        if (
            Object.keys(this.graph.compactedVertices).filter((k) => k !== 'edgeData').length === 0
        ) {
            throw new Error('Compacted graph contains no forks (topology has no intersections).');
        }
    }

    /**
     * Creates a phantom node
     * @param  {[type]} n [description]
     * @return {[type]}   [description]
     */
    _createPhantom(n) {
        const {
            compactedVertices,
            compactedCoordinates,
            compactedEdges,
            vertices,
            sourceVertices,
            edgeData,
        } = this.graph;

        if (compactedVertices[n]) return null;

        const phantom = compactor.compactNode(
            n,
            vertices,
            compactedVertices,
            sourceVertices,
            edgeData,
            true,
            this.options
        );
        compactedVertices[n] = phantom.edges;
        compactedCoordinates[n] = phantom.coordinates;

        if (compactedEdges) {
            compactedEdges[n] = phantom.reducedEdges;
        }

        Object.keys(phantom.incomingEdges).forEach((neighbor) => {
            compactedVertices[neighbor][n] = phantom.incomingEdges[neighbor];
            compactedCoordinates[neighbor][n] = phantom.incomingCoordinates[neighbor];
            if (compactedEdges) {
                compactedEdges[neighbor][n] = phantom.reducedEdges[neighbor];
            }
        });

        return n;
    }

    _removePhantom(n) {
        if (!n) return;

        Object.keys(this.graph.compactedVertices[n]).forEach(
            function (neighbor) {
                delete this.graph.compactedVertices[neighbor][n];
            }.bind(this)
        );
        Object.keys(this.graph.compactedCoordinates[n]).forEach(
            function (neighbor) {
                delete this.graph.compactedCoordinates[neighbor][n];
            }.bind(this)
        );
        if (this.graph.compactedEdges) {
            Object.keys(this.graph.compactedEdges[n]).forEach(
                function (neighbor) {
                    delete this.graph.compactedEdges[neighbor][n];
                }.bind(this)
            );
        }

        delete this.graph.compactedVertices[n];
        delete this.graph.compactedCoordinates[n];

        if (this.graph.compactedEdges) {
            delete this.graph.compactedEdges[n];
        }
    }

    findPath(a, b) {
        const start = this.keyFn(roundCoord(a.geometry.coordinates, this.precision));
        const finish = this.keyFn(roundCoord(b.geometry.coordinates, this.precision));

        // We can't find a path if start or finish isn't in the set of non-compacted vertices
        if (!this.graph.vertices[start] || !this.graph.vertices[finish]) {
            return null;
        }

        const phantomStart = this._createPhantom(start);
        const phantomEnd = this._createPhantom(finish);

        let path = dijkstra(this.graph.compactedVertices, start, finish);

        if (path) {
            var weight = path[0];
            path = path[1];
            return {
                path: path
                    .reduce(
                        function buildPath(cs, v, i, vs) {
                            if (i > 0) {
                                cs = cs.concat(this.graph.compactedCoordinates[vs[i - 1]][v]);
                            }

                            return cs;
                        }.bind(this),
                        []
                    )
                    .concat([this.graph.sourceVertices[finish]]),
                weight: weight,
                edgeDatas: this.graph.compactedEdges
                    ? path.reduce(
                          function buildEdgeData(eds, v, i, vs) {
                              if (i > 0) {
                                  eds.push({
                                      reducedEdge: this.graph.compactedEdges[vs[i - 1]][v],
                                  });
                              }

                              return eds;
                          }.bind(this),
                          []
                      )
                    : undefined,
            };
        } else {
            return null;
        }

        this._removePhantom(phantomStart);
        this._removePhantom(phantomEnd);
    }

    /**
     * The precision with which to round coordinates
     * @return {Number}
     */
    get precision() {
        return this.options.precision;
    }

    /**
     * ???
     * @return {Function}
     */
    get keyFn() {
        return this.options.keyFn;
    }

    /**
     * Returns the options
     * @return {Object}
     */
    get options() {
        return this._options;
    }

    /**
     * Returns the graph
     * @return {Object}
     */
    get graph() {
        return this._graph;
    }

    /**
     * Returns the graph
     * @deprecated Use .graph instead
     * @return {Object}
     */
    serialize() {
        return this.graph;
    }
}

module.exports = PathFinder;
