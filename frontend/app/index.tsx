import { Text, View, StyleSheet, Image } from "react-native";
import TempLogo from '@/assets/images/Ekko_Temp_Logo.png'; // 1600 x 900

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Image source= { TempLogo } style={styles.image}/>
      <Text style={styles.title}>Welcome to Ekko!</Text>
      <Text style={styles.subtitle}>Your favorite music sharing app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#2f2f2f',
  },
  image: {
    width: 370,
    height: 210,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
  },
});

export default HomeScreen;