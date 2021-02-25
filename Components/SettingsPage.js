import React from 'react';
import Slider from '@react-native-community/slider';
import { StyleSheet, View, Text, Button, ImageBackground, TextInput, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast";
import CheckBox from '@react-native-community/checkbox';
import Spinner from "react-native-spinkit";

class SettingsPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            number: 15,
            age: 30,
            deviceName: "HC-05",
            fixed_graph: true,
            settings_loaded: false
        };
        this.defaultValues = { "@setting_number": 15, "@setting_age": 30, "@setting_deviceName": "HC-05", "@setting_fixedGraph": true, "@setting_sendData": true };
    }

    storeData = async (item, value) => {
        try {
            await AsyncStorage.setItem(item, value.toString());
        } catch (e) {
            console.log(e)
        }
    }



    getMyStringValue = async (item) => {
        try {
            stringValue = await AsyncStorage.getItem(item)
            return stringValue != null ? stringValue : this.props.navigation.state.params.defaultValues[item]
        } catch (e) {
            console.log(e)
        }
    }

    handleLeave = async () => {
        this.props.navigation.state.params.updateSettings(this.state.number, this.state.age, this.state.fixed_graph, this.state.sendData);
        await this.storeData('@setting_number', this.state.number);
        await this.storeData('@setting_age', this.state.age);
        await this.storeData('@setting_deviceName', this.state.deviceName);
        await this.storeData('@setting_fixedGraph', this.state.fixed_graph);
        await this.storeData('@setting_sendData', this.state.sendData);
        this.props.navigation.goBack();
    }

    componentDidMount = async () => {
        this.backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            this.handleLeave
        );

        try {
            let setting_number = await this.getMyStringValue("@setting_number");
            let setting_age = await this.getMyStringValue("@setting_age");
            let setting_deviceName = await this.getMyStringValue("@setting_deviceName");
            let setting_fixedGraph = await this.getMyStringValue("@setting_fixedGraph");
            let setting_sendData = await this.getMyStringValue("@setting_sendData");
            this.setState({ number: setting_number, age: setting_age, deviceName: setting_deviceName, fixed_graph: setting_fixedGraph, sendData: setting_sendData, settings_loaded: true });
        }
        catch (e) {
            console.log(e)
        }
    }

    render() {
        if (!this.state.settings_loaded) {
            return (
                <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                    <Spinner type="ChasingDots" color="#80cc24" size={90} />
                </ImageBackground>
            )
        }
        else {
            return (
                <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                    <View style={styles.mainView}>
                        <Text style={styles.textWhite} >
                            Age maximal des données
                    </Text>
                        <Slider
                            value={Number(this.state.age)}
                            style={styles.slider}
                            onValueChange={(value) => this.setState({ age: value })}
                            minimumValue={5}
                            maximumValue={60}
                            step={1}
                        />
                        <Text style={styles.textWhite}>
                            {this.state.age}
                        </Text>

                        <View style={styles.container}>
                            <Text style={styles.textWhite}>
                                Envoyer des données toutes les :
                        </Text>
                            <Slider
                                value={Number(this.state.number)}
                                style={styles.slider}
                                onValueChange={(value) => this.setState({ number: value })}
                                minimumValue={5}
                                maximumValue={30}
                                step={1}
                            />
                            <Text style={styles.textWhite}>
                                {this.state.number}
                            </Text>
                        </View>
                        <View style={styles.container}>
                            <Text style={styles.textWhite}>
                                Fixed axis on the graph :
                        </Text>
                            <CheckBox
                                style={{ color: "#ffffff" }}
                                value={String(this.state.fixed_graph) == 'true'}
                                onValueChange={(value) => this.setState({ fixed_graph: value })}
                            />
                        </View>
                        <View style={styles.container}>
                            <Text style={styles.textWhite}>
                                Send data to the Cloud :
                        </Text>
                            <CheckBox
                                style={{ color: "#ffffff" }}
                                value={String(this.state.sendData) == 'true'}
                                onValueChange={(value) => this.setState({ sendData: value })}
                            />
                        </View>
                        <Text style={styles.textWhite}>
                            Device's name :
                        </Text>
                        <View style={styles.textInputStyle}>
                            <TextInput
                                defaultValue={this.state.deviceName}
                                onChangeText={(text) => this.setState({ deviceName: text })}
                            />
                        </View>
                    </View>
                </ImageBackground>
            )
        }
    }
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        alignItems: 'center'
    },
    slider: {
        color: "#80cc24",
        width: 250
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    textWhite: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 20
    },
    button: {
        marginTop: 300
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    textInputStyle: {
        backgroundColor: "#f5fcff",
        width: 200
    },
    mainView: {
        flex: 1,
        alignItems: "center",
        padding: 50
    }
});


export default SettingsPage