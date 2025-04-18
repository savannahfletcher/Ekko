import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TextInput, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {useRouter} from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useFonts } from 'expo-font';


const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'), // Adjust the path to your font file
  });

  if (!fontsLoaded) {
    return <Text>Loading fonts...</Text>; // Show a loading screen while the font is loading
  }

  // ✅ Function to map Firebase error codes to user-friendly messages
  const getErrorMessage = (error: any) => {
    console.error("Firebase Error:", error); // ✅ Debugging

    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return '⚠️ Username not found. Please sign up.';
        case 'auth/invalid-email':
          return '⚠️ Invalid email format. Please enter a valid email.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':  
          return '⚠️ Incorrect password. Or user not found. Please try again.';
        case 'auth/email-already-in-use':
          return '⚠️ This username already exists. Try logging in.';
        case 'auth/weak-password':
          return '⚠️ Password should be at least 6 characters.';
        default:
          return `⚠️ An unexpected error occurred: ${error.message}`;
      }
    }
    return '⚠️ An unknown error occurred. Please try again.';
  };

  // ✅ Login function with specific error handling

  // Replace your current handleLogin with this:
  const handleLogin = async () => {
    console.log("Login button pressed!");
    setError('');
    setMessage('');
    
  
    try {
      let loginEmail = email;
      console.log("Attempting to log in with:", loginEmail);
  
      // Check if it's a username (doesn't contain "@")
      if (!email.includes("@")) {
        console.log("going here");
        const q = query(collection(db, "users"), where("username", "==", email));
        
        const querySnapshot = await getDocs(q);
  
        if (querySnapshot.empty) {
          setError("⚠️ Username not found. Please try again or sign up.");
          return;
        }
  
        // Assume usernames are unique, grab the first match
        loginEmail = querySnapshot.docs[0].data().email;
        console.log("Attempting to log INSIDE with:", loginEmail);
      }
  
      // Use the resolved loginEmail to sign in

      await signInWithEmailAndPassword(auth, loginEmail, password);
      setMessage('✅ Login successful!');
      router.replace('./feed');

      setEmail('');
      setPassword('');
      
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  // Routes user to the registration page
  const handleSignUp = () => {
    router.replace('./register');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style = {styles.ekkoText}> Ekko </Text>
      <Text style = {styles.topText}>
        Sign in to post your Ekko!
        </Text>
    <LinearGradient
          colors={['#3A0398', '#150F29']} // Example gradient colors
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.loginBox}
          >
        <Text style = {styles.promptText}>Email or username:</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Enter email or username"
          value={email}
          onChangeText={setEmail}
        />
        <View style={{ padding: 5}}></View>
        <Text style = {styles.promptText}>Password:</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={{ padding: 20}}></View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.newUserText}>
              New user? Sign up here!
            </Text>
        </TouchableOpacity>

        {message ? <Text style={{ color: 'green', marginTop: 10 , padding: 5}}>{message}</Text> : null}
        {error ? <Text style={{ color: 'red', marginTop: 10 , padding: 5}}>{error}</Text> : null}
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create ({
  container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#2f2f2f',
  },
  ekkoText: {
    fontSize: 36,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'MontserratAlternates-ExtraBold',
    padding: 10,
  },
  loginBox: {
      padding: 20,
      marginBottom: 50,
      borderRadius: 19,
  },
  topText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
  },
  promptText: {
      fontSize: 17,
      color: '#fff',
      paddingLeft: 2,
      paddingTop: 10,
  },
  loginButton: {
    backgroundColor: '#4221D6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputBox: {
    borderWidth: 1, 
    padding: 10, 
    marginVertical: 5 ,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  newUserText: {
      fontSize: 16,
      color: '#A7A7A7',
      paddingTop: 20,
      paddingLeft: 5,
  },
})

export default SignInScreen;
