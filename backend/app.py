from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials
import jwt
import datetime
from firebase_admin import firestore


app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Load Firebase credentials (Ensure this file is in the backend directory)
cred = credentials.Certificate("firebase_config.json")
firebase_admin.initialize_app(cred)

db = firestore.client()  # Initialize Firestore

# Secret key for JWT
#SECRET_KEY = "your_secret_key"

@app.route("/")
def home():
    return "Flask Backend is Running!"

# ✅ Register a new user in Firebase
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        print("Received data:", data)
        email = data["email"]
        password = data["password"]
        username = data.get("username")
        profile_pic = data.get("profilePic")  # URL of uploaded profile pic

        if not email or not password or not username:
            return jsonify({"error": "Missing required fields"}), 400
        

        # Create user in Firebase
        user = auth.create_user(email=email, password=password)
         # Save user info in Firestore
        user_data = {
            "username": username,
            "email": email,
            "profilePic": profile_pic or "",  # Store empty string if no profile pic
        }
        db.collection("users").document(user.uid).set(user_data)

        return jsonify({"message": "User created successfully", "uid": user.uid}), 201

    except Exception as e:
        print("Error:", str(e))  # ✅ Debugging
        return jsonify({"error": str(e)}), 400
    


# ✅ Login a user (use Firebase Authentication)
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]

        # Firebase does NOT allow password verification via the Admin SDK.
        # Instead, verify credentials using Firebase Authentication REST API.
        import requests

        firebase_api_key = "AIzaSyBTLLSOmw9bHzTQg23RS7_dybCMd1jOSnU"  # Get from Firebase Console
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
        payload = {"email": email, "password": password, "returnSecureToken": True}
        response = requests.post(url, json=payload)

        if response.status_code == 200:
            user_data = response.json()
            token = user_data["idToken"]  # Firebase returns an ID token

            return jsonify({"token": token, "uid": user_data["localId"]}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    


# ✅ Verify Firebase JWT tokens in protected routes
def verify_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        print("Token verification error:", str(e))  # Debugging
        return None


# ✅ Protected API route (requires Firebase Authentication)
@app.route("/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token is missing"}), 403

    uid = verify_token(token)
    if not uid:
        return jsonify({"error": "Invalid token"}), 403

    return jsonify({"message": "Welcome to the protected route!", "uid": uid}), 200

# # Post Songs to users Firestore
# @app.route("/post_song", methods=["POST"])
# def post_song():

#     try:
#         # Get the token from the request header
#         token = request.headers.get("Authorization")
#         if not token:
#             return jsonify({"error": "Token is missing"}), 403
        
#          # Remove "Bearer " prefix if present
#         token = token.replace("Bearer ", "").strip()

#         print("Received Authorization Header:", request.headers.get("Authorization"))


#         # Verify token (you need to implement `verify_token` function)
#         uid = verify_token(token)
#         if not uid:
#             return jsonify({"error": "Invalid token"}), 403

#         # Get song data from the request body
#         data = request.json
#         song = data.get("song")  # Expecting a dictionary with song details

#         if not song:
#             return jsonify({"error": "No song data provided"}), 400

#         # Reference to the user document in Firestore
#         user_ref = db.collection("users").document(uid)
#         user_doc = user_ref.get()

#         if user_doc.exists:
#             # Use a subcollection 'personalSongs' under the user document
#             personal_songs_ref = user_ref.collection("personalSongs")
#             personal_songs_ref.add(song)  # Adds the song as a new document in the subcollection

#             return jsonify({"message": "Song added successfully"}), 200
#         else:
#             return jsonify({"error": "User not found"}), 404

#     except Exception as e:
#         # Log the error for debugging purposes
#         print(f"Error: {str(e)}")
#         return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
