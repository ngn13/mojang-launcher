const electron = require("electron")
const url = require("url")
const path = require("path")
const {Launcher} = require("./launcher") 
const {Accounts, Versions} = require("./storage") 
const launcher = new Launcher()
const accManager = new Accounts()
const verManager = new Versions()

const {app, BrowserWindow, ipcMain} = electron

let mainWindow;

app.on("ready", ()=>{
    mainWindow = new BrowserWindow({
        //autoHideMenuBar: true,
        width:1000,
        height:600,
        title: "Mojang Launcher",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/html/main.html"),
        protocol: "file:",
        slashes: true
    }))

})

ipcMain.on("acc:list", ()=>{
    mainWindow.webContents.send("acc:listrcv", accManager.accounts)
})

ipcMain.on("acc:set", (e, indx)=>{
    accManager.selectedAcc = accManager.accounts[indx]
})

ipcMain.on("acc:add", (e, email, password)=>{
    accManager.addAccount(email, password)
})

ipcMain.on("acc:remove", (e, indx)=>{
    accManager.removeAccount(indx)
    accManager.selectedAcc = null
})

ipcMain.on("ver:list", ()=>{
    mainWindow.webContents.send("ver:listrcv", verManager.versions)
})

ipcMain.on("ver:set", (e, indx)=>{
    verManager.selectedVer = verManager.versions[indx]
})

ipcMain.on("launch", ()=>{
    if(verManager.selectedVer===null||accManager.selectedAcc===null){
        mainWindow.webContents.send("launchfail")
        return 
    }

    launcher.authAccount(accManager.selectedAcc["email"], accManager.selectedAcc["password"], verManager.selectedVer)
})