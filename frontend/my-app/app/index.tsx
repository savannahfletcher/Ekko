import { Text, View, StyleSheet, Image, TouchableOpacity } from "react-native";
import TempLogo from '../assets/images/Ekko_Temp_Logo.png'; // 1600 x 900
import {useRouter, Link} from 'expo-router';

const HomeScreen = () => {

  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source= { TempLogo } style={styles.image}/>
      <Text style={styles.title}>Welcome to Ekko!</Text>
      <Text style={styles.subtitle}>Your favorite music sharing app!</Text>

      <Link href="./login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./register" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./feed" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Feed (Debug)</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./post" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Search (Debug)</Text>
        </TouchableOpacity>
      </Link>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: '100%',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2f2f2f',
  },
  image: {
    width: 370,
    height: 210,
    marginBottom: 100,
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
  button: {
    backgroundColor: '#7B2FFE',
    paddingVertical: 12,
    width: 200,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;