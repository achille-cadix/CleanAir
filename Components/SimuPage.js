import React from 'react';
import { StyleSheet, View, Text, PermissionsAndroid, ImageBackground, BackHandler, TouchableOpacity, Image, Button, TouchableOpacityBase } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryTheme, VictoryLabel, VictoryLine, VictoryZoomContainer } from "victory-native";
import Toast from "react-native-toast";
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
const url = "https://enjl220ffgif30o.m.pipedream.net";
import Spinner from "react-native-spinkit";

function hideToasts() {
    Toast.hide();
}

const requestLocationPermission = async () => {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (!granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Position permission denied");
    }
};

class SimuPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            startTime: null,
            location: null,
            valuesReceived: 1,
            number: 15,
            age: 30,
            unansweredCalls: 0,
            fixed_graph: true,
            settings_loaded: false,
            zoomDomain: {
                x: [0, 20], y: [0, 300]
            },
            autoPan: true,
            backGroundTask: null
        }
        this.defaultValues = {
            "@setting_number": 15,
            "@setting_age": 30,
            "@setting_deviceName": "HC-05",
            "@setting_fixedGraph": true,
            "@setting_sendData": true
        };
    }

    getMyStringValue = async (item) => {
        try {
            stringValue = await AsyncStorage.getItem(item);
            return stringValue != null ? stringValue : this.defaultValues[item]
        } catch (e) {
            console.log(e)
        }
    }

    generateFakeData = async () => {
        let fakeData = (Math.random() * 255).toFixed(0);
        let receptionTime = +new Date;
        this.setState({
            unansweredCalls: 0,
            valuesReceived: this.state.valuesReceived + 1,
            data: [...this.state?.data, { x: this.state.valuesReceived, PM25: parseFloat(fakeData), PM1: parseFloat((fakeData * Math.random()).toFixed(0)), timestamp: receptionTime }]
        });
        if (this.state.sendData) {
            try {
                this.sendDataToURL(this.state.data[this.state.data.length - 1]);
                this.sendMeanValueToURL();
            }
            catch (e) {
                console.log(e);
            }
        }
        this.limitToTime();
    };

    limitToTime = async () => {
        if (this.state.data.length > 1) {
            let lastData = this.state.data[this.state.data.length - 1];
            let newData = this.state.data.filter(x => { if (lastData.timestamp - x.timestamp < this.state.age * 1000) { return x } })
            this.setState({ data: newData });
        }
    }

    sendDataToURL = async (data) => {
        try {
            await Geolocation.getCurrentPosition((position) => {
                this.setState({ location: position });
            },
                (error) => console.log(new Date(), error),
                { enableHighAccuracy: false, timeout: 5000 });
        }
        catch (e) {
            if (e instanceof TypeError) {
                hideToasts();
                Toast.showShortBottom("Location not found, please check that your location is activated");
            }
            console.log(e);
        }
        try {
            let body = {
                PM25: data.PM25,
                PM1: data.PM1,
                timestamp: data.timestamp,
                longitude: this.state.location.coords.longitude,
                latitude: this.state.location.coords.latitude,
            };
            console.log(body);
            axios({ method: 'post', url: url, data: body }).catch((e) => {
                hideToasts();
                Toast.showShortBottom("Could not send data to internet, please check your network");
            });
        }
        catch (e) {
            console.log(e)
        }
    }

    sendMeanValueToURL = async () => {
        if ((this.state.valuesReceived % this.state.number) === 0 && this.state.data.length >= this.state.number) {
            try {
                await Geolocation.getCurrentPosition((position) => {
                    this.setState({ location: position });
                },
                    (error) => console.log(new Date(), error),
                    { enableHighAccuracy: false, timeout: 5000 });
            }
            catch (e) {
                if (e instanceof TypeError) {
                    hideToasts();
                    Toast.showShortBottom("Location not found, please check that your location is activated");
                }
                console.log(e);
            }
            let cleanedPM25 = this.state.data.filter(x => { if (typeof (x.PM25) == 'number') { return x } });
            let cleanedPM1 = this.state.data.filter(x => { if (typeof (x.PM1) == 'number') { return x } });
            let meanPM25 = cleanedPM25.reduce((acc, e) => (acc + e.PM25), 0) / cleanedPM25.length;
            let meanPM1 = cleanedPM1.reduce((acc, e) => (acc + e.PM1), 0) / cleanedPM1.length;
            let timestamp = this.state.data[this.state.data.length - 1]?.timestamp;
            try {
                let body = {
                    PM25Mean: meanPM25.toFixed(2),
                    PM1Mean: meanPM1.toFixed(2),
                    timestamp: timestamp,
                    longitude: this.state.location.coords.longitude,
                    latitude: this.state.location.coords.latitude,
                }
                console.log(body);
                axios({ method: 'post', url: url, data: body }).catch((e) => {
                    hideToasts();
                    Toast.showShortBottom("Could not send data to internet, please check your network");
                });
            }
            catch (e) {
                console.log(e)
            }
        }
    }

    handleZoomChange = (domain, maxRightZoom) => {
        console.log(domain, maxRightZoom)
        if (Math.abs(maxRightZoom.x[0] - domain.x[0]) < 1) { // Condition if both values are closed : engage magnetism
            this.setState({
                zoomDomain: maxRightZoom,
                autoPan: true
            }),
                console.log("locked")
        }
        else {
            this.setState({ zoomDomain: domain, autoPan: false })
        }
    }

    updateSettings = (number, age, fixed_graph, sendData) => {
        this.setState({
            data: [],
            valuesReceived: 1,
            number: number,
            age: age,
            fixed_graph: fixed_graph,
            sendData: sendData
        });
        this.forceUpdate();
    }

    handleLeave = async () => {
        BackgroundTimer.clearInterval(this.state.backGroundTask);
        this.setState({ backGroundTask: null });
        this.backHandler.remove();
        this.props.navigation.goBack();
    }

    async componentDidMount() {
        this.backHandler = BackHandler.addEventListener(
            "hardwareBackPress", this.handleLeave
        );
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
        })
        let setting_number = await this.getMyStringValue("@setting_number");
        let setting_age = await this.getMyStringValue("@setting_age");
        let fixed_graph = await this.getMyStringValue("@setting_fixedGraph");
        let sendData = await this.getMyStringValue("@setting_sendData");
        this.setState({
            number: setting_number,
            age: setting_age,
            fixed_graph: String(fixed_graph) == 'true',
            sendData: String(sendData) == 'true',
            settings_loaded: true
        });
        await requestLocationPermission();
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position })
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        const startTime = new Date();
        this.generateFakeData();
        this.setState({
            backGroundTask: BackgroundTimer.setInterval(() => {
                this.generateFakeData();
            }, 2000)
        })
    }

    backToCurrent = () => {
        if (!this.state.autoPan) {
            return (
                <TouchableOpacity
                    style={styles.goBackButton_enabled}
                    onPress={
                        () => {
                            this.setState({ autoPan: true })
                        }
                    }
                >
                    <Text style={styles.goBackButtonText}>Return to current values</Text>
                </TouchableOpacity>
            )
        }
        else {
            return (
                <View
                    style={styles.goBackButton_disabled}

                >
                    <Text style={styles.goBackButtonText}>Live values displayed</Text>
                </View>
            )
        }
    }

    render() {
        const maxRightZoom = {
            x: [
                this.state.data[this.state.data.length - 1]?.x > 20 ? this.state.data[this.state.data.length - 1]?.x - 20 : 0,
                this.state.data[this.state.data.length - 1]?.x > 20 ? this.state.data[this.state.data.length - 1]?.x : 20
            ],
            y: [0, 300]
        }
        if (!this.state.settings_loaded) {
            return (
                <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                    <Spinner type="FadingCircleAlt" color="#80cc24" size={90} />
                </ImageBackground>
            )
        }
        else {
            return (
                <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                    <TouchableOpacity
                        onPress={() => this.props.navigation.navigate("SettingsPage", { defaultValues: this.defaultValues, updateSettings: this.updateSettings, origin: "ChartPage" })}
                        style={styles.icon_button}
                    >
                        <Image
                            source={require('../assets/icons/settings_btn.png')}
                            style={styles.icon} />
                        <View style={{ flex: 10 }}></View>
                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        <Text style={styles.textPM25}>PM2.5 : {this.state.data[this.state.data.length - 1]?.PM25} µg/m³</Text>
                        <Text style={styles.textPM1}>PM1 : {this.state.data[this.state.data.length - 1]?.PM1} µg/m³</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        {this.backToCurrent()}
                        <VictoryChart
                            style={styles.chart}
                            theme={VictoryTheme.material}
                            containerComponent={
                                <VictoryZoomContainer
                                    allowZoom={false}
                                    allowPan={this.state.data.length > 20}
                                    onZoomDomainChange={(domain) => { this.handleZoomChange(domain, maxRightZoom) }}
                                    zoomDomain={this.state.autoPan ? maxRightZoom : this.state.zoomDomain}
                                /*zoomDomain={{
                                    x: [
                                        this.state.data[this.state.data.length - 1]?.x > 20 ? this.state.data[this.state.data.length - 1]?.x - 20 : 0,
                                        this.state.data[this.state.data.length - 1]?.x > 20 ? this.state.data[this.state.data.length - 1]?.x : 20
                                    ]
                                }}*/
                                />}
                        >
                            <VictoryAxis
                                tickLabelComponent={<VictoryLabel dy={0} dx={10} angle={55} />}
                                tickFormat={(x) => ''} // Values displayed on the X axis
                                style={{
                                    axis: {
                                        stroke: 'white'  //CHANGE COLOR OF X-AXIS
                                    },
                                    tickLabels: {
                                        fill: 'white' //CHANGE COLOR OF X-AXIS LABELS
                                    },
                                    grid: {
                                        stroke: 'none' //CHANGE COLOR OF X-AXIS GRID LINES
                                    }
                                }}
                            />
                            <VictoryAxis
                                dependentAxis
                                tickFormat={(y) => y}
                                style={{
                                    axis: {
                                        stroke: 'white'  //CHANGE COLOR OF Y-AXIS
                                    },
                                    tickLabels: {
                                        fill: 'white' //CHANGE COLOR OF Y-AXIS LABELS
                                    },
                                    grid: {
                                        stroke: 'white', //CHANGE COLOR OF Y-AXIS GRID LINES
                                        strokeDasharray: '7',
                                    }
                                }}
                            />
                            <VictoryLine
                                data={this.state.data}
                                interpolation="natural"
                                y="PM25"
                                domain={{ y: this.state.fixed_graph ? [0, 300] : null }}
                                style={{ data: { stroke: "#80cc24" } }}
                            />
                            <VictoryLine
                                data={this.state.data}
                                interpolation="natural"
                                y="PM1"
                                domain={{ y: this.state.fixed_graph ? [0, 300] : null }}
                                style={{ data: { stroke: "#eb9b34" } }}
                            />
                        </VictoryChart >
                    </View>
                </ImageBackground >
            )
        }
    }
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        alignItems: 'center'
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5fcff"
    },
    chartContainer: {
        flex: 7,
        flexDirection: "column",
        alignItems: "flex-end"
    },
    chart: {
        flex: 1
    },
    goBackButton_enabled: {
        width: 220,
        height: 50,
        justifyContent: "center",
        backgroundColor: "#80cc24",
        marginTop: 5,
        marginBottom: -30,
        marginRight: 20
    },
    goBackButton_disabled: {
        width: 220,
        height: 50,
        justifyContent: "center",
        backgroundColor: "grey",
        marginTop: 5,
        marginBottom: -30,
        marginRight: 20
    },
    goBackButtonText: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 20,
        padding: 2,
        textAlign: "center"
    },
    textWhite: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 20,
        justifyContent: "center"
    },
    textContainer: {
        flex: 1,
        marginTop: 0
    },
    textPM25: {
        color: '#80cc24',
        fontFamily: 'sharetech',
        fontSize: 23,
        marginBottom: 0,
        flex: 1
    },
    textPM1: {
        color: '#eb9b34',
        fontFamily: 'sharetech',
        fontSize: 23,
        marginBottom: 0,
        flex: 1
    },
    icon: {
        height: 25,
        flex: 1,
        margin: -1
    },
    icon_button: {
        flex: 1,
        flexDirection: "row",
        padding: 20
    }
});

export default SimuPage