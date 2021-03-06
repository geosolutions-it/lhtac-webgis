/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
    NEW_VALUES_REQUEST,
    VALUES_LOADED,
    VALUES_LOAD_ERROR,
    TOGGLE_FILTER,
    BASE_CQL_FILTER
} = require('../actions/advancedfilter');

const RESET_ALL_FILTERS = require('../actions/lhtac');
const {REMOVE_ALL_SIMPLE_FILTER_FIELDS} = require('../../MapStore2/web/client/actions/queryform');
const initialState = {requests: [], error: false, filterstatus: false, baseCqlFilter: "INCLUDE" };

function advancedfilter(state = initialState, action) {
    switch (action.type) {
        case VALUES_LOAD_ERROR: {
            const requests = state.requests.filter((r) => { return r !== action.reqId; });
            return {...state, requests: requests, error: action.error};
        }
        case VALUES_LOADED: {
            const requests = state.requests.filter((r) => { return r !== action.reqId; });
            return {...state, requests: requests};
        }
        case NEW_VALUES_REQUEST: {
            const requests = (state.requests) ? [...state.requests, action.reqId] : [action.reqId];
            return {...state, requests: requests};
        }
        case TOGGLE_FILTER: {
            return {...state, filterstatus: action.status};
        }
        case BASE_CQL_FILTER: {
            return {...state, baseCqlFilter: action.cql, error: false};
        }
        case REMOVE_ALL_SIMPLE_FILTER_FIELDS: {
            return {...state, error: false};
        }
        case RESET_ALL_FILTERS: {
            return {...state, error: false};
        }
        case 'ON_RESET_THIS_ZONE': {
            return (action.reload) ? {...state, error: false} : {...state};
        }
        case 'SWITCH_LAYER': {
            return initialState;
        }
        default:
            return state;
    }
}

module.exports = advancedfilter;
