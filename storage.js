const fs = require("fs")
const path = require("path")

class Accounts{
    constructor(){
        this.accfile = "./storage/accounts.json"
        this.accounts
        this.selectedAcc = null
        this.updateAccounts()
    }

    updateAccounts(){
        if(fs.existsSync(this.accfile)){
            let accjson = JSON.parse(fs.readFileSync(this.accfile))
            this.accounts = accjson["accounts"]
            return
        }
        this.accounts = []
    }
    
    addAccount(email, password){
        this.accounts.push({"email":email,"password":password})
        let accjson = {
            "accounts":this.accounts
        }
        fs.writeFileSync(this.accfile, JSON.stringify(accjson))
        this.updateAccounts()
    }

    removeAccount(id){
        console.log(this.accounts.splice(id,1))
        let accjson = {
            "accounts":this.accounts
        }
        fs.writeFileSync(this.accfile, JSON.stringify(accjson))
        this.updateAccounts()
    }
}

class Versions{
    constructor(){
        if(process.platform=="win32"){
            this.verpath = path.join(process.env.HOME, "AppData", ".minecraft", "versions")
        }else{
            this.verpath = path.join(process.env.HOME, ".minecraft", "versions")
        }
        this.versions
        this.selectedVer = null
        this.updateVersions()
    }

    updateVersions(){
        if(fs.existsSync(this.verpath)){
            this.versions = fs.readdirSync(this.verpath)
            return
        }
        this.versions = []
    }
}

module.exports = {Accounts,Versions}