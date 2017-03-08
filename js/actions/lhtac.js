/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const axios = require('../../MapStore2/web/client/libs/ajax');

const SWITCH_LAYER = 'SWITCH_LAYER';
const SET_ACTIVE_ZONE = 'SET_ACTIVE_ZONE';
const CHANGE_LAYER_PROPERTIES = 'CHANGE_LAYER_PROPERTIES';
const STATS_LOADING = 'STATS_LOADING';
const CHANGE_DOWNLOAD_FORMAT = 'CHANGE_DOWNLOAD_FORMAT';
const CLEAN_GEOMETRY = 'CLEAN_GEOMETRY';
const CLEAN_ZONE = 'CLEAN_ZONE';
const LOADING_SELECT_ALL = 'LOADING_SELECT_ALL';
const ZONE_CHANGE = 'ZONE_CHANGE';
const RESET_ALL_FILTERS = 'LHTAC_RESET_ALL_FILTERS';
const GRID_HEIGHT = 'GRID_HEIGHT';

const {changeLayerProperties} = require('../../MapStore2/web/client/actions/layers');

const {zoneSearchError, zoneFilter, zoneSearch} = require('../../MapStore2/web/client/actions/queryform');
const {featureSelectorError} = require("../actions/featureselector");
const {onResetThisZone} = require("../actions/queryform");

const FileUtils = require('../../MapStore2/web/client/utils/FileUtils');

function statsLoading(status) {
    return {
        type: "STATS_LOADING",
        status
    };
}

function changeLhtacLayerFilter(layer, properties, areaFilter) {
    let url = layer.url.replace('wms', 'ows');
    let params = {
        service: "WFS",
        request: "getFeature",
        version: "1.1.0",
        resultType: "hits",
        typeNames: layer.name
    };
    return (dispatch) => {
        dispatch(changeLayerProperties(layer.id, properties));
        dispatch(statsLoading(true));
        let requests = layer.statistics.reduce((arr, stat) => {
            let p;
            let customCql = stat.custom_cql ? stat.custom_cql : '';
            switch (stat.type) {
                case "areaFilter": {
                    p = {params: {...params, cql_filter: areaFilter + customCql}};
                    break;
                }
                case "allFilter": {
                    p = {params: {...params, cql_filter: properties.params.cql_filter + customCql}};
                    break;
                }
                default: {
                    p = {params: {...params, cql_filter: customCql.length > 0 ? customCql : "INCLUDE"}};
                }
            }
            if (p.params.cql_filter !== stat.filter || stat.exception !== false) {
                arr.push(axios.get(url, p, {
                    timeout: 15000,
                    headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'}
                }).then((response) => {
                    let config = response.data;
                    let s = config.indexOf("numberOfFeatures");
                    let obj;
                    if (s !== -1) {
                        let value = parseInt(config.substring(s + 18, config.indexOf('"', s + 19)), 10);
                        obj = {...stat, value: value, excepiton: false, filter: p.params.cql_filter};
                    } else {
                        obj = {...stat, value: null, excepiton: true};
                    }
                    return obj;
                }).catch(()=> {
                    return {...stat, value: null, excepiton: true};
                }));
            }else {
                arr.push(Promise.resolve({...stat}));
            }
            return arr;
        }, []);
        return axios.all(requests).then((results) => {
            dispatch(statsLoading(false));
            results.sort((a, b) => (a.id - b.id) );
            dispatch(changeLayerProperties(layer.id, {statistics: results}));
        });
    };
}
function switchLayer(layer) {
    return {
        type: SWITCH_LAYER,
        layer
    };
}
function setActiveZone(id, exclude) {
    return {
        type: SET_ACTIVE_ZONE,
        id,
        exclude
    };
}

function cleanGeometry() {
    return {
        type: CLEAN_GEOMETRY
    };
}
function cleanZone(zoneId) {
    return {
        type: CLEAN_ZONE,
        zoneId
    };
}
function zoneChange(id, features, value) {
    return {
        type: ZONE_CHANGE,
        id,
        features,
        value

    };
}
function gridHeight(height) {
    return {
        type: GRID_HEIGHT,
        height
    };
}
function zoneSelected(zone, value) {
    return (dispatch) => {
        // clean previous geometry
        if (zone.active && value && value.value && value.value.length > 0 &&
            value.feature && value.feature.length > 0) {
            dispatch(cleanGeometry());
        }
        if (value && value.value && value.value.length === 0) {
            dispatch(onResetThisZone(zone.id, false));
        }
        // if there is a value in the zoneField update the geometry
        if (value && value.value && value.value.length > 0 &&
            value.feature && value.feature.length > 0) {

            dispatch(zoneChange(zone.id, value.feature, value.value));
            dispatch(setActiveZone(zone.id, zone.exclude));
        }
    };
}

function clearAll(zone) {
    return (dispatch) => {
        dispatch(cleanZone(zone.id));
    };
}

function getNumberOfFeatures(layer) {
    let url = layer.url.replace('wms', 'ows');
    let params = {
        service: "WFS",
        request: "getFeature",
        version: "1.1.0",
        resultType: "hits",
        typeNames: layer.name
    };
    return (dispatch) => {
        return axios.get(url, {params: params}, {
                timeout: 15000,
                headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'}
            }).then((response) => {
                let config = response.data;
                let s = config.indexOf("numberOfFeatures");
                if (s !== -1) {
                    let value = parseInt(config.substring(s + 18, config.indexOf('"', s + 19)), 10);
                    dispatch(changeLayerProperties(layer.id, {numberOfFeatures: value}));
                }
            });
    };
}

function changeDownloadFormat(format) {
    return {
        type: CHANGE_DOWNLOAD_FORMAT,
        format
    };

}

function zoneGetValues(url, filter, id) {
    return (dispatch) => {
        return axios.post(url, filter, {
            timeout: 20000,
            headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'}
        }).then((response) => {
            let config = response.data;
            if (typeof config !== "object") {
                try {
                    config = JSON.parse(config);
                } catch(e) {
                    dispatch(zoneSearchError('Search result broken (' + url + ":   " + filter + '): ' + e.message, id));
                }
            }

            dispatch(zoneFilter(config, id));
            dispatch(zoneSearch(false, id));
        }).catch((e) => {
            dispatch(zoneSearchError(e, id));
        });
    };
}

function downloadSelectedFeatures(url, filter) {
    return (dispatch) => {
        return axios.post(url, filter, {
            timeout: 30000,
            headers: {'Content-Type': 'application/force-download'}
        }).then((response) => {
            let fileName = response.headers["content-disposition"].split("=")[1];
            let contentType = response.headers["content-type"];
            FileUtils.download(response.data, fileName, contentType);
        }).catch((e) => {
            dispatch(featureSelectorError("Error during wfs request " + (e.statusText || e.message || e.code)));
        });
    };
}

function resetAllFilters() {
    return (dispatch) => {
        dispatch({
            type: 'ZONES_RESET'
        });
        dispatch({
            type: RESET_ALL_FILTERS
        });
    };
}

module.exports = {
    SWITCH_LAYER,
    SET_ACTIVE_ZONE,
    CHANGE_LAYER_PROPERTIES,
    STATS_LOADING,
    CHANGE_DOWNLOAD_FORMAT,
    LOADING_SELECT_ALL,
    CLEAN_GEOMETRY,
    CLEAN_ZONE,
    RESET_ALL_FILTERS,
    GRID_HEIGHT,
    resetAllFilters,
    cleanZone,
    clearAll,
    cleanGeometry,
    changeLhtacLayerFilter,
    switchLayer,
    setActiveZone,
    changeDownloadFormat,
    getNumberOfFeatures,
    zoneGetValues,
    downloadSelectedFeatures,
    zoneSelected,
    gridHeight
};
