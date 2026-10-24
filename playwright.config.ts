import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',use:{baseURL:'http://127.0.0.1:3300',viewport:{width:1920,height:1080}},webServer:{command:'npm run build && npm start',port:3300,env:{ADMIN_TOKEN:'browser-test-only-abcdefghijklmnopqrstuvwxyz',DEMO_MODE:'true',PORT:'3300',DATA_DIR:'./data/browser-test'},reuseExistingServer:false}});
