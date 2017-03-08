/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 **/

const {
    END_DRAWING
} = require('../../MapStore2/web/client/actions/draw');
const {
    FEATURES_LOADED,
    NEW_GETFEATURE_REQUEST,
    FEATURE_SELECTOR_ERROR,
    FEATURE_SELECTOR_RESET
} = require('../actions/featureselector');
const {
    GRID_HEIGHT
} = require('../actions/lhtac');
const assign = require('object-assign');
// since 4.0.0
const {xorBy} = require('lodash');

const initialState = {gridHeight: 0, geometry: null, features: [], request: {}, error: false};

function featureLoaded(add, newFeatures = [], previousFeatures) {
    return (add) ? xorBy(newFeatures, previousFeatures, (obj) => obj.id) : newFeatures;
}

function featureselector(state = initialState, action) {
    switch (action.type) {
        case END_DRAWING: {
            return assign({}, state, {geometry: action.geometry, geometryOwner: action.owner, geometryStatus: "created"});
        }
        case FEATURES_LOADED: {
            let req = {...state.request, state: "loaded"};
            let features = featureLoaded(action.add, action.features, state.features);
            return assign({}, state, {features: features, geometryStatus: "consumed", request: req});

        }
        case NEW_GETFEATURE_REQUEST: {
            return {...state, geometryStatus: "consumed", error: false, request: {id: action.reqId, state: "loading", filter: action.filter }};
        }
        case FEATURE_SELECTOR_ERROR: {
            return {...state, error: action.error, geometryStatus: "consumed", geometry: undefined, request: {}};
        }
        case 'ZONES_RESET': {
            return initialState;
        }
        case 'ON_RESET_THIS_ZONE': {
            return (action.reload) ? initialState : {...state};
        }
        case 'BASE_CQL_FILTER': {
            return initialState;
        }
        case 'TOGGLE_FILTER': {
            return initialState;
        }
        case FEATURE_SELECTOR_RESET: {
            return initialState;
        }
        case GRID_HEIGHT: {
            return assign({}, state, {gridHeight: action.height});
        }
        default:
            return state;
    }
}

module.exports = featureselector;
