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
        }
    }

    getMyStringValue = async (item) => {
        try {
            return await AsyncStorage.getItem(item)
        } catch (e) {
            console.log(e)
        }
    }

    componentDidMount = async () => {
        try {
            setting_number = await this.getMyStringValue('@setting_number');
            if (typeof (setting_number) !== 'string') {
                await this.storeData('10');
                this.setState({ number: 10 });
            }
            this.setState({ number: setting_number })
            setting_age = await this.getMyStringValue('@setting_age');
            if (typeof (setting_age) !== 'string') {
                await this.storeData('30');
                this.setState({ age: 30 });
            }
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
                        Nombre de données maximales à afficher
                </Text>
                    <Slider
                        value={Number(this.state.number)}
                        onValueChange={(value) => this.setState({ number: value })}
                        onSlidingComplete={() => this.storeData('@setting_number', this.state.number)}
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
                        onSlidingComplete={() => this.storeData('@setting_age', this.state.age)}
                        minimumValue={5}
                        maximumValue={60}
                        step={1}
                    />
                    <Text>
                        {this.state.age}
                    </Text>
                </View>
            </View>
        )
    }
}

export default SettingsPage