const { app, contextBridge, ipcRenderer, dialog } = require('electron');
const fs = require('fs');
https = require('https');
cheerio = require('cheerio');
const block = require('./addons/block');

contextBridge.exposeInMainWorld('fsApi', {
    writeFile: (filename, text, callback) => {
        fs.writeFile(filename, text, callback);
    },
    readFile: (filename, encode,  callback) => {
        fs.readFile(filename, encode, callback);
    },
    unlink: (filename, callback) => {
        fs.unlink(filename, callback);
    }
});

contextBridge.exposeInMainWorld('ipcRendererApi', {
    send: (channel, args) => ipcRenderer.send(channel, args),
    sendSync: (channel, args) => ipcRenderer.sendSync(channel, args),
    once: (channel, listener) => ipcRenderer.once(channel, listener),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
});

contextBridge.exposeInMainWorld('blockApi', {
    LoadModules: (filename, callback) => block.LoadModules(filename, callback)
});
