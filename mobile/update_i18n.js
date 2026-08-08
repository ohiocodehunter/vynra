const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src', 'i18n');

const englishStrings = {
  common: {
    views: "views",
    subscribers: "subscribers",
    videos: "videos",
    cancel: "Cancel",
    save: "Save"
  },
  home: {
    shorts: "Shorts"
  },
  channel: {
    home: "Home",
    videos: "Videos",
    playlists: "Playlists",
    community: "Community",
    subscribe: "Subscribe",
    subscribed: "Subscribed"
  },
  explore: {
    trending: "Trending",
    music: "Music",
    gaming: "Gaming",
    news: "News",
    movies: "Movies",
    fashion: "Fashion",
    learning: "Learning",
    live: "Live",
    sports: "Sports"
  },
  auth: {
    welcomeBack: "Welcome Back",
    loginToContinue: "Login to continue",
    createAccount: "Create Account",
    joinUs: "Join Vynra today",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    login: "Login",
    register: "Register",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?"
  },
  video: {
    subscribe: "Subscribe",
    subscribed: "Subscribed",
    comments: "Comments",
    upNext: "Up Next",
    addComment: "Add a comment..."
  },
  subscriptions: {
    subscriptions: "Subscriptions",
    latest: "Latest from your channels",
    noSubscriptions: "You have no subscriptions yet"
  },
  playlists: {
    playlists: "Playlists",
    likedVideos: "Liked Videos",
    history: "History",
    watchLater: "Watch Later",
    playAll: "Play All",
    shuffle: "Shuffle"
  },
  nav: {
    home: "Home",
    shorts: "Shorts",
    add: "Add",
    subscriptions: "Subscriptions",
    you: "You"
  }
};

const hindiStrings = {
  common: {
    views: "व्यूज़",
    subscribers: "सब्सक्राइबर",
    videos: "वीडियो",
    cancel: "रद्द करें",
    save: "सहेजें"
  },
  home: {
    shorts: "शॉर्ट्स"
  },
  channel: {
    home: "होम",
    videos: "वीडियो",
    playlists: "प्लेलिस्ट",
    community: "कम्युनिटी",
    subscribe: "सब्सक्राइब करें",
    subscribed: "सब्सक्राइब्ड"
  },
  explore: {
    trending: "ट्रेंडिंग",
    music: "संगीत",
    gaming: "गेमिंग",
    news: "समाचार",
    movies: "फ़िल्में",
    fashion: "फ़ैशन",
    learning: "शिक्षा",
    live: "लाइव",
    sports: "खेल"
  },
  auth: {
    welcomeBack: "वापसी पर स्वागत है",
    loginToContinue: "जारी रखने के लिए लॉगिन करें",
    createAccount: "खाता बनाएं",
    joinUs: "आज ही Vynra से जुड़ें",
    username: "उपयोगकर्ता नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    login: "लॉगिन",
    register: "रजिस्टर",
    noAccount: "खाता नहीं है?",
    haveAccount: "क्या आपके पास पहले से खाता है?"
  },
  video: {
    subscribe: "सब्सक्राइब करें",
    subscribed: "सब्सक्राइब्ड",
    comments: "टिप्पणियाँ",
    upNext: "अगला वीडियो",
    addComment: "टिप्पणी जोड़ें..."
  },
  subscriptions: {
    subscriptions: "सदस्यताएं",
    latest: "आपके चैनलों से नवीनतम",
    noSubscriptions: "आपकी कोई सदस्यता नहीं है"
  },
  playlists: {
    playlists: "प्लेलिस्ट",
    likedVideos: "पसंद किए गए वीडियो",
    history: "इतिहास",
    watchLater: "बाद में देखें",
    playAll: "सभी चलाएं",
    shuffle: "शफ़ल"
  },
  nav: {
    home: "होम",
    shorts: "शॉर्ट्स",
    add: "जोड़ें",
    subscriptions: "सदस्यताएं",
    you: "आप"
  }
};

const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(i18nDir, file);
  const lang = file.replace('.json', '');
  
  let currentData = {};
  try {
    currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) {}
  
  const mergeData = lang === 'hi' ? hindiStrings : englishStrings;
  
  // Merge keys
  for (const [section, keys] of Object.entries(mergeData)) {
    if (!currentData[section]) {
      currentData[section] = {};
    }
    for (const [k, v] of Object.entries(keys)) {
      if (!currentData[section][k]) {
        currentData[section][k] = v;
      }
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2) + '\n');
  console.log(`Updated ${file}`);
}
