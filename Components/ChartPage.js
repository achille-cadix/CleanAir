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
            age: 30
        }
        this.defaultValues = { "@setting_number": 15, "@setting_age": 30 };
    }

    getMyStringValue = async (item) => {
        try {
            stringValue = await AsyncStorage.getItem(item)
            return stringValue != null ? stringValue : this.defaultValues[item]
        } catch (e) {
            console.log(e)
        }
    }

    requestDataFromHC05 = async => {
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((response) => {
            if (response && response > 0 && response < 300) {
                let receptionTime = +new Date;
                this.setState({
                    valuesReceived: this.state.valuesReceived + 1,
                    data: [...this.state.data, { x: this.state.valuesReceived, y: parseInt(response), timestamp: receptionTime }]
                });
                try {
                    this.sendDataToURL(this.state.data[this.state.data.length - 1]);
                }
                catch (e) {
                    console.log(e);
                }
            }
            this.limitToOneMinute();
            this.sendMeanValueToURL();
        });
    };

    limitToOneMinute = async () => {
        if (this.state.data.length > 1) {
            let lastData = this.state.data[this.state.data.length - 1];
            newData = this.state.data.filter(x => { if (lastData.timestamp - x.timestamp < 30000) { return x } })
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
        if (this.state.valuesReceived % 5 === 0) {
            await Geolocation.getCurrentPosition((position) => {
                this.setState({ location: position });
            },
                (error) => console.log(new Date(), error),
                { enableHighAccuracy: false, timeout: 5000 });
            let cleanedData = this.state.data.filter(x => { if (typeof (x.y) == 'number') { return x } });
            let meanPM25 = cleanedData.reduce((acc, e) => (acc + e.y), 0) / cleanedData.length;
            let timestamp = +new Date();
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
        setting_number = await this.getMyStringValue("@setting_number");
        setting_age = await this.getMyStringValue("@setting_age");
        this.setState({ number: setting_number });
        this.setState({ age: setting_age })
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
                    title="Changer les paramètres"
                    onPress={() => this.props.navigation.navigate("SettingsPage", { defaultValues: this.defaultValues, updateSettings: this.updateSettings })}
                />
                <Text>Age maximal des données : {this.state.age}</Text>
                <Text>Nombre maximal de données : {this.state.number}</Text>
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