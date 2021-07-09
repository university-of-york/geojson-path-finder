'use strict';

const explode = require('@turf/explode');
const roundCoord = require('./roundCoord');

/**
 * Reduce function designed to operate on geojson features
 * @param  {Object} geojson     The GeoJSON
 * @param  {Function} fn        The reduce function to call
 * @param  {Array}   seed       The seed value for the reduce
 * @return {Array}              The result after reducing
 */
function geoJsonReduce(geojson, fn, seed) {
    if (geojson.type !== 'FeatureCollection') {
        return fn(seed, geojson);
    }

    return geojson.features.reduce((all, feature) => geoJsonReduce(feature, fn, all), seed);
}

/**
 * Filter the GeoJSON to only include LineString features
 * @param  {Object} geojson     The GeoJSON
 * @return {Object}             The filtered GeoJSON
 */
function getGeoJsonLines(geojson) {
    if (geojson.type !== 'FeatureCollection') {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    return {
        type: 'FeatureCollection',
        features: geojson.features.filter((feature) => feature.geometry.type === 'LineString'),
    };
}

/**
 * Convert geoJSON into a topology
 * @param  {Object} geojson     The GeoJSON
 * @param  {Object} options     The PathFinder options
 * @return {Object}             A topology with edges and keyed vertices
 */
function topology(geojson, options) {
    const { keyFn, precision } = options;

    const lineStrings = getGeoJsonLines(geojson);
    const linePoints = explode(lineStrings);

    // Creates a lookup from an approx coordinate string to a given geojson coordinate. This
    // uses the keyFn which applies a rounding on the actual coordinate
    // {
    //     '-1.05,53.94,29.6': [ -1.0521576683, 53.9492255721, 29.6 ],
    // }
    const vertexLookup = linePoints.features.reduce((vertexLookup, feature) => {
        const coord = roundCoord(feature.geometry.coordinates, precision);
        vertexLookup[keyFn(coord)] = feature.geometry.coordinates;
        return vertexLookup;
    }, {});

    // Creates a set of Edges that look like
    // [
    //      [from, to, feature.properties]
    // ]
    const edges = geoJsonReduce(
        lineStrings,
        function buildTopologyEdges(edges, feature) {
            const { coordinates } = feature.geometry;

            coordinates.forEach(function buildLineStringEdges(coordinate, index) {
                if (index > 0) {
                    const k1 = keyFn(roundCoord(coordinates[index - 1], precision));
                    const k2 = keyFn(roundCoord(coordinate, precision));
                    edges.push([k1, k2, feature.properties]);
                }
            });

            return edges;
        },
        []
    );

    return {
        vertices: vertexLookup,
        edges: edges,
    };
}

module.exports = topology;
