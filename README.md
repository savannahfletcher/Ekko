# Ekko
Music sharing social media mobile application wherein users are spontaneously prompted to post a song of the day. Some of the general features include user registration, user’s ability to post and send songs, a general feed (homepage), likes/reactions to posts, mass notification to users (once randomly everyday), and ability to search/add friends.

Steps to Set Up Flask on your local computer: 
1. cd to backend folder 
2. Create a python virtual environment (this is already added to .gitignore)
    python3 -m venv venv
    source venv/bin/activate  # macOS/Linux
    venv\Scripts\activate     # Windows
3. Install Flask and Firebase API: pip install flask firebase-admin
(note in order to do this, might need to install some dependencies like rust or command line tools)
4. Install required Python dependencies
pip install Flask Flask-CORS Flask-RESTful firebase-admin pyjwt bcrypt
or
pip install -r requirements.txt
5. Ask Chandini to send the firebase_config.json file 

Steps to run React Native app: 
1. cd to frontend folder
2. Run: npx expo start
    *Mac users might need to install xcode for this if it prompts you
3. Download Expo Go on your mobile device
4. To view the app:
    On your mobile device -> scan the given QR code with Expo Go (Android) or the Camera app (iOS)
    As an emulator on your computer -> download XCode and open it there
        *I'm not sure what this would look like for non-Mac users
