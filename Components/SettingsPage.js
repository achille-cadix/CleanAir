import React from 'react';
import { StyleSheet, ScrollView, View, Text, FlatList, Button, TouchableHighlight } from 'react-native';
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";
import { Buffer } from "buffer";

class SettingsPage extends React.Component {
    render() {
        return (
            <Text>
                Settings
            </Text>
        )
    }
}

export default SettingsPage