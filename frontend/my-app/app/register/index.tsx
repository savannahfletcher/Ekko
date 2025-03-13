import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { auth,storage, db  } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ Import Image Manipulator

import { Image } from 'react-native';



export default function SignInScreen() {
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
    <View style={{ padding: 20 }}>
      <Text>Username:</Text>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginVertical: 5 }}
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
      />

      <Text>Email:</Text>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginVertical: 5 }}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />
      <Text>Password:</Text>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginVertical: 5 }}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <Button title="Pick Profile Picture" onPress={pickImage} />
      
      {/* the variable, profilePic holds the user selected image  */}
      {profilePic && <Image source={{ uri: profilePic }} style={{ width: 100, height: 100, marginTop: 10 }} />}

      <Button title="LOGIN" onPress={handleLogin} />
      <Button title="SIGNUP" onPress={handleSignup} />

      {message ? <Text style={{ color: 'green', marginTop: 10 }}>{message}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
    </View>
  );
}
