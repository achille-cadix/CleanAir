import React from 'react';
import Slider from '@react-native-community/slider';
import { StyleSheet, View, Text, Button } from 'react-native';
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
            <View>
                <View>
                    <Text>
                        Envoyer des données toutes les :
                    </Text>
                    <Slider
                        value={Number(this.state.number)}
                        onValueChange={(value) => this.setState({ number: value })}
                        minimumValue={5}
                        maximumValue={30}
                        step={1}
                    />
                    <Text>
                        {this.state.number}
                    </Text>
                </View>
                <View>
                    <Text>
                        Age maximal des données
                </Text>
                    <Slider
                        value={Number(this.state.age)}
                        onValueChange={(value) => this.setState({ age: value })}
                        minimumValue={5}
                        maximumValue={60}
                        step={1}
                    />
                    <Text>
                        {this.state.age}
                    </Text>
                </View>
                <View>
                    <Button
                        title="Enregistrer les paramètres"
                        onPress={() => this.handleLeave()}
                    />
                </View>
            </View>
        )
    }
}

export default SettingsPage