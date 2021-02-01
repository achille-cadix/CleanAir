import React from 'react';
import { StyleSheet, View, Text, Button, ImageBackground, TouchableOpacity, Image } from 'react-native';
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";


class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEnabled: false,
            device: null,
            devices: [],
            scanning: false,
            processing: false,
            unpairedDevices: [],
            hc05ID: null,
            connected: false
        };
    }

    requestEnable = () => async () => {
        try {
            await BluetoothSerial.requestEnable();
            this.setState({ isEnabled: true });
        } catch (e) {
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
            Toast.showShortBottom(e.message);
        }
    };

    listDevices = async () => {
        try {
            const list = await BluetoothSerial.list();

            this.setState(({ devices }) => ({
                devices: devices.map(device => {
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
            Toast.showShortBottom(e.message);
        }
    };

    discoverUnpairedDevices = async () => {
        this.setState({ scanning: true });
        try {
            const unpairedDevices = await BluetoothSerial.discoverUnpairedDevices();
            console.log('discovered devices', unpairedDevices)

            this.setState(({ devices }) => ({
                scanning: false,
                unpairedDevices: unpairedDevices.map(device => ({
                    ...device,
                    paired: false,
                    connected: false
                }))
            }))
        } catch (e) {
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
                    devices: devices.map(v => {
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
                Toast.showShortBottom(`Device <${id}> pairing failed`);
                this.setState({ processing: false });
            }
        } catch (e) {
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
                    devices: devices.map(v => {
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
                Toast.showShortBottom(`Failed to connect to device <${id}>`);
                this.setState({ processing: false, connected: false });
            }
        } catch (e) {
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

    connectToHC05 = async () => {
        try {
            await this.connect(this.state.hc05ID);
            if (this.state.connected) {
                this.props.navigation.navigate("ChartPage", { hc05ID: this.state.hc05ID, connect: this.connect });
            }
            else {
                Toast.showShortBottom("Unable to connect to HC05 module");
                this.connectToHC05();
            }
        }
        catch (e) {
            Toast.showShortBottom("HC05 not found or paired, check if it is turned on, or wait for pairing");
        }
    }

    pairToHC05 = async () => {
        if (this.state.hc05ID === null || this.state.hc05ID === undefined) {
            await this.discoverUnpairedDevices();
            let hc05ID = this.state.unpairedDevices.find(x => x.name === "HC-05")?.id;
            if (hc05ID) {
                await this.pairDevice(hc05ID);
                this.setState({ hc05ID: hc05ID });
                this.connectToHC05();
            }
            else {
                Toast.showShortBottom("HC05 not found during scan, re-trying")
                this.pairToHC05();
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
                devices: devices.map(device => ({
                    ...device,
                    paired: true,
                    connected: false
                }))
            });
            let hc05ID = this.state.devices.find(x => x.name === "HC-05")?.id;
            this.setState({
                hc05ID: hc05ID
            });
            if (hc05ID) {
                this.connectToHC05();
            }
            else {
                Toast.showShortBottom('HC05 not paired or found, please wait for automatic connection');
                this.pairToHC05();
            }
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
    }

    render() {
        return (
            <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
                    <Button
                        title="Simulateur"
                        onPress={() => { this.props.navigation.navigate("SimuPage", { hc05ID: this.state.hc05ID, }) }}
                    />
                    <TouchableOpacity
                        onPress={this.connectToHC05}
                        style={styles.touchableOpacity}
                    >
                        <View style={styles.touchableInside}>
                            <Image style={styles.pmImage} source={require('../assets/pictures/PMSensor.png')} />
                            <Text style={styles.textTitle}>Connect to HC-05</Text>
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
    }
});

export default HomePage;
