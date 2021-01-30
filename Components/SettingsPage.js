import React from 'react';
import Slider from '@react-native-community/slider';
import { StyleSheet, View, Text, Button, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast";


class SettingsPage extends React.Component {

    storeData = async (item, value) => {
        console.log(this.state)
        try {
            await AsyncStorage.setItem(item, value.toString());
        } catch (e) {
            console.log(e)
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            number: 15,
            age: 30
        };
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
        this.props.navigation.state.params.updateSettings(this.state.number, this.state.age);
        await this.storeData('@setting_number', this.state.number);
        await this.storeData('@setting_age', this.state.age);
        this.props.navigation.navigate("ChartPage");
    }

    componentDidMount = async () => {
        try {
            setting_number = await this.getMyStringValue("@setting_number");
            setting_age = await this.getMyStringValue("@setting_age");
            this.setState({ number: setting_number })
            this.setState({ age: setting_age })
        }
        catch (e) {
            console.log(e)
        }
    }

    render() {
        return (
            <ImageBackground style={styles.image} source={require('../assets/pictures/background_image.png')}>
                <View styles={styles.container}>
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
                <View>
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
                    <Button
                        style={styles.button}
                        color="#80cc24"
                        title="Enregistrer les paramètres"
                        onPress={() => this.handleLeave()}
                    />
                </View>
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
    slider: {
        color: "#80cc24",
        width: 250
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5fcff"
    },
    textWhite: {
        color: '#ffffff',
        fontFamily: 'sharetech',
        fontSize: 20
    },
    button: {
        marginTop: 300
    }
});


export default SettingsPage