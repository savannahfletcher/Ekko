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
5. Ask Chandini to send the firebase_config.json file and put into the backend folder
6. To run application on local:
    flask run

Frontend Setup (React Native + Expo)
1. cd frontend
2. Install Node.js and Expo (if not)
    check if node -v or npm -v gives anything -> if not brew install node
3. Install dependencies
    npm install
4. Run expo start
    npx expo start