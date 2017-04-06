
// Electron module:
const electron = require('electron');

// Module to control application life:
const {app} = electron;

// Module to create native browser window:
const {BrowserWindow} = electron;

// Command line parser:
const commandLineArgs = require('command-line-args');

// Set options definition:
const optionDefinitions = [
    { name: 'file',                  type: String, defaultOption: true },
    { name: 'width',     alias: 'w', type: Number, defaultValue: 640 },
    { name: 'height',    alias: 'h', type: Number, defaultValue: 480 },
    { name: 'frameRate', alias: 'f', type: Number, defaultValue: 30 },
    { name: 'help',                  type: Boolean }
];

function help() {
    console.log('Usage: rawUtil <video_file> [options]\n');
    console.log('Options:');
    console.log('--width=<num>,     -w <num>  Specify video width in pixels.');
    console.log('--height=<num>,    -h <num>  Specify video height in pixels.');
    console.log('--frameRate=<num>, -f <num>  Specify video frame rate.');
    console.log('--help                       Show this help.\n');
    app.quit();
}

// Packaging hack:
if (process.argv[1] != '.') process.argv.splice(1, 0, '.');

// Parse command line arguments:
var options = {};
try {
    options = commandLineArgs(optionDefinitions);
} catch(err) {
    help();
}

// Make sure file was given:
if (!('file' in options) || (options.help)) help();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {

    // Create the browser window.
    win = new BrowserWindow({width: options.width, height: options.height, useContentSize: true, title: options.file.split(/[\\/]/).pop(), resizable: false});

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/player.html`);

    // Open the DevTools.
    // Can open with CTRL+SHIFT+I
    // win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    // Open file:
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('video', options);
    });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
