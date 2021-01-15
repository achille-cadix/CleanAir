import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, Button, TouchableHighlight } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryLabel } from "victory-native";
import Toast from "react-native-toast";
import BluetoothSerial, {
    withSubscription
} from "react-native-bluetooth-serial-next";

class ChartPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            startTime: null
        }
    }

    requestDataFromHC05 = async => {
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((response) => {
            if (response && response > 0 && response < 300) {
                let receptionTime = this.state.data.length + 1;
                this.setState({
                    data: [...this.state.data, { x: receptionTime, y: parseInt(response) }]
                })
            }
        });
    };

    write = async (id, message) => {
        try {
            await BluetoothSerial.device(id).write(message);
        } catch (e) {
            Toast.showShortBottom(e.message);
        }
    };

    componentDidMount() {
        const startTime = new Date();
        this.write(this.props.navigation.state.params.hc05ID, "8");
        BluetoothSerial.readFromDevice(this.props.navigation.state.params.hc05ID).then((response) => {
            this.setState({
                data: [...this.state.data, { x: 0, y: response }],
                startTime: startTime
            });
        })
        this.requestDataFromHC05();
        setInterval(this.requestDataFromHC05, 2000);
    }

    render() {
        return (
            <View>
                <Text>
                    Chart
                <Button
                        title="Read data from HC05"
                        onPress={this.requestDataFromHC05}
                    />
                </Text>
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