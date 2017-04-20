/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {intersection, difference} = require('lodash');
const LOAD_FEATURES = 'LOAD_FEATURES';
const FEATURES_LOADED = 'FEATURES_LOADED';
const NEW_GETFEATURE_REQUEST = 'NEW_GETFEATURE_REQUEST';
const FEATURE_SELECTOR_ERROR = 'FEATURE_SELECTOR_ERROR';
const FEATURE_SELECTOR_RESET = 'FEATURE_SELECTOR_RESET';
const uuid = require('node-uuid');
const axios = require('../../MapStore2/web/client/libs/ajax');
const {updateHighlighted} = require('../../MapStore2/web/client/actions/highlight');
const {changeLayerProperties} = require('../../MapStore2/web/client/actions/layers');
function featureSelectorReset() {
    return {
        type: FEATURE_SELECTOR_RESET
    };
}
function newGetFeatureRequest(reqId, filter) {
    return {
        type: NEW_GETFEATURE_REQUEST,
        reqId,
        filter
    };
}

function featuresLoaded(features, reqId, add = false) {
    return {
        type: FEATURES_LOADED,
        features,
        reqId,
        add
    };
}

function featureSelectorError(error) {
    return {
        type: FEATURE_SELECTOR_ERROR,
        error
    };
}

function updateHighlightedFeatures(state, config, dispatch) {
    if (state) {
        let newFeatures = config.features.map(f => {return f.id; });
        let oldHighlighted = state.highlight.features;
        let intersectionOldNew = intersection(oldHighlighted, newFeatures );
        let newHighligthed = difference(oldHighlighted, intersectionOldNew);
        dispatch(updateHighlighted(newHighligthed, "update"));
    }
}
function checkFeatureLimit(reqId, add, max, state, config, dispatch) {
    if (config.totalFeatures && config.totalFeatures > max) {
        dispatch(featureSelectorError(`Too Many features selected (${config.totalFeatures}). Please select ${max} features or less`));
    } else {
        dispatch(featuresLoaded(config.features, reqId, add));
        updateHighlightedFeatures(state, config, dispatch);
    }
}
function loadFeatures(url, filter, add, max) {
    const reqId = uuid.v1();
    return (dispatch, getState) => {
        dispatch(changeLayerProperties("featureselector", {visibility: true}));
        dispatch(newGetFeatureRequest(reqId, filter));
        return axios.post(url, filter, {
            timeout: 10000,
            headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'}
        }).then((response) => {
            let config = response.data;
            let state = getState && getState();
            if (typeof config !== "object") {
                try {
                    config = JSON.parse(config);
                    checkFeatureLimit(reqId, add, max, state, config, dispatch);

                } catch(e) {
                    dispatch(featureSelectorError('Search result broken (' + url + ":   " + filter + '): ' + e.message));
                }
            }else {
                checkFeatureLimit(reqId, add, max, state, config, dispatch);
            }
        }).catch((e) => {
            dispatch(featureSelectorError("Error during wfs request " + (e.statusText || e.message || e.code)));
        });
    };
}

module.exports = {
    LOAD_FEATURES,
    FEATURES_LOADED,
    NEW_GETFEATURE_REQUEST,
    FEATURE_SELECTOR_ERROR,
    FEATURE_SELECTOR_RESET,
    loadFeatures,
    featuresLoaded,
    featureSelectorError,
    featureSelectorReset
};
