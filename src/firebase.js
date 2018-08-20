import firebase from 'firebase';
import 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyB2_vKyKvE9ZFWzOZw8-9yzYmIWsVDxBqQ',
  authDomain: 'laravel-todo-f0ec8.firebaseapp.com',
  databaseURL: 'https://laravel-todo-f0ec8.firebaseio.com',
  projectId: 'laravel-todo-f0ec8',
  storageBucket: 'laravel-todo-f0ec8.appspot.com',
  messagingSenderId: '976638189621'
};

const firebaseApp = firebase.initializeApp(config);
const firestore = firebaseApp.firestore();
firestore.settings({ timestampsInSnapshots: true });

export default firestore;
