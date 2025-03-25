import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {useRouter} from 'expo-router';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

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
  const handleLogin = async () => {
    setError('');
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('✅ Login successful!'); // Show success message
      router.replace('./feed')
    } catch (err: any) {
      setError(getErrorMessage(err)); // ✅ Ensure error is handled properly
    }
  };

  return (
    <View style = {styles.container}>
      <Text style = {styles.topText}>
        Sign in to post your Ekko!
        </Text>
    <LinearGradient
          colors={['#3A0398', '#150F29']} // Example gradient colors
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.loginBox}
          >
        <Text style = {styles.promptText}>Email:</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Enter email"
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
      
        <Button title="LOGIN" onPress={handleLogin} color='#4221D6' />

        <Text style = {styles.forgotText}>Forgot your password?</Text>

        {message ? <Text style={{ color: 'green', marginTop: 10 , padding: 5}}>{message}</Text> : null}
        {error ? <Text style={{ color: 'red', marginTop: 10 , padding: 5}}>{error}</Text> : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create ({
  container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#2f2f2f',
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
  inputBox: {
    borderWidth: 1, 
    padding: 10, 
    marginVertical: 5 ,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  forgotText: {
      fontSize: 12,
      color: '#A7A7A7',
      paddingTop: 20,
      paddingLeft: 5,
  },
})

export default SignInScreen;
