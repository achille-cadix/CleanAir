// Navigation/Navigation.js

import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import ChartPage from '../Components/ChartPage';
import HomePage from '../Components/HomePage'
import SettingsPage from '../Components/SettingsPage';
import SimuPage from '../Components/SimuPage';

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
    SimuPage: {
        screen: SimuPage,
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