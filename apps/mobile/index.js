// index.js — Direct entry point for pnpm monorepo (bypasses expo/AppEntry.js)
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
