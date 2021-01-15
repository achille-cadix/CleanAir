import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    FlatList,
    Button,
    TouchableHighlight
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import { Buffer } from "buffer";

class ChartPage extends React.Component {
    constructor(props) {
        super(props);
    }

    requestDataFromHC05 = async => {
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((data) => {
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

    render() {
        return (
            <Text>
                Chart
                <Button
                    title="Read data from HC05"
                    onPress={this.requestDataFromHC05}
                />
            </Text>
        )
    }
}

export default ChartPage