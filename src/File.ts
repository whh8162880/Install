import * as $path from "path";
export const __path = require("path") as typeof $path;

import * as $fs from "fs";
import { byte_encodeUTF8 } from "./AMF3";
export const __fs = require("fs") as typeof $fs;

export class File{

    nativePath:string;
    constructor(path:string){
        this.nativePath = path = path.replace(/\\/g,"/");
        if(this.exists == true){
            if(this.isFile() == false){
                if(path[path.length - 1] != "/"){
                    this.nativePath = path + "/";
                }
            }   
        }
    }

    get name():string{
        let _name = this.nativePath;
        _name = _name.slice(_name.lastIndexOf("/",_name.length - 2)).replace(/\//g,"");
        return _name;
    }

    get exists(){
        return __fs.existsSync(this.nativePath);
    }

    isFile(){
        if(this.exists == false){
            return false;
        }
        let states = __fs.statSync(this.nativePath);
        // states.isDirectory();
        return states.isFile();
    }

    isDirectory(){
        if(this.exists == false){
            return false;
        }
        return __fs.statSync(this.nativePath).isDirectory();
    }

    get extname():string{
        let _name = this.nativePath;
        return _name.slice(_name.lastIndexOf(".")).toLocaleLowerCase();            
    }

    get parent(){
        let path = __path.dirname(this.nativePath)+"/";
        // let{nativePath} = this;
        // let i = nativePath.lastIndexOf("/",nativePath.length-2);
        // if(i == -1){
        //     return undefined;
        // }
        // nativePath = nativePath.slice(0,i);
        return new File(path);
    }


    read(){
        return __fs.readFileSync(this.nativePath);
    }

    readUTF8(type:string = "utf8"):string{

        if(!this.exists){
            return "";
        }

        return __fs.readFileSync(this.nativePath,type);
    }

    mkdir(){
        if(this.exists == false){
            this.parent.mkdir();
            __fs.mkdirSync(this.nativePath);
        }
    }

    write(buf:Uint8Array){
        let f = new File(__path.dirname(this.nativePath)+"/");
        if(f.exists == false){
            f.mkdir();
        }
        __fs.writeFileSync(this.nativePath,buf);
    }

    writeUTF8(value:string){
        this.write(byte_encodeUTF8(value));
        return this;
    }


    getDirectoryListing():File[]{
        if(false == this.exists){
            return undefined;
        }
        let path = this.nativePath;
        if(this.isFile() == true){
            path = __path.dirname(path)+"/";
        }

        let files = __fs.readdirSync(path);

            
        let result = [];
        // $fs.readdir(path,(err,files)=>{
        files.forEach(file => {
            result.push(new File(path + file));
        });
        // })
        return result;
    }


    resolvePath(path:string){
        var f:File;
        if(this.isFile() == true){
            f = this.parent;
        }else{
            f = this;
        }
        return new File(__path.join(f.nativePath , path));
    }


    getAllFiles(ext = undefined,deep = 0):File[]{

        if(false == this.exists){
            return undefined;
        }

        let path = this.nativePath;
        if(this.isFile() == true){
            path = __path.dirname(path)+"/";
        }

        let result:File[] = [];
        let files = __fs.readdirSync(this.nativePath);

        files.forEach(file => {
            let f = new File(path + file);
            if(false == f.isFile()){
                if(deep > 0){
                    result = result.concat(f.getAllFiles(ext,deep--));
                }
            }else{
                if(!ext || f.extname == ext){
                    result.push(f);
                }
            }
        });

        return result;
    }


    copyto(to:File){

        if(to.exists == false){
            let mk:File
            if(to.name.indexOf(".") == -1){
                mk = to;
            }else{
                mk = to.parent;
            }
            mk.mkdir();
        }

        // if(typeof fs.promises != "undefined"){
        //     // fs.copyto(this.nativePath, to)
        //     fs.copyFileSync(this.nativePath, to);
        // }else{
        to.write(this.read());
        // }

        
    }

    moveto(to:File){
        this.copyto(to);
        __fs.unlinkSync(this.nativePath);
    }

    delete(){
        __fs.unlinkSync(this.nativePath);
    }


    


}