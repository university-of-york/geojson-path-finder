'use strict';

/**
 * Rounds a coordinate to a given precision
 * @param  {Array} coordinate     The [longitude, latitude, altitude] coordinate
 * @param  {Number} precision     The precision to round to
 * @return {Array}
 */
function roundCoord(coordinate, precision) {
    const [longitude, latitude, altitude = 0] = coordinate;

    return [
        Math.round(longitude / precision) * precision,
        Math.round(latitude / precision) * precision,
        Math.round(altitude / precision) * precision,
    ];
}

module.exports = roundCoord;
