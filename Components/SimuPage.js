import React from 'react';
import { StyleSheet, View, Text, Button, PermissionsAndroid, ImageBackground, BackHandler } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryTheme, VictoryLabel, VictoryLine, VictoryVoronoiContainer, createContainer, VictoryZoomContainer, VictoryTooltip, VictoryGroup } from "victory-native";
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
const url = "https://enjl220ffgif30o.m.pipedream.net";


const requestLocationPermission = async () => {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (!granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Position permission denied");
    }
};

const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

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
            fixed_graph: true
        }
        this.defaultValues = { "@setting_number": 15, "@setting_age": 30, "@setting_deviceName": "HC-05", "@setting_fixedGraph": true, "@setting_sendData": true };
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
        let fakeData = (Math.random() * 255).toFixed(2);
        let receptionTime = +new Date;
        this.setState({
            unansweredCalls: 0,
            valuesReceived: this.state.valuesReceived + 1,
            data: [...this.state?.data, { x: this.state.valuesReceived, PM25: parseFloat(fakeData), PM1: parseFloat((fakeData * Math.random()).toFixed(2)), timestamp: receptionTime }]
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
            axios({ method: 'post', url: url, data: body }).catch((e) => Toast.showShortBottom("Could not send data to internet, please check your network"));
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
                axios({ method: 'post', url: url, data: body }).catch((e) => Toast.showShortBottom("Could not send data to internet, please check your network"));
            }
            catch (e) {
                console.log(e)
            }
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

    async componentDidMount() {
        this.backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            this.props.navigation.goBack
        );
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
        })
        let setting_number = await this.getMyStringValue("@setting_number");
        let setting_age = await this.getMyStringValue("@setting_age");
        let fixed_graph = await this.getMyStringValue("@setting_fixedGraph");
        let sendData = await this.getMyStringValue("@setting_sendData");
        this.setState({ number: setting_number });
        this.setState({ age: setting_age });
        this.setState({ fixed_graph: String(fixed_graph) == 'true' });
        this.setState({ sendData: String(sendData) == 'true' });
        await requestLocationPermission();
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position })
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        const startTime = new Date();
        this.generateFakeData();
        const intervalId = BackgroundTimer.setInterval(() => {
            this.generateFakeData();
        }, 2000);
    }

    render() {
        return (
            <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                <Text style={styles.textPM}>PM2.5 : {this.state.data[this.state.data.length - 1]?.PM25} µg/m³</Text>
                <Text style={styles.textPM}>PM1 : {this.state.data[this.state.data.length - 1]?.PM1} µg/m³</Text>
                <VictoryChart
                    style={styles.chart}
                    theme={VictoryTheme.material}
                    containerComponent={<VictoryVoronoiContainer voronoiDimension="x" />}
                    /*containerComponent={
                        <VictoryVoronoiContainer
                            labels={({ datum }) => `PM 1 : ${datum.PM1}, PM 2.5 : ${datum.PM25}`}
                            labelComponent={
                                <VictoryTooltip
                                    style={{ fontSize: 10 }}
                                />}
                        //allowZoom={false}
                        />

                    }*/>


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
                    <VictoryGroup
                        labels={({ datum }) => `PM 2.5 : ${datum.PM25}`}
                        labelComponent={
                            <VictoryTooltip
                                style={{ fontSize: '15px' }}
                                renderInPortal={false}
                                size={40}
                                constrainToVisibleArea
                            />}
                        offset={1000}
                    >
                        <VictoryLine
                            data={this.state.data}
                            interpolation="natural"
                            y="PM25"
                            domain={{ y: this.state.fixed_graph ? [0, 300] : null }}
                            style={{ data: { stroke: "#80cc24" } }}
                        />
                    </VictoryGroup>
                    <VictoryGroup
                        labels={({ datum }) => `PM 1 : ${datum.PM1}`}
                        labelComponent={
                            <VictoryTooltip
                                style={{ fontSize: '15px' }}
                                renderInPortal={false}
                                constrainToVisibleArea
                            />}
                        offset={1000}
                    >
                        <VictoryLine
                            data={this.state.data}
                            interpolation="natural"
                            y="PM1"
                            domain={{ y: this.state.fixed_graph ? [0, 300] : null }}
                            style={{ data: { stroke: "#eb9b34" } }}
                        />
                    </VictoryGroup>
                </VictoryChart>
                <Button
                    title="Changer les paramètres"
                    color="#80cc24"
                    onPress={() => this.props.navigation.navigate("SettingsPage", { defaultValues: this.defaultValues, updateSettings: this.updateSettings })}
                />
                <Text style={styles.textWhite}>Age maximal des données : {this.state.age}</Text>
                <Text style={styles.textWhite}>Envoi des données toutes les : {this.state.number}</Text>
            </ImageBackground>
        )
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
    chart: {
        flex: 1,
    },
    textWhite: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 20,
        padding: 10
    },
    textPM: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 37,
        padding: 5
    }
});

export default SimuPage