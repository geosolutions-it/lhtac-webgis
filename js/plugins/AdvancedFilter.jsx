/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const assign = require('object-assign');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const lhtac = require('../selectors/lhtac');

const {Glyphicon} = require('react-bootstrap');

const {
    simpleFilterFieldUpdate
} = require('../../MapStore2/web/client/actions/queryform');

const {
    toggleFilter,
    createFilterConfig
} = require('../actions/advancedfilter');

const {
    changeLhtacLayerFilter
} = require('../actions/lhtac');

const {changeLayerProperties} = require('../../MapStore2/web/client/actions/layers');

const AdvancedFilterSelector = createSelector([
        lhtac,
        (state) => (state.queryform),
        (state) => (state.advancedfilter),
        (state) => (state.queryform.spatialField),
        (state) => (state.map || {})
        ],
        (lhtacState, queryform, advancedFilter) => ({
            activeLayer: lhtacState.activeLayer,
            fieldsConfig: queryform && queryform.simpleFilterFields || [],
            loading: advancedFilter && advancedFilter.requests.length > 0,
            filterstatus: advancedFilter && advancedFilter.filterstatus,
            spatialField: queryform.spatialField,
            baseCqlFilter: advancedFilter && advancedFilter.baseCqlFilter,
            error: advancedFilter && advancedFilter.error
        }));

const AdvancedFilter = connect(AdvancedFilterSelector, {
    simpleFilterFieldUpdate,
    changeLayerProperties: changeLhtacLayerFilter,
    showDefaultVisibility: changeLayerProperties.bind(null, "featureselector", {visibility: true}),
    toggleFilter,
    createFilterConfig
})(require('../components/AdvancedFilter'));

module.exports = {
    AdvancedFilterPlugin: assign(AdvancedFilter, {
        DrawerMenu: {
            name: 'advancedfilter',
            position: 5,
            icon: <Glyphicon glyph="glyphicon glyphicon-tasks"/>,
            title: 'advancedfilter',
            priority: 2
        }
    }),
    reducers: {
        advancedfilter: require('../reducers/advancedfilter')
    }
};
