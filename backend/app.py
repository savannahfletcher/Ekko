from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import auth, credentials, initialize_app
import bcrypt
import jwt
import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load Firebase credentials
cred = credentials.Certificate("firebase_config.json")
initialize_app(cred)

# Secret key for JWT
SECRET_KEY = "your_secret_key"

@app.route("/")
def home():
    return "Flask Backend is Running!"

# This API will create a new user in Firebase and store credentials securely.
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Create user in Firebase
        user = auth.create_user(email=email, password=password)

        return jsonify({"message": "User created successfully", "uid": user.uid}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Generates a JWT token upon successful login
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]

        # Verify user
        user = auth.get_user_by_email(email)

        # Generate JWT token
        token = jwt.encode(
            {"uid": user.uid, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256",
        )

        return jsonify({"token": token, "uid": user.uid}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Create a function to verify JWT tokens in protected routes.
def verify_token(token):
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded_token["uid"]
    except:
        return None

#To test authentication, create a protected API endpoint.
@app.route("/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token is missing"}), 403

    uid = verify_token(token)
    if not uid:
        return jsonify({"error": "Invalid token"}), 403

    return jsonify({"message": "Welcome to the protected route!", "uid": uid}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)