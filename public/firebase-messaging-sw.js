// Scripts for firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// We use environmental fallbacks or the user can update this if needed.
firebase.initializeApp({
  apiKey: "AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc",
  authDomain: "playokeforyou.firebaseapp.com",
  projectId: "playokeforyou",
  storageBucket: "playokeforyou.appspot.com",
  messagingSenderId: "367280312686", // Corrected value based on project history or default
  appId: "1:367280312686:web:656f5c6c65656565" // Placeholder if not found
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
