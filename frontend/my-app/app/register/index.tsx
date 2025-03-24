import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { auth,storage, db  } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ Import Image Manipulator

import { Image } from 'react-native';



const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null); // takes string or null

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
    } catch (err: any) {
      setError(getErrorMessage(err)); // ✅ Ensure error is handled properly
    }
  };
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,  // ✅ Fix mediaType
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.3,
    });
  
    console.log("🔥 DEBUG: ImagePicker result:", result);
  
    if (!result.canceled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { base64: true, compress: 0.3 }
      );
  
      console.log("🔥 DEBUG: Manipulated Image:", manipResult);
  
      if (manipResult.base64) {
        console.log("✅ DEBUG: Base64 image size:", manipResult.base64.length);
        setProfilePic(`data:image/jpeg;base64,${manipResult.base64}`);
      } else {
        console.error("❌ ERROR: Image conversion to Base64 failed.");
      }
    }
  };
  

  // Function to upload image to Firebase Storage
  const uploadImage = async (uid: string) => {
    if (!profilePic) {
      console.warn("⚠️ WARNING: No profilePic to upload.");
      return null;
    }
  
    try {
      console.log("🔥 DEBUG: Fetching image as blob...");
      const response = await fetch(profilePic);
      const blob = await response.blob();
  
      console.log("✅ DEBUG: Blob created. Uploading to Firebase Storage...");
      const storageRef = ref(storage, `profile_pictures/${uid}.jpg`);
      await uploadBytes(storageRef, blob);
  
      console.log("✅ DEBUG: Image uploaded. Getting download URL...");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("✅ DEBUG: Download URL:", downloadURL);
  
      return downloadURL;
    } catch (err) {
      console.error("❌ ERROR: Upload failed:", err);
      return null;
    }
  };
  

  // ✅ Signup function with specific error handling
  const handleSignup = async () => {
    setError('');
    setMessage('');
    try {
      console.log("🔥 DEBUG: Creating user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ DEBUG: User created:", user.uid);
  
      // console.log("🔥 DEBUG: Uploading profile image...");
      // const profilePicUrl = await uploadImage(user.uid);
  
      console.log("🔥 DEBUG: Storing user data in Firestore...");
      await setDoc(doc(collection(db, "users"), user.uid), {
        username: username,
        email: email,
        profilePic: profilePic|| "",
      });
  
      console.log("✅ DEBUG: User data saved to Firestore!");
  
      setMessage("✅ Account created successfully!");
    } catch (err: any) {
      console.error("❌ ERROR: Firestore Error:", err);
      setError(`⚠️ ${err.message}`);
    }
  };
  

  const fetchUserData = async (uid: string) => {
    try {
      console.log("🔥 DEBUG: Fetching user data from Firestore...");
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        console.log("✅ DEBUG: User Data:", userSnap.data());
        return userSnap.data();
      } else {
        console.warn("⚠️ WARNING: No user found in Firestore!");
        return null;
      }
    } catch (err) {
      console.error("❌ ERROR: Firestore fetch failed:", err);
      return null;
    }
  };

  return (
    <View style = {styles.container}>
      <Text style = {styles.topText}>
        Welcome to Ekko! Let's create your account!
        </Text>
        <LinearGradient
          colors={['#3A0398', '#150F29']} // Example gradient colors
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.loginBox}
          >
       <Text style={styles.promptText}>Username:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
      />
          
      <Text style={styles.promptText}>Email:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.promptText}>Password:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
          
      <View style={{ padding: 10}}></View>

      <Button title="Pick Profile Picture" onPress={pickImage} color='#4221D6'/>
      
      {/* the variable, profilePic holds the user selected image  */}
      {profilePic && <Image source={{ uri: profilePic }} style={{ width: 100, height: 100, marginTop: 10 }} />}
      <View style={{ padding: 20}}></View>
      <Button title="SIGNUP" onPress={handleSignup} color='#4221D6'/>

      {message ? <Text style={{ color: 'green', marginTop: 10 }}>{message}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}

      <Text style = {styles.forgotText}>Already have an account?</Text>
      <Button title="LOGIN" onPress={handleLogin} color='#4221D6'/>

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
    fontSize: 16,
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
      fontSize: 16,
      color: '#A7A7A7',
      paddingTop: 30,
      paddingLeft: 5,
  },
})

export default SignInScreen;
