/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const {Panel, PanelGroup, ListGroup, ListGroupItem, Button, OverlayTrigger, Tooltip} = require('react-bootstrap');

const Message = require('../../MapStore2/web/client/components/I18N/Message');

const Spinner = require('react-spinkit');
const DownlodFormatSelector = require('./DownlodFormatSelector');
const Legend = require('../../MapStore2/web/client/components/TOC/fragments/legend/Legend');

const LhtacFilterUtils = require('../utils/LhtacFilterUtils');

const Statistics = React.createClass({
    propTypes: {
        activeLayer: React.PropTypes.object,
        selectedfeatures: React.PropTypes.object,
        highlightedfeatures: React.PropTypes.array,
        loading: React.PropTypes.bool,
        highlightStatus: React.PropTypes.func,
        featureSelectorReset: React.PropTypes.func,
        changeDownloadFormat: React.PropTypes.func,
        downloadFormat: React.PropTypes.string,
        height: React.PropTypes.number,
        getNumberOfFeatures: React.PropTypes.func,
        downloadSelectedFeatures: React.PropTypes.func
    },
    getDefaultProps() {
        return {
            loading: false,
            downloadFormat: "csv",
            selectedfeatures: {},
            highlightedfeatures: [],
            activeLayer: {
                url: '',
                statistics: [],
                legend: {
                    height: 20,
                    width: 20,
                    options: ""
                }
            },
            changeDownloadFormat: () => {},
            highlightStatus: () => {},
            featureSelectorReset: () => {},
            getNumberOfFeatures: () => {},
            downloadSelectedFeatures: () => {}
        };
    },
    getInitialState() {
        return { activeKey: '1'};
    },
    componentDidMount() {
        if (this.props.activeLayer.numberOfFeatures === undefined || this.props.activeLayer.numberOfFeatures === null) {
            this.props.getNumberOfFeatures(this.props.activeLayer);
        }
    },
    componentDidUpdate() {
        if (this.props.activeLayer.numberOfFeatures === undefined || this.props.activeLayer.numberOfFeatures === null) {
            this.props.getNumberOfFeatures(this.props.activeLayer);
        }
    },
    render() {
        this.baseUrl = this.props.activeLayer.url.replace('wms', 'ows');
        let wfsUrl = this.baseUrl + "?service=WFS&request=getFeature&version=1.1.0";
        wfsUrl += "&typeNames=" + this.props.activeLayer.name;
        wfsUrl += "&outputFormat=" + this.props.downloadFormat;

        let selectedFilterLink = {};
        let highlightedFilterLink = {};

        if (this.props.activeLayer.params &&
            this.props.activeLayer.params.cql_filter &&
            this.props.highlightedfeatures.length > 0) {
            highlightedFilterLink.href = wfsUrl + "&FEATUREID=" + this.props.highlightedfeatures.join(",");
        }

        // needs to be checked also if there the request is correct and without errors
        if (this.props.selectedfeatures &&
            this.props.selectedfeatures.features.length > 0 &&
            this.props.selectedfeatures.request) {
            // the wfsFilterBody is built from the list of the features in featureselector
            const attributeName = this.props.activeLayer.fidAttributeName;
            this.wfsFilterBody = LhtacFilterUtils.processOGCIdFilter(this.props.selectedfeatures.features, attributeName, "OR", "1.1.0");
        }
        if (this.props.selectedfeatures.features.length > 0) {
            selectedFilterLink.onClick = () => { this.downloadFile(); };
        }

        return (
            <div className="lhtac-panel">
                <div>
                    <PanelGroup activeKey={this.state.activeKey}
                        onSelect={(activeKey) => {this.setState({activeKey}); }} accordion>
                    <Panel eventKey="1"
                    header="Download and statistics" collapsible>
                        <div style={{ height: 60}}>
                            <label><Message msgId="lhtac.downloadFormatLabel"/></label>
                            <DownlodFormatSelector
                                format={this.props.downloadFormat}
                                onChange={this.props.changeDownloadFormat}
                                />
                        </div>
                        <ListGroup className="lhtac-group-list">
                            <ListGroupItem key={1}>All: {this.props.activeLayer.numberOfFeatures}</ListGroupItem>
                            <ListGroupItem
                                key={2}
                                className={""}
                                {...selectedFilterLink}
                                style={(this.props.selectedfeatures.features.length) ? {"color": "blue", "fontSize": "14px !important", "borderRadius": 0} : {}} download>
                                    {this.props.loading ? (<div><span>Selected: </span><div style={{"float": "right"}}><Spinner spinnerName="circle" noFadeIn/></div></div>) : ("Selected:" + " " + this.props.selectedfeatures.features.length)}
                            </ListGroupItem>
                            <ListGroupItem
                                key={3}
                                {...highlightedFilterLink}
                                style={(this.props.highlightedfeatures.length) ? {color: "blue"} : {}} download>
                                    {this.props.loading ? (<div><span>Highlighted: </span><div style={{"float": "right"}}><Spinner spinnerName="circle" noFadeIn/></div></div>) : ("Highlighted:" + " " + this.props.highlightedfeatures.length)}
                            </ListGroupItem>
                            {
                                this.props.activeLayer.statistics.map((stat) => {
                                    let link = (stat.value) ? {href: wfsUrl + "&cql_filter=" + stat.filter} : {};

                                    return stat.excepiton ? (
                                        <OverlayTrigger
                                            key={stat.id}
                                            placement="bottom"
                                            overlay={(<Tooltip id={"stat-" + stat.id + "-tooltip"}><Message msgId="lhtac.statsexcepiton"/></Tooltip>)}>
                                                <ListGroupItem
                                                style={{color: "red"}}
                                                >
                                                {stat.name}
                                            </ListGroupItem>
                                        </OverlayTrigger>
                                    ) : (
                                        <ListGroupItem
                                        key={stat.id}
                                        style={(stat.value) ? {color: "blue"} : {}}
                                        {...link} download>
                                            {this.props.loading ? (<div><span>{stat.name}</span><div style={{"float": "right"}}><Spinner spinnerName="circle" noFadeIn/></div></div>) : (stat.name + " " + stat.value)}
                                        </ListGroupItem>
                                    );
                                })
                            }
                        </ListGroup>
                    </Panel>
                    <Panel eventKey="2"
                        style={{marginTop: "15px"}}
                        header={this.props.activeLayer.title} collapsible>
                        <Legend
                            layer={this.props.activeLayer}
                            legendHeigth={this.props.activeLayer.legend.height || 20}
                            legendWidth={this.props.activeLayer.legend.width || 20}
                            legendOptions={this.props.activeLayer.legend.options}/>
                    </Panel>
                    </PanelGroup>
                </div>

                <Button style={{marginTop: "5px", "float": "right"}} onClick={this.resetStatistics}>
                       Clear Selections
                </Button>

                <form ref="download" action={this.baseUrl} onsubmit="window.open('', this.target); return true;" method="post" encType="application/x-www-form-urlencoded">
                    <input type="hidden" name="filter" value={this.wfsFilterBody}/>
                    <input type="hidden" name="version" value="1.1.0"/>
                    <input type="hidden" name="request" value="GetFeature"/>
                    <input type="hidden" name="service" value="WFS"/>
                    <input type="hidden" name="srsName" value="EPSG:4326"/>
                    <input type="hidden" name="typeNames" value={this.props.activeLayer.name}/>
                    <input type="hidden" name="outputFormat" value={this.props.downloadFormat}/>
                </form>
            </div>
        );
    },
    downloadFile() {
        this.refs.download.submit();
    },
    resetStatistics() {
        this.props.featureSelectorReset();
        this.props.highlightStatus("disabled");
    }
});

module.exports = Statistics;
