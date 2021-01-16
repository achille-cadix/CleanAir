import React from 'react';
import { StyleSheet } from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import Navigation from './Navigation/Navigation';

class App extends React.Component {

  render() {
    return (
      <Navigation />
    )
  }




}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  }
});

export default App;
