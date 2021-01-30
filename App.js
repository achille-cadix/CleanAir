import React, { useEffect } from 'react';
import { StyleSheet, ImageBackground } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Navigation from './Navigation/Navigation';
import SplashScreen from 'react-native-splash-screen';

export default function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, [])
  return (
    <ImageBackground style={styles.image} source={require('./assets/pictures/background_image.png')}>
      <Navigation />
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
});
