/*
 * Copyright (c) 2018  STMicroelectronics – All rights reserved
 * The STMicroelectronics corporate logo is a trademark of STMicroelectronics
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this list of conditions
 *   and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice, this list of
 *   conditions and the following disclaimer in the documentation and/or other materials provided
 *   with the distribution.
 *
 * - Neither the name nor trademarks of STMicroelectronics International N.V. nor any other
 *   STMicroelectronics company nor the names of its contributors may be used to endorse or
 *   promote products derived from this software without specific prior written permission.
 *
 * - All of the icons, pictures, logos and other images that are provided with the source code
 *   in a directory whose title begins with resources may only be used for internal purposes and
 *   shall not be redistributed to any third party or modified in any way.
 *
 * - Any redistributions in binary form shall not include the capability to display any of the
 *   icons, pictures, logos and other images that are provided with the source code in a directory
 *   whose title begins with resources.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
 * OF SUCH DAMAGE.
 */
import {RequestOptionsArgs, ResponseContentType, Http} from "@angular/http";
import {Observable} from "rxjs";
import {Md5} from "ts-md5/dist/md5";
import {BinaryInfo} from "./bleOtaBinaries";

export class Convert{
    public static toHexString(n:number, digits:number=8 ){
        let str:string = n.toString(16).toUpperCase();
        while (str.length < digits){
            str = "0"+str;
        }
        return str;    
    }

    public static toString(buf:ArrayBuffer):string{
        let str:string = "";
        let locBuff:Uint8Array = new Uint8Array(buf);
        //forEach doesnt work on mobile!
        //locBuff.forEach((n)=>{str += Convert.toHexString(n,2)});
        for(let a:number=0; a < locBuff.byteLength; a++)
            str += Convert.toHexString(locBuff[a], 2);

        return str;
    }

    public static hexStringToBuffer(str:String):ArrayBuffer{
        let retBuff:Uint8Array = null;
        if (str && (str.length > 0) && (str.length % 2 == 0)){
            try {
                retBuff = new Uint8Array(str.length / 2);
                for (let i = 0; i < str.length / 2; i++) {

                    retBuff[i] = Number.parseInt(str.substr(i * 2, 2), 16)
                }
            } catch (e){retBuff=null;}

         }
        return retBuff ? retBuff.buffer : null;
    }
  
}

export class loadService{
    public static getFile(http:Http, url:string, typeData:ResponseContentType):Observable<any>{
        let r : RequestOptionsArgs;
        if (typeData)
            r = {"responseType" :typeData};
        return http.get(url,  r );
    }

    public static checkItem(item:BinaryInfo):boolean{
        if (item && item.Contents){
            return ((item.md5 == loadService.calcMd5(item.Contents)) &&
                    (item.FileSize == item.Contents.byteLength));
        }
        return false;
    }

    public static calcMd5(buf:ArrayBuffer):string {

        let md5 = new Md5();
        md5.appendByteArray(new Uint8Array(buf));
        return md5.end() as string;
    }
}