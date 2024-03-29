export interface IArgs{
    setup:boolean;

    v:boolean;
    version:boolean;
    
    u:boolean;
    update:boolean;

    c:boolean;
    create:boolean;

    r:boolean;
    release:boolean;
    mini:boolean;
    name:string;
    d:boolean; //declaration
    nohtml:boolean;

    p:boolean
    publish:boolean

    web:boolean;

    nodejs:boolean;

    config:string
    
    h:boolean;
    help:boolean;

    wechat:boolean;

    params:string[];
}


export interface TSCompilerOptions{
    target:string;
    module:string;

    outDir:string;
    rootDir:string;
    outFile:string;

    lib:string[];

    sourceMap:boolean;
    declaration:boolean;
}

export interface TSConfigOptions{
    root:string;
    compilerOptions:TSCompilerOptions;
    include:string[];
    exclude:string[];
    templete:string;
    platform:string;
    clientRemote:string;

    engine:{
        remote:string,
        files:string[]
    }

    projectName:string;

    wechat:{
        appid : string,
        projectName : string,
        files : {[key:string]:string[]}
    };

    main:string;

}

export class Core{
    static config:IArgs;
    static remotePath = "\\\\192.168.1.4\\webgl\\"
    static remoteMelon = Core.remotePath +"melon\\"
    // static remoteCreate = Core.remotePath +"project\\"
    // static remoteEngine = Core.remotePath +"engine\\"
}

import * as __path from "path";
export const $path = require("path") as typeof __path;

import * as __fs from "fs";
export const fs = require("fs") as typeof __fs;

import * as __exec from "child_process";
import { File } from "./File";
const { exec } = require('child_process') as typeof __exec;

// import * as __iconv from "iconv-lite";

import { byte_decodeUTF8 } from "./AMF3";


export var melonLocalPath = new File(`${process.env.APPDATA}/npm/node_modules/melon/`);

export async function xCopy(from:string,to:string,debug = false){
    from = from.replace(/\//g,"\\");
    to = to.replace(/\//g,"\\");
    if(debug){
        loger(`xcopy ${from}* ${to} /s /e /h /r /k /y /d`);
    }
    await doCommand(`xcopy ${from}* ${to} /s /e /h /r /k /y /d`);
}



export async function doCommand(cmd:string){
    return await new Promise(resolve => {
        exec(cmd, { encoding: 'buffer' }, (error, stdout) => {
            let err:string;
            // try {
            //     // err = require( "iconv-lite").decode(stdout,"GBK");
            //     // err = __iconv.decode(stdout,"GBK");
            //     // err = new TextDecoder("GBK").decode(stdout);
                
            // } catch (error) {
            err = byte_decodeUTF8(stdout);
            // }
            // if(error){
            //     console.log(err);
            // }
            resolve([error,err])
        });
    });
}

export async function confirm(msg:string){
    return await new Promise(resolve => {
        process.stdout.write(msg);
        process.stdin.resume();
        process.stdin.setEncoding("utf-8");
        process.stdin.on("data", function(chunk) {
            process.stdin.pause();
            resolve(chunk.trim())
        });
    });
}

export function removeComments(content:string){
    var reg1 = /\/\/.*/g;
    var r=content.replace(reg1, '');
    var reg2 = /\/\*[\s\S]*?\*\/[^\*]/g;
    r = r.replace(reg2, '');
    return r;
}


export function getTSConfig(){


    let configPath = Core.config.config;
    if(!configPath){
        configPath = "tsconfig.json"
    }

    let tsconfig = new File($path.resolve(configPath));

    if(tsconfig.exists){
        try {
            let ts = JSON.parse(removeComments(tsconfig.readUTF8())) as TSConfigOptions;
            ts.root = new File($path.resolve("")).nativePath;
            return ts;
        } catch (error) {
            console.log(error);
        }
    }

    console.log("cann't find 'tsconfig.json'")

    return undefined;
}

export function getPackageJson(){
    let configPath = "package.json";
    let tsconfig = new File($path.resolve(configPath));

    if(tsconfig.exists){
        try {
            let ts = JSON.parse(removeComments(tsconfig.readUTF8())) as TSConfigOptions;
            ts.root = new File($path.resolve("")).nativePath;
            return ts;
        } catch (error) {
            console.log(error);
        }
    }

    console.log("cann't find 'tsconfig.json'")

    return undefined;
}



export var referenceMatch = /\/\/\/ <reference path=\"(.*?)\"/g;

export function getReference(files:File[],ts:TSConfigOptions) {
    referenceMatch = /reference path=\"(.*?)\"/;
    var fileobj = {};
    var reference:string[] = [];
    for (var i = 0; i < files.length; i++) {
        var relativepath = files[i];
        var content = relativepath.readUTF8();
        var arr = fileobj[relativepath.nativePath] = [];
        while (true) {
            var match = referenceMatch.exec(content);
            if (match) {
                content = content.replace(match[0], "");
                let filepath =  relativepath.resolvePath(match[1]);
                arr.push(filepath);
            }else{
                break;
            }
        }
    }

    var key;

    var processes = [];
    function process(arr:File[]) {
        for (var i = 0; i < arr.length; i++) {
            let f = arr[i];
            var key = f.nativePath;
            if (processes.indexOf(key) == -1) {
                processes.push(key);
                if (reference.indexOf(key) == -1) {
                    if (undefined != fileobj[key]) {
                        process(fileobj[key]);
                    }
                    reference.push(key.replace(ts.root,""));
                }
            }
        }
    }

    process(files);

    return reference;
};



export function updateEs6Import(files:File[],ts:TSConfigOptions){
    let importMatch = /import.*?\"(.[^\.\n]*?)\";/;
    for (var i = 0; i < files.length; i++) {
        var relativepath = files[i];
        // console.log(relativepath.nativePath);
        var content = relativepath.readUTF8();
        content = content.replace(/\.\.\//g,"___%ddt%___")
        var find = false;
        while (true) {
            var match = importMatch.exec(content);
            if (match) {
                // console.log(relativepath.nativePath,match[1]);
                let importfile = match[1] as string;
                if(importfile.indexOf(".js") == -1){
                    content = content.replace(match[0], match[0].replace(importfile,importfile+".js"));
                    find = true;
                }
            }else{
                break;
            }
        }
        if(find){
            content = content.replace(/___\%ddt\%___/g,"../");
            // console.log(relativepath.nativePath);
            relativepath.writeUTF8(content);
        }
    }
}



export function compiler_checkAvailable(target:string,assets:string[]){
    var file;
    target = target.toLocaleLowerCase();
    for(file of assets){
        var i = target.indexOf(file[0]);
        if(i == -1){
            continue;
        }

        if(file[1] == 1){
            return true;
        }
        var path = target.slice(i+1);
        if(path.lastIndexOf("/") == -1){
            return true;
        }
    }
    return false;
}


export function getCompilerFiles(ts:TSConfigOptions){
    let{compilerOptions,include,exclude} = ts;
    function formatAssets(assets:string[]){
        var r = [];
        var i
        var file
        for (file of assets) {
            i = file.indexOf("/**/*");
            if(i != -1){
                r.push([$path.resolve(file.slice(0,i+1)).replace(/\\/g,"/").toLowerCase(),1]);
            }else{
                if((i = file.lastIndexOf("*")) == file.length-1){
                    r.push([$path.resolve(file.slice(0,i)).replace(/\\/g,"/").toLowerCase(),2]);
                }else{
                    r.push([(file).replace(/\\/g,"/").toLowerCase(),3]);
                }
            }
        }
        return r;
    }


    

    ts.exclude = exclude = formatAssets(exclude);
    let list =  new File(ts.root).resolvePath(compilerOptions.rootDir).getAllFiles(undefined,20);
    let result:File[] = [];
    list.forEach(element => {
        if(element.extname == ".ts"){
            var b = compiler_checkAvailable(element.nativePath,exclude);
            if(false == b){
                result.push(element);
            }
        }
    });

    if(ts.compilerOptions.module == "commonjs"){
        return getReference(result,ts);
    }


    updateEs6Import(result,ts);

    return [];
}


export function loger(msg:string){
    console.log(msg);
}

export async function getBranch(){
    let [state,value] = await doCommand("git branch") as string[];
    if(!state || !value){
        let [,branch] = /\* (.*?)\n/.exec(value) as string[];
        return branch;
    }
    return "master"
}