/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


const React = require('react');
const {reactCellRendererFactory} = require('ag-grid-react');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {isEqual} = require('lodash');
const FeatureGrid = require('../../MapStore2/web/client/components/data/featuregrid/FeatureGrid');
const {updateHighlighted } = require('../../MapStore2/web/client/actions/highlight');
const lhtac = require('../selectors/lhtac');
const BooleanCellRenderer = require('../components/BooleanCellRenderer');
const assign = require("object-assign");
const {changeMapStyle} = require('../../MapStore2/web/client/actions/map');
const {gridHeight} = require('../actions/lhtac');

const LhtacFeatureGrid = React.createClass({
    propTypes: {
        style: React.PropTypes.object,
        features: React.PropTypes.array,
        highlightedFeatures: React.PropTypes.array,
        updateHighlighted: React.PropTypes.func,
        activeLayer: React.PropTypes.object,
        mapStyle: React.PropTypes.object,
        mapStateSource: React.PropTypes.string,
        changeMapStyle: React.PropTypes.func,
        gridHeight: React.PropTypes.func,
        height: React.PropTypes.number,
        mapSize: React.PropTypes.object
    },
    contextTypes: {
        messages: React.PropTypes.object
    },
    getDefaultProps() {
        return {
            style: {
                height: 0,
                width: "100%"
            },
            features: [],
            updateHighlighted: () => {},
            mapStyle: {},
            mapStateSource: "",
            changeMapStyle: () => {},
            gridHeight: () => {},
            height: 0,
            mapSize: {}
        };
    },
    shouldComponentUpdate(nextProps) {
        return nextProps.update &&
            (
                // removed to get the grid to update more often
                /*(!this.highlighted || this.highlighted.toString() !== nextProps.highlightedFeatures.toString()) ||*/
            nextProps.style !== this.props.style || (!isEqual(nextProps.features, this.props.features)) || true);
    },
    componentDidUpdate(prevProps) {

        if (prevProps.mapSize.height !== this.props.mapSize.height) {
            this.resizePanel();
        }

        if (prevProps.height !== this.props.height) {
            this.props.changeMapStyle(this.props.mapStyle, this.props.mapStateSource);
        }
    },
    render() {
        // Adding the cellRenderer only to the following 3 properties that are booelan fields (instead of false there is null.
        // So when the value is null it returns "false" otherwise "true")
        let newColumnsDef = this.props.activeLayer && this.props.activeLayer.columnDefs || [];
        // let fieldsToTransform = ["properties.intersection_related", "properties.impaired", "properties.lane_dep"];
        let newColumns = newColumnsDef.map((col) => {
            return (col.type !== undefined && col.type === "boolean") ?
                assign({}, col, {cellRenderer: reactCellRendererFactory(BooleanCellRenderer)}) :
                col;
        });

        return (this.props.features.length > 0) ? (
            <FeatureGrid
                style={{width: '100%', height: this.props.height}}
                features={this.props.features}
                selectFeatures={this.highligthFeatures}
                highlightedFeatures={this.props.highlightedFeatures}
                enableZoomToFeature={false}
                columnDefs={newColumns}
                excludeFields={this.props.activeLayer.excludeFields}
                agGridOptions={{headerHeight: 48, onModelUpdated: this.resizePanel}}
                toolbar={{zoom: false, exporter: false, toolPanel: false}}
            />
            ) : null;
    },
    highligthFeatures(features) {
        let newFeatures = features.map(f => {return f.id; });
        this.highlighted = newFeatures;
        this.props.updateHighlighted(newFeatures, 'update');
    },
    resizePanel() {
        let h = document.getElementById('south-panel').clientHeight - 5;
        this.props.gridHeight(h);
    }
});

const selector = createSelector([
    (state) => (state.featureselector.features || []),
    (state) => (state.highlight.features),
    (state) => (state.map.present.style),
    (state) => (state.map.present.mapStateSource),
    (state) => (state.featureselector.gridHeight),
    (state) => (state.map.present.size || {width: 0, height: 0}),
    lhtac],
    (features, highlightedFeatures, mapStyle, mapStateSource, height, mapSize, lhtacState)=> ({
        features,
        highlightedFeatures,
        mapStyle,
        mapStateSource,
        height,
        mapSize,
        activeLayer: lhtacState.activeLayer
    }));
module.exports = connect(selector, {
    updateHighlighted,
    changeMapStyle,
    gridHeight
})(LhtacFeatureGrid);
