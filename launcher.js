const path = require("path")
const fs = require("fs")
const childproc = require('child_process')
const request = require('request');

class Launcher{
    debug(str){
        if (process.env != "production"){
            console.log(str)
        }
    }
    
    getNatives(lib){
        let arch
        if (process.arch == "x64"){
            arch = "64"
        }else if(process.arch == "x32"){
            arch = "32"
        }else{
            throw Error("Unsupported architecture")
        }
    
        let nativesFile = ""
        if(!("natives" in lib)){
            return nativesFile
        }
    
        let platform = process.platform

        if("windows" in lib["natives"] && platform === "win32"){
            nativesFile = lib["natives"]["windows"].replace("${arch}", arch)
        }else if ("osx" in lib["natives"]&& platform === "darwin"){
            nativesFile = lib["natives"]["osx"].replace("${arch}", arch)
        }else if("linux" in lib["natives"] && platform === "linux"){
            nativesFile = lib["natives"]["linux"].replace("${arch}", arch)
        }
        
        return nativesFile
    }
    
    useLib(lib){
        function isRuleYes(rule){
            let useLib = null
    
            // kinda ironic lol
            if(rule["action"] == "allow"){
                useLib = false
            }else if(rule["action"] == "disallow"){
                useLib = true
            }
    
            if("os" in rule){
                for(let key in rule["os"]){
                    let os = process.platform
                    if(key=="name"){
                        if(rule["os"][key] === "windows"&&os!=="win32"){
                            return useLib
                        }else if(rule["os"][key] === "linux"&&os!=="linux"){
                            return useLib
                        }else if(rule["os"][key] === "osx"&&os!=="darwin"){
                            return useLib
                        }
                    }else if(key=="arch"){
                        if(key=="arch"){
                            if (rule["os"][key]=="x86"&&process.arch!="x32"){
                                return useLib
                            } 
                        }
                    }
                }
            }
    
            // not that ironic tho
            return !useLib
        }
    
        if(!("rules" in lib)){
            return true
        }
    
        let shouldUseLib = false
        for(let i in lib["rules"]){
            if(isRuleYes(lib["rules"][i])){
                return true
            }
        }
    
        return shouldUseLib
    }
    
    getClasspath(lib, mcDir){
        let classpath = []
    
        for(let i in lib["libraries"]){
            let current = lib["libraries"][i]
            if(!this.useLib(current)){
                continue
            }
    
            let libData = current["name"].split(":")
            let libDomain = libData[0]
            let libName = libData[1]
            let libVer = libData[2]
            let libDomainPath = ""
            for(let libDI in libDomain.split(".")){
                libDomainPath = path.join(libDomainPath, libDomain.split(".")[libDI])
            }
            let jarPath = path.join(mcDir, "libraries", libDomainPath, libName, libVer)
    
            let native = this.getNatives(current)
            let jarFile = libName + "-" + libVer + ".jar"
    
            if(native!=""){
                jarFile = libName + "-" + libVer + "-" + native + ".jar"
            }
    
            classpath.push(path.join(jarPath, jarFile))
        }
    
        classpath.push(path.join(mcDir, "versions", lib["id"], `${lib["id"]}.jar`))
    
    
        let classpathstr = ""
    
        for(let cp in classpath){
            classpathstr += classpath[cp] + ":"
        }
    
        classpathstr = classpathstr.slice(0, -1)
        return classpathstr
    }
    
    launchMC(version, username, uuid, token){
        let mcDir = path.join(process.env.HOME, ".minecraft")
        let nativesDir = path.join(process.env.HOME, ".minecraft", "versions", version, "natives")
        let clientNotJson = fs.readFileSync(path.join(mcDir, "versions", version, `${version}.json`))
        let clientJson = JSON.parse(clientNotJson)
        let classPath = this.getClasspath(clientJson, mcDir)
        let mainClass = clientJson["mainClass"]
        let versionType = clientJson["type"]
        let assetIndex = clientJson["assetIndex"]["id"]
    
        childproc.exec([
            "java",
            `-Djava.library.path=${nativesDir}`,
            "-Dminecraft.launcher.brand=custom-launcher",
            "-Dminecraft.launcher.version=2.1",
            "-cp",
            '"'+classPath+'"',
            "net.minecraft.client.main.Main",
            "--username",
            username,
            "--version",
            version,
            "--gameDir",
            mcDir,
            "--assetsDir",
            path.join(mcDir, "assets"),
            "--assetIndex",
            assetIndex,
            "--uuid",
            uuid,
            "--accessToken",
            token,
            "--userType",
            "mojang",
            "--versionType",
            "release"
        ].join(" "),(err)=>{
            console.log(err)
        })
    }
    
    authAccount(email, password, ver){
        request.post(
            "https://authserver.mojang.com/authenticate",
            { json: 
                {
                    "agent": {                              
                        "name": "Minecraft",                
                        "version": 1                        
                    },
                    "username": email,      
                                                            
                    "password": password,
                }
            },(err, res, body)=>{
                if("error" in body){
                    console.log("err")
                }else{
                    this.launchMC(ver, body["selectedProfile"]["name"], body["selectedProfile"]["id"], body["accessToken"])
                }
            }
        )
    }
    
}

module.exports = {Launcher}