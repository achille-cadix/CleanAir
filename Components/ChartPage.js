import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, Button, PermissionsAndroid } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryLabel } from "victory-native";
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';

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
            location: null
        }
    }

    requestDataFromHC05 = async => {
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((response) => {
            if (response && response > 0 && response < 300) {
                let position = this.state.data.length + 1;
                let receptionTime = new Date();
                this.setState({
                    data: [...this.state.data, { x: position, y: parseInt(response) }]
                });
                this.sendDataToURL(parseInt(response), receptionTime)
            }
        });
    };

    sendDataToURL = async (sensorData, timestamp) => {
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position })
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        let body = {
            PM25: sensorData,
            timestamp: timestamp,
            longitude: this.state.location.coords.longitude,
            latitude: this.state.location.coords.latitude,
        };
        console.log(body);
        axios({ method: 'post', url: url, data: body });
    }

    write = async (id, message) => {
        try {
            await BluetoothSerial.device(id).write(message);
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
    };

    async componentDidMount() {
        await requestLocationPermission();
        await Geolocation.getCurrentPosition((position) => {
            this.setState({ location: position })
        },
            (error) => console.log(new Date(), error),
            { enableHighAccuracy: false, timeout: 5000 });
        const startTime = new Date();
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((response) => {
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
            <View>
                <View style={styles.container}>
                    <VictoryChart width={350} theme={VictoryTheme.material}>
                        <VictoryLine
                            data={this.state.data}
                            interpolation="natural"
                            domain={{ y: [0, 300] }}
                            labels={({ datum }) => datum.y}
                            labelComponent={<VictoryLabel dy={-20} />}

                        />
                    </VictoryChart>
                </View>
                <Button
                    title="Log location"
                    onPress={this.sendDataToURL}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5fcff"
    }
});

export default ChartPage