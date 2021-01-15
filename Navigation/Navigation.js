// Navigation/Navigation.js

import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import ChartPage from '../Components/ChartPage';
import HomePage from '../Components/HomePage'
import SettingsPage from '../Components/SettingsPage';

const PageNavigator = createStackNavigator({
    HomePage: {
        screen: HomePage,
        navigationOptions: {
            headerShown: false
        }
    },
    ChartPage: {
        screen: ChartPage,
        navigationOptions: {
            headerShown: false
        }
    },
    SettingsPage: {
        screen: SettingsPage,
        navigationOptions: {
            headerShown: false
        }
    }
})

export default createAppContainer(PageNavigator)