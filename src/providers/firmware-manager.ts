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
import { Injectable } from '@angular/core';
import {Http, ResponseContentType} from '@angular/http';
import 'rxjs/add/operator/map';
import {Platform, AlertController} from "ionic-angular";
import {OtaInfo, BinaryInfo} from "../Common/bleOtaBinaries";
import {Observable} from "rxjs";
import {loadService} from "../Common/utils";
import {File} from 'ionic-native';
import {environment} from "../environments/environment";
declare var cordova: any;

@Injectable()
export class FirmwareManager {
  otaDb:OtaInfo;
  localDBPath:string

  constructor(public http: Http, public alertCtrl: AlertController, private platform:Platform) {

    this.platform.ready().then(()=>{
      console.log('FirmwareManager Provider Ready basePath' + cordova.file.dataDirectory);

      this.localDBPath = cordova.file.dataDirectory + "assets/fw_bin/";
      this.loadDB(this.localDBPath, environment.blueNRG_DB_entry).subscribe(
                  (db)=>{console.log("Load db local OK"); this.otaDb = db;},
                  (error)=>{console.log("Load db local fail" + JSON.stringify(error)); this.loadDefaultDB()});


    });
  }
  private loadDB(urlPath:string, fileName:string):Observable<OtaInfo>{
    console.log("Loading " + urlPath);
    let localOta:OtaInfo;
    return loadService.getFile(this.http, urlPath + fileName, ResponseContentType.Json) //.catch((reason)=>{this.showRemoteDataNotAvailable()})
        .map(res=> res.json() )
        .flatMap((bins:OtaInfo)=>{
          localOta = bins;
          //console.debug(JSON.stringify(bins));
          return Observable.forkJoin(bins.Binaries.map((bin:BinaryInfo)=>{
            //console.debug(JSON.stringify(bin));
            return this.loadAndValidateBin((bins.BasePath != null  && bins.BasePath != "" ? bins.BasePath : urlPath) + bin.File, bin)
          }))
        })
        .map((x)=>{localOta.Binaries = x; return localOta})
  }

  public loadDefaultDB():void{
    console.log("db entry not found... loading default");
    this.loadDB("./assets/fw_bin/", environment.blueNRG_DB_entry)
        .subscribe((value)=>{console.debug("New data", value); this.updateLocalDB(value)})

  }

  private loadAndValidateBin(url:string, bin:BinaryInfo):Observable<OtaInfo>{
    console.log("Loading " + url);
    return loadService.getFile(this.http, url, ResponseContentType.ArrayBuffer)

        .flatMap(x=>{ return this.validateAndStoreBuffer(x.arrayBuffer(), bin)})
  }

  private updateLocalDB(ota:OtaInfo):boolean {
    console.log("update LocalDB" );
    if (ota != null){
      if (this.otaDb == null || this.otaDb.Version < ota.Version) {

        this.otaDb = ota;

        File.checkDir(cordova.file.dataDirectory, "assets/fw_bin").then(
            ()=>{console.log("Folder Exist"); this.copyToLocalFiles();},
            (reason)=>{ console.log("Folder Exist error" + reason)
                File.createDir(cordova.file.dataDirectory, "assets", false).then(
                        ()=>{File.createDir(cordova.file.dataDirectory + "assets/", "fw_bin", false).then(
                            ()=>{console.log("Create Folder success"); this.copyToLocalFiles();},
                            ()=>{console.log("Create Folder fails fw_bin");})},
                        ()=>{console.log("Create Folder fails assets");
                             File.createDir(cordova.file.dataDirectory + "assets/", "fw_bin", false).then(
                            ()=>{console.log("Create Folder success"); this.copyToLocalFiles();},
                            ()=>{console.log("Create Folder fails fw_bin");})});
        });
        return true;
      }
    }
    return false;
  }

  private copyToLocalFiles(){
    console.log("Copy to local Files");
    let otaToLocal:OtaInfo = this.otaDb;
    otaToLocal.BasePath=""; //reset for local
    otaToLocal.Binaries.forEach((xBin)=>{
      let temp:Blob = new Blob([xBin.Contents], {type:"ArrayBuffer"});
      File.writeFile(this.localDBPath, xBin.File, temp, true)
    })
    File.writeFile(this.localDBPath, environment.blueNRG_DB_entry, JSON.stringify(otaToLocal), true);

  }

  public clearLocalDB():Promise<any>{
      return File.removeRecursively(this.localDBPath, "").then(()=>{console.log("Remove local db OK");}, (reason)=>{console.log("Remove local db fail " + reason )});
  }

  validateAndStoreBuffer(bin:ArrayBuffer, item:BinaryInfo):Observable<BinaryInfo>{
    return Observable.create((observer)=> {
      item.Contents = bin;
      if (!loadService.checkItem(item))
        item.Contents = null;
      observer.next(item);
      observer.complete();
    });
  }

  downloadOnLineFirmware():Observable<number>{
    return Observable.create((observer)=>{
      try {
        this.loadDB(environment.baseURL + "assets/fw_bin/", environment.blueNRG_DB_entry)
            .subscribe((value) => {
                  console.debug("Remote Data", value);
                  if (this.updateLocalDB(value))
                    observer.next(0);
                  else
                    observer.next(1);
                },
                (error)=>{observer.next(3);})
      } catch (e) {observer.next(3);}

    })

  }

}
