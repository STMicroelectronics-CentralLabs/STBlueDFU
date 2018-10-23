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
import {Injectable} from "@angular/core";
 import {OTA_State} from "./bleOtaDefine";

 
 @Injectable()
 export class OtaStatus {
     public progress:number;
     public updateTime: number;
     public expected:number;
     
     constructor(public bytesSent:number, public totalBytes:number, public elapsed:number, public state:OTA_State, public retries:number ){
         if (totalBytes ) {this.progress = bytesSent/totalBytes; this.expected = ((this.progress > 0) ? ((1-this.progress)/(this.progress)) * elapsed : -1);  };
         this.updateTime = Date.now();
         
     }
     
     public get timeElapsed() : string{
         //return (this.elapsed / 1000).toFixed(0);
         return new Date(this.elapsed).toISOString().substr(11,8);

     }
     public get timeExpected() : string{
         
         if (this.expected >= 0)
             return new Date(this.expected).toISOString().substr(11,8);
         else
            return "Calculating..."
     }
 }
 
 export class OtaDeviceImage{
     constructor (public startAddress:number, public name:string, public version:string){
         console.log("Address :" + startAddress + " Name :" + name + " Version:" + version);
     }
 }