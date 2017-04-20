/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {connect} = require('react-redux');
const assign = require('object-assign');

const {Glyphicon} = require('react-bootstrap');
const {createSelector} = require('reselect');
const lhtac = require('../selectors/lhtac');

const {bindActionCreators} = require('redux');

const {
    removeSpatialSelection,
    zoneSearch,
    zoneChange,
    resetZones
} = require('../../MapStore2/web/client/actions/queryform');

const {
    setBaseCqlFilter
} = require('../actions/advancedfilter');

const {
    setActiveZone,
    zoneSelected,
    changeLhtacLayerFilter,
    zoneGetValues,
    clearAll,
    cleanZone
    } = require('../actions/lhtac');

const {
    onResetThisZone
} = require('../actions/queryform');

const {
    changeZoomArgs
} = require('../actions/areafilter');

const {changeMapView} = require('../../MapStore2/web/client/actions/map');
const {changeLayerProperties} = require('../../MapStore2/web/client/actions/layers');

const SpatialFilterSelector = createSelector([
        (state) => (state.queryform),
        (state) => (state.tasks)
        ],
        (queryform, tasks) => ({
            useMapProjection: queryform.useMapProjection,
            spatialField: queryform.spatialField,
            showDetailsPanel: queryform.showDetailsPanel,
            withContainer: queryform.withContainer,
            spatialMethodOptions: queryform.spatialMethodOptions,
            spatialOperations: queryform.spatialOperations,
            loadingZones: Object.keys(tasks).filter((task) => task.indexOf('zoneChange') === 0 && tasks[task].running).reduce((previous, current) => {
                return assign(previous, {
                    [current.substring('zoneChange'.length)]: true
                });
            }, {})
        }));

const SpatialFilter = connect(SpatialFilterSelector, (dispatch) => {
    return {
        actions: bindActionCreators({
            onRemoveSpatialSelection: removeSpatialSelection,
            zoneFilter: zoneGetValues,
            zoneSearch,
            setActiveZone,
            zoneSelected,
            cleanZone,
            clearAll,
            zoneChange
        }, dispatch)
    };
})(require('../components/LhtacSpatialFilter'));

const WMSCrossSelector = createSelector([
        lhtac,
        (state) => (state.queryform.spatialField),
        (state) => (state.map || {}),
        (state) => (state.mapInitialConfig || {}),
        (state) => (state.areafilter),
        (state) => (state && state.queryform && state.queryform.simpleFilterFields),
        (state) => (state && state.advancedfilter && state.advancedfilter.filterstatus)
        ],
        (lhtacState, spatialField, mapConfig, mapInitialConfig, areafilter, filterFields, filterStatus) => ({
            activeLayer: lhtacState.activeLayer,
            toolbarEnabled: true,
            spatialField,
            mapConfig,
            mapInitialConfig,
            filterFields,
            filterStatus,
            zoomArgs: areafilter.zoomArgs
        }));

const WMSCrossLayerFilter = connect( WMSCrossSelector, (dispatch) => {
    return {
        actions: bindActionCreators({
            changeLayerProperties,
            onQuery: changeLhtacLayerFilter,
            onReset: resetZones,
            onResetThisZone,
            changeZoomArgs,
            changeMapView,
            setBaseCqlFilter
        }, dispatch)
    };
})(require('../components/WMSCrossLayerFilter'));

const AreaFilterPlugin = React.createClass({
    propTypes: {
        expanded: React.PropTypes.bool,
        pinned: React.PropTypes.bool,
        onToggle: React.PropTypes.func,
        onPin: React.PropTypes.func,
        height: React.PropTypes.string
    },
    getDefaultProps() {
        return {
            expanded: true,
            pinned: false,
            onToggle: () => {},
            onPin: () => {},
            height: "100%"
        };
    },
    render() {
        return (
            <div id="areaFilter" className="lhtac-panel">
                <SpatialFilter/>
                <WMSCrossLayerFilter
                    filterType={"OGC"}/>
            </div>
        );
    }
});

module.exports = {
    AreaFilterPlugin: assign(AreaFilterPlugin, {
        DrawerMenu: {
            name: 'areafilter',
            position: 4,
            icon: <Glyphicon glyph="glyphicon glyphicon-filter"/>,
            title: 'areafilter',
            priority: 2
        }
    }),
    reducers: {
        areafilter: require('../reducers/areafilter'),
        tasks: require('../../MapStore2/web/client/reducers/tasks')
    }
};
