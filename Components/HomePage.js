import React from 'react';
import { StyleSheet, View, Text, Button, ImageBackground, TouchableOpacity, Image } from 'react-native';
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import AsyncStorage from '@react-native-async-storage/async-storage';

function hideToasts() {
    Toast.hide();
}

class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEnabled: false,
            deviceName: "HC-05",
            devices: [],
            scanning: false,
            processing: false,
            unpairedDevices: [],
            deviceID: null,
            connected: false
        };
        this.defaultValues = {
            "@setting_number": 15,
            "@setting_age": 30,
            "@setting_deviceName": "HC-05",
            "@setting_fixedGraph": true,
            "@setting_sendData": true
        };
    }

    requestEnable = () => async () => {
        try {
            await BluetoothSerial.requestEnable();
            this.setState({ isEnabled: true });
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
        }
    };

    toggleBluetooth = async value => {
        try {
            if (value) {
                await BluetoothSerial.enable();
            } else {
                await BluetoothSerial.disable();
            }
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
        }
    };

    listDevices = async () => {
        try {
            const list = await BluetoothSerial.list();

            this.setState(({ devices }) => ({
                devices: devices?.map(device => {
                    const found = list.find(v => v.id === device.id);

                    if (found) {
                        return {
                            ...found,
                            paired: true,
                            connected: false
                        };
                    }

                    return device;
                })
            }));
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
        }
    };

    getDeviceName = async () => { //Function that fetches the expected name of the Bluetooth defice
        try {
            stringValue = await AsyncStorage.getItem("@device_name")
            return stringValue != null ? stringValue : "HC-05"
        } catch (e) {
            console.log(e)
        }
    }

    discoverUnpairedDevices = async () => {
        this.setState({ scanning: true });
        try {
            const unpairedDevices = await BluetoothSerial.discoverUnpairedDevices();
            console.log('discovered devices', unpairedDevices)

            this.setState(({ devices }) => ({
                scanning: false,
                unpairedDevices: unpaireddevices?.map(device => ({
                    ...device,
                    paired: false,
                    connected: false
                }))
            }))
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);

            this.setState(({ devices }) => ({
                scanning: false,
                devices: devices.filter(device => device.paired || device.connected)
            }));
        }
    };

    cancelDiscovery = () => async () => {
        try {
            await BluetoothSerial.cancelDiscovery();
            this.setState({ scanning: false });
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
        }
    };

    toggleDevicePairing = async ({ id, paired }) => {
        if (paired) {
            await this.unpairDevice(id);
        } else {
            await this.pairDevice(id);
        }
    };

    pairDevice = async id => {
        this.setState({ processing: true });
        try {

            const paired = await BluetoothSerial.pairDevice(id);
            if (paired) {
                hideToasts();
                Toast.showShortBottom(
                    `Device ${paired.name}<${paired.id}> paired successfully`
                );

                this.setState(({ devices, device }) => ({
                    processing: false,
                    device: {
                        ...device,
                        ...paired,
                        paired: true
                    },
                    devices: devices?.map(v => {
                        if (v.id === paired.id) {
                            return {
                                ...v,
                                ...paired,
                                paired: true
                            };
                        }

                        return v;
                    })
                }));
            } else {
                hideToasts();
                Toast.showShortBottom(`Device <${id}> pairing failed`);
                this.setState({ processing: false });
            }
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
            this.setState({ processing: false });
        }
    };

    toggleDeviceConnection = async ({ id, connected }) => {
        if (connected) {
            await this.disconnect(id);
        } else {
            await this.connect(id);
        }
    };

    connect = async id => {
        this.setState({ processing: true });

        try {
            const connected = await BluetoothSerial.device(id).connect();

            if (connected) {
                hideToasts();
                Toast.showShortBottom(
                    `Connected to device ${connected.name}<${connected.id}>`
                );

                this.setState(({ devices, device }) => ({
                    processing: false,
                    device: {
                        ...device,
                        ...connected,
                        connected: true
                    },
                    connected: true,
                    devices: devices?.map(v => {
                        if (v.id === connected.id) {
                            return {
                                ...v,
                                ...connected,
                                connected: true
                            };
                        }

                        return v;
                    })
                }));
            } else {
                hideToasts();
                Toast.showShortBottom(`Failed to connect to device <${id}>`);
                this.setState({ processing: false, connected: false });
            }
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
            this.setState({ processing: false });
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
                devices: devices?.map(v => {
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
            hideToasts();
            Toast.showShortBottom(e.message);
            this.setState({ processing: false });
        }
    };

    connectToDevice = async () => {
        try {
            if (this.state.deviceID) {
                await this.connect(this.state.deviceID);
                if (this.state.connected) {
                    this.props.navigation.navigate("ChartPage", { deviceID: this.state.deviceID, connect: this.connect });
                }
                else {
                    hideToasts();
                    Toast.showShortBottom("Unable to connect to Bluetooth device");
                    this.connectToDevice();
                }
            }
            else {
                hideToasts();
                Toast.showShortBottom("HC05 not found or paired, check if it and the Bluetooth is turned on, or wait for pairing");
            }
        }
        catch (e) {
            hideToasts();
            Toast.showShortBottom("HC05 not found or paired, check if it and the Bluetooth is turned on, or wait for pairing");
        }
    }

    updateSettings = (deviceName) => {
        this.setState({ deviceName: deviceName });
        this.forceUpdate();
    }

    pairToDevice = async () => {
        if (this.state.deviceID === null || this.state.deviceID === undefined) {
            await this.discoverUnpairedDevices();
            let deviceID = this.state.unpairedDevices.find(x => x.name === this.state.deviceName)?.id;
            if (deviceID) {
                await this.pairDevice(deviceID);
                this.setState({ deviceID: deviceID });
                this.connectToDevice();
            }
            else {
                hideToasts();
                Toast.showShortBottom("HC05 not found during scan, re-trying")
                this.pairToDevice();
            }
        }
    }

    async componentDidMount() {
        try {
            const [isEnabled, devices] = await Promise.all([
                BluetoothSerial.isEnabled(),
                BluetoothSerial.list(),
            ]);

            this.setState({
                isEnabled,
                devices: devices?.map(device => ({
                    ...device,
                    paired: true,
                    connected: false
                }))
            });
            let deviceName = await this.getDeviceName();
            this.setState({ deviceName: deviceName })
            let deviceID = this.state.devices.find(x => x.name === this.state.deviceName)?.id;
            this.setState({ deviceID: deviceID });
            if (deviceID) {
                this.connectToDevice();
            }
            else {
                hideToasts();
                Toast.showShortBottom(this.state.deviceName + ' not paired or found, please wait for automatic connection');
                this.pairToDevice();
            }
        } catch (e) {
            hideToasts();
            Toast.showShortBottom(e.message);
        }
    }

    render() {
        return (
            <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                <TouchableOpacity
                    onPress={() => this.props.navigation.navigate("SettingsPage", { defaultValues: this.defaultValues, updateSettings: this.updateSettings, origin: "HomePage" })}
                    style={styles.icon_button}
                >
                    <Image
                        source={require('../assets/icons/settings-gears.png')}
                        style={styles.icon} />
                    <View style={{ flex: 5 }}></View>
                </TouchableOpacity>
                <View style={{ flex: 7, flexDirection: 'column', alignItems: 'center' }}>
                    <Button
                        title="Simulateur"
                        onPress={() => { this.props.navigation.navigate("SimuPage", { hc05ID: this.state.deviceID, }) }}
                    />
                    <TouchableOpacity
                        onPress={this.connectToDevice}
                        style={styles.touchableOpacity}
                    >
                        <View style={styles.touchableInside}>
                            <Image style={styles.pmImage} source={require('../assets/pictures/PMSensor.png')} />
                            <Text style={styles.textTitle}>Connect to {this.state.deviceName}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        )
    }
}

const styles = StyleSheet.create({
    pmImage: {
        flex: 1,
        alignSelf: 'center'
    },
    image: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        alignItems: 'center',
        flexDirection: 'column'
    },
    touchableInside: {
        flex: 1,
        //backgroundColor: "#80cc24",
    },
    touchableOpacity: {
        flex: 1,
        alignSelf: 'center',
        alignItems: 'center',
        //backgroundColor: "#80cc24",
        justifyContent: 'center',
        flexDirection: 'row'
    },
    textTitle: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 30,
        flex: 1,
        alignSelf: 'center'
    },
    icon: {
        width: 70,
        height: 70,
        flex: 1,
        padding: 7
    },
    icon_button: {
        flex: 1,
        flexDirection: "row",
        padding: 5
    }
});

export default HomePage;
