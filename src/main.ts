import { createApp } from 'vue';
import App from './App';
import imgsrc from './b.jpg';

const app = createApp(App);
app.mount('#app');

const img = document.createElement('img');
img.setAttribute('src', imgsrc);
document.querySelector('body')?.appendChild(img);
