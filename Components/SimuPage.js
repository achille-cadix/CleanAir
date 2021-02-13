import React from 'react';
import { StyleSheet, View, Text, Button, PermissionsAndroid, ImageBackground } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryTheme, VictoryLabel, VictoryArea } from "victory-native";
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = "https://enjl220ffgif30o.m.pipedream.net";


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
            fixed_graph: true
        }
        this.defaultValues = { "@setting_number": 15, "@setting_age": 30, "@setting_deviceName": "HC-05", "@setting_fixedGraph": true };
    }

    getMyStringValue = async (item) => {
        try {
            stringValue = await AsyncStorage.getItem(item)
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
            data: [...this.state?.data, { x: this.state.valuesReceived, y: parseFloat(fakeData), timestamp: receptionTime }]
        });
        try {
            this.sendDataToURL(this.state.data[this.state.data.length - 1]);
            this.sendMeanValueToURL();
        }
        catch (e) {
            console.log(e);
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
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position });
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        let body = {
            PM25: data.y,
            timestamp: data.timestamp,
            longitude: this.state.location.coords.longitude,
            latitude: this.state.location.coords.latitude,
        };
        console.log(body);
        axios({ method: 'post', url: url, data: body });
    }

    sendMeanValueToURL = async () => {
        if ((this.state.valuesReceived % this.state.number) === 0 && this.state.data.length >= this.state.number) {
            await Geolocation.getCurrentPosition((position) => {
                this.setState({ location: position });
            },
                (error) => console.log(new Date(), error),
                { enableHighAccuracy: false, timeout: 5000 });
            let cleanedData = this.state.data.filter(x => { if (typeof (x.y) == 'number') { return x } });
            let meanPM25 = cleanedData.reduce((acc, e) => (acc + e.y), 0) / cleanedData.length;
            let timestamp = this.state.data[this.state.data.length - 1]?.timestamp;
            let body = {
                PM25Mean: meanPM25,
                timestamp: timestamp,
                longitude: this.state.location.coords.longitude,
                latitude: this.state.location.coords.latitude,
            };
            console.log(body);
            axios({ method: 'post', url: url, data: body });
        }
    }

    updateSettings = (number, age, fixed_graph) => {
        this.setState({
            data: [],
            valuesReceived: 1,
            number: number,
            age: age,
            fixed_graph: fixed_graph
        });
        this.forceUpdate();
    }

    async componentDidMount() {
        let setting_number = await this.getMyStringValue("@setting_number");
        let setting_age = await this.getMyStringValue("@setting_age");
        let fixed_graph = await this.getMyStringValue("@setting_fixedGraph");
        this.setState({ number: setting_number });
        this.setState({ age: setting_age });
        this.setState({ fixed_graph: String(fixed_graph) == 'true' });
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
                <Text style={styles.textPM25}>PM2.5 : {this.state.data[this.state.data.length - 1]?.y} µg/m³</Text>
                <VictoryChart style={styles.chart} theme={VictoryTheme.material}>
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
                    <VictoryArea
                        data={this.state.data}
                        interpolation="natural"
                        domain={{ y: this.state.fixed_graph ? [0, 300] : null }}
                        style={{ data: { fill: "#80cc24" } }}

                    />
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
    textPM25: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 40,
        padding: 10
    }
});

export default SimuPage