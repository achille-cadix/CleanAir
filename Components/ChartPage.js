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

class ChartPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            startTime: null,
            location: null,
            valuesReceived: 1,
            number: 15,
            age: 30,
            unansweredCalls: 0
        }
        this.defaultValues = { "@setting_number": 15, "@setting_age": 30, "@device_name": "HC-05" };
    }

    getMyStringValue = async (item) => {
        try {
            stringValue = await AsyncStorage.getItem(item)
            return stringValue != null ? stringValue : this.defaultValues[item]
        } catch (e) {
            console.log(e)
        }
    }

    requestDataFromHC05 = async () => {
        if (this.state.unansweredCalls > 5) {
            const connected = await BluetoothSerial.device(this.props.navigation.state.params.deviceID).connect();
            console.log('trying to reconnect')
            if (connected) {
                this.setState({ unansweredCalls: 0 });
            }
        }
        else {
            this.write(this.props.navigation.state.params.deviceID, "8");
            BluetoothSerial.readFromDevice(this.props.navigation.state.params.deviceID).then((response) => {
                if (response && response > 0 && response < 300) {
                    let receptionTime = +new Date;
                    this.setState({
                        unansweredCalls: 0,
                        valuesReceived: this.state.valuesReceived + 1,
                        data: [...this.state.data, { x: this.state.valuesReceived, y: parseFloat(response), timestamp: receptionTime }]
                    });
                    try {
                        this.sendDataToURL(this.state.data[this.state.data.length - 1]);
                        this.sendMeanValueToURL();
                    }
                    catch (e) {
                        console.log(e);
                    }

                }
                else {
                    console.log('no response')
                    this.setState({ unansweredCalls: this.state.unansweredCalls + 1 });
                }
                this.limitToTime();
            });
        }
    };

    disconnect = async id => {
        this.setState({ processing: true });

        try {
            await BluetoothSerial.device(id).disconnect();

            this.setState(({ devices, device }) => ({
                processing: false,
                device: {
                    ...device,
                    connected: false
                },
                devices: devices.map(v => {
                    if (v.id === id) {
                        return {
                            ...v,
                            connected: false
                        };
                    }

                    return v;
                })
            }));
        } catch (e) {
            Toast.showShortBottom(e.message);
            this.setState({ processing: false });
        }
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

    write = async (id, message) => {
        try {
            await BluetoothSerial.device(id).write(message);
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
    };

    updateSettings = (number, age) => {
        this.setState({
            data: [],
            valuesReceived: 1,
            number: number,
            age: age
        });
        this.forceUpdate();
    }

    async componentDidMount() {
        let setting_number = await this.getMyStringValue("@setting_number");
        let setting_age = await this.getMyStringValue("@setting_age");
        this.setState({ number: setting_number });
        this.setState({ age: setting_age })
        await requestLocationPermission();
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position })
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        const startTime = new Date();
        this.write(this.props.navigation.state.params.deviceID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.deviceID).then((response) => {
            this.setState({
                data: [...this.state.data, { x: 0, y: response, timestamp: startTime }],
                startTime: startTime
            });
        })
        this.requestDataFromHC05();
        const intervalId = BackgroundTimer.setInterval(() => {
            this.requestDataFromHC05();
        }, 2000);
    }

    render() {
        return (
            <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                <Text style={styles.textWhite}>Proportion de particules PM2.5 : {this.state.data[this.state.data.length - 1]?.y} µg/m³</Text>
                <VictoryChart style={styles.chart} theme={VictoryTheme.material}>
                    <VictoryAxis
                        tickLabelComponent={<VictoryLabel dy={0} dx={10} angle={55} />}
                        style={{
                            axis: {
                                stroke: 'white'  //CHANGE COLOR OF X-AXIS
                            },
                            tickLabels: {
                                fill: 'white' //CHANGE COLOR OF X-AXIS LABELS
                            },
                            grid: {
                                stroke: 'white', //CHANGE COLOR OF X-AXIS GRID LINES
                                strokeDasharray: '7',
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
                        domain={{ y: [0, 300] }}
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
    }
});

export default ChartPage