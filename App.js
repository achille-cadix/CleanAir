import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Navigation from './Navigation/Navigation';
import SplashScreen from 'react-native-splash-screen';

export default function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, [])
  return (
    <Navigation />
  );
}
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  }
});
