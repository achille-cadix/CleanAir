import React from 'react';
import { StyleSheet, View, Text, Button, TouchableHighlight, TouchableOpacity } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import { Buffer } from "buffer";


class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEnabled: false,
            device: null,
            devices: [],
            scanning: false,
            processing: false,
            unPairedDevices: [],
            hc05ID: null,
            connected: false
        };
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
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
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

    requestDataFromHC05 = async => {
        this.write(this.state.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.state.hc05ID).then((data) => {
            Toast.showShortBottom(data);
        });
    };

    write = async (id, message) => {
        try {
            await BluetoothSerial.device(id).write(message);
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
    };

    connectToHC05 = async () => {
        try {
            let hc05ID = this.state.devices.find(x => x.name === "HC-05").id;
            this.setState({
                hc05ID: hc05ID
            });
            await this.connect(hc05ID);
            if (this.state.connected) {
                this.props.navigation.navigate("ChartPage", { hc05ID: this.state.hc05ID });
            }
            else {
                Toast.showShortBottom("Unable to connect to HC05 module");
            }
        }
        catch (e) {
            Toast.showShortBottom(e.message);
        }
    }

    render() {
        return (
            <View>
                <Button
                    title="Connect to HC-05"
                    onPress={this.connectToHC05}
                />
            </View>
        )
    }




}

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    engine: {
        position: 'absolute',
        right: 0,
    },
    body: {
        backgroundColor: Colors.white,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
});

export default HomePage;
