/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {PanelGroup, ButtonToolbar, Button, Glyphicon, Alert} = require('react-bootstrap');
const FilterUtils = require('../../MapStore2/web/client/utils/FilterUtils');
const LhtacFilterUtils = require('../utils/LhtacFilterUtils');
const SimpleFilterField = require('../../MapStore2/web/client/components/data/query/SimpleFilterField');
const Spinner = require('react-spinkit');

const AdvancedFilter = React.createClass({
    propTypes: {
        params: React.PropTypes.object,
        filterstatus: React.PropTypes.bool,
        fieldsConfig: React.PropTypes.array,
        loading: React.PropTypes.bool,
        baseCqlFilter: React.PropTypes.string,
        simpleFilterFieldUpdate: React.PropTypes.func,
        toggleFilter: React.PropTypes.func,
        changeLayerProperties: React.PropTypes.func,
        createFilterConfig: React.PropTypes.func,
        activeLayer: React.PropTypes.object,
        error: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.bool, React.PropTypes.object]),
        showDefaultVisibility: React.PropTypes.func
    },
    contextTypes: {
        messages: React.PropTypes.object

    },
    getDefaultProps() {
        return {
            params: {},
            filterstatus: false,
            fieldsConfig: [],
            loading: true,
            baseCqlFilter: "INCLUDE",
            activeLayer: {},
            error: false,
            simpleFilterFieldUpdate: () => {},
            toggleFilter: () => {},
            changeLayerProperties: () => {},
            createFilterConfig: () => {},
            showDefaultVisibility: () => {}
        };
    },
    componentDidMount() {
        this.initializeFilters(this.props);
    },
    componentWillReceiveProps(props) {
        this.initializeFilters(props);
    },
    renderSimpleFilterFields() {
        let fields = [...this.props.fieldsConfig].sort((a, b) => {
            return parseInt(a.fieldId, 10) - parseInt(b.fieldId, 10);
        });
        return fields.map((f) => {
            return (<SimpleFilterField key={f.fieldId || f.attribute} updateFilter={this.props.simpleFilterFieldUpdate} {...f}/>);
        });
    },
    renderLoading() {
        return (
                <div style={{position: "relative", left: "45%"}}>
                <Spinner spinnerName="wordpress" noFadeIn/>
                </div>
            );
    },
    renderMessage() {
        return (!this.props.error) ? (
                <Alert style={{fontSize: 14}}>Add or change area/filter</Alert>
                ) : (
                <Alert bsStyle="danger" style={{fontSize: 14}}>Error getting fields options values from the server. Try again resetting area/filter</Alert>
                );
    },
    renderFields() {
        return (this.props.fieldsConfig.length > 0 && !this.props.error) ? (
            <div className="lhtac-panel">
             <PanelGroup style={{fontSize: 14}}>
                {this.renderSimpleFilterFields()}
                <ButtonToolbar style={{ marginTop: 10, "float": "right"}}>
                    <Button onClick={this.setFilter}
                    disabled={this.props.fieldsConfig.findIndex((f) => {
                        return f.exception;
                    }) !== -1}
                    ><Glyphicon glyph="search"/><strong>Filter</strong></Button>
                    <Button onClick={this.removeFilter}
                    disabled={!this.props.filterstatus}><Glyphicon glyph="remove"/><strong>Reset</strong></Button>
                </ButtonToolbar>
             </PanelGroup>
            </div>
        ) : this.renderMessage();
    },
    render() {
        return (this.props.loading) ? this.renderLoading() : this.renderFields();
    },
    shouldUpdateFilterFields(props) {
        // active layer is present, advancedFilter has a fieldsConfig, it is not loading
        // and the fieldsConfig are not loaded or the layer has changed
        return props.activeLayer
            && props.activeLayer.advancedFilter && props.activeLayer.advancedFilter.fieldsConfig
            && !props.loading && ( props.fieldsConfig.length === 0 || props.activeLayer.id !== this.props.activeLayer.id );
    },
    initializeFilters(props) {
        // ////////////////////////////////////////////////////////////////////
        // WPS request to retrieve attribute values for the advanced filter
        // ////////////////////////////////////////////////////////////////////
        if (this.shouldUpdateFilterFields(props)) {
            props.activeLayer.advancedFilter.fieldsConfig.map((field) => {
                let wpsRequest = LhtacFilterUtils.getWpsRequest(props.activeLayer.name, props.activeLayer.advancedFilter.cql || "INCLUDE", field.attribute);
                props.createFilterConfig(wpsRequest, props.activeLayer.advancedFilter.searchUrl, field);
            });
        }
    },
    setFilter() {
        if (this.props.fieldsConfig && this.props.fieldsConfig && this.props.fieldsConfig.length > 0) {
            this.props.showDefaultVisibility();
            let filter = this.props.baseCqlFilter + " AND " + FilterUtils.toCQLFilter({simpleFilterFields: this.props.fieldsConfig});
            this.props.toggleFilter(true, filter);
            let params = {...this.props.params, cql_filter: filter};
            this.props.changeLayerProperties(this.props.activeLayer, {params: params}, this.props.baseCqlFilter);
        }
    },
    removeFilter() {
        this.props.showDefaultVisibility();
        this.props.toggleFilter(false);
        let params = {...this.props.params, cql_filter: this.props.baseCqlFilter};
        this.props.changeLayerProperties(this.props.activeLayer, {params: params}, this.props.baseCqlFilter);
    }

});

module.exports = AdvancedFilter;
