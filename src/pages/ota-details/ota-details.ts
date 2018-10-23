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
import {NavParams, AlertController} from 'ionic-angular';
import {BleNode} from '../../Common/bleNode';
import {BLE} from 'ionic-native';
import {DFU_OTAService} from '../../DFU_OTA/DFU_OTAService';
import {BinaryInfo} from "../../Common/bleOtaBinaries";
import {OtaStatus, OtaDeviceImage} from "../../DFU_OTA/otaStatus";
import {Convert} from "../../Common/utils";
import {OTA_State} from "../../DFU_OTA/bleOtaDefine";
import {Component} from "@angular/core";

@Component({
  templateUrl: 'ota-details.html',
})
export class OtaItemDetailsPage {
    connectedNodes:Array<BleNode>;
    otaBinaryFile:BinaryInfo;
    sequenceGroup:number = 8;


  constructor(private alertCtrl: AlertController, navParams: NavParams) {
    this.connectedNodes = navParams.get('bleNodes');
    this.otaBinaryFile = navParams.get('fileBin');
    console.log("Create OtaItemDetailsPages");
  }

  showMessage(title:string, message:string):Promise<any>{
		let alert=this.alertCtrl.create({title:title, subTitle:message, buttons:['OK'] });
		return alert.present();
  }

  fwUpload(event) {
    let handler = setInterval(
        ()=>{
          //no more refresh need!
          if(this.connectedNodes
                  .filter((dev)=>{ return !(dev.otaService.OTA_State == OTA_State.ERROR || dev.otaService.OTA_State == OTA_State.UPGRADED ); })
                  .length == 0 )
            clearInterval(handler);
        }, 500);

    console.log("function fwUpload ");
    this.connectedNodes.forEach((otaDev)=>{
      console.log("Ota dev" + otaDev);
        if (otaDev.otaService != null)
            otaDev.otaService.deviceUpdate(this.otaBinaryFile.Contents, this.otaBinaryFile.BaseAddress, this.otaBinaryFile.RestartCommand, this.sequenceGroup).subscribe(
                (progress:OtaStatus)=>{otaDev.otaService.mOtaStatus = progress; console.log("deviceUpdate progress = " + (progress.progress * 100).toFixed(2) + "% time elapsed:" + progress.timeElapsed + " ota state:" + progress.state )},
                (err)=>{this.disconnectDevice(otaDev, err); },
                ()=>{this.disconnectDevice(otaDev, "Done"); })
      });
  }

  disconnectDevice(dev:BleNode, message:string){
    BLE.disconnect(dev.id);
    dev.otaService.mOtaError = message;
    dev.connectedState = false;
    console.log("deviceUpdate status = " + message);
  }

  refreshBound(event, item){
    (item.otaService as DFU_OTAService).readImageParam();
  }

  stopRemove(event, item) {
    if ((item.otaService as DFU_OTAService).OTA_State == OTA_State.PROGRAMMING ||
        (item.otaService as DFU_OTAService).OTA_State == OTA_State.ERASING ||
        (item.otaService as DFU_OTAService).OTA_State == OTA_State.VERIFY )
      (item.otaService as DFU_OTAService).stopProgramming();

    if ((item.otaService as DFU_OTAService).OTA_State == OTA_State.IDLE )
      this.connectedNodes = this.connectedNodes.filter((dev)=>{return (dev.id !== item.id);})

  }

  toHexString(n:number, digits:number=8 ){
    return Convert.toHexString(n,digits);
  }


  displayMessage(event, message)
  {
    this.showMessage(message.title, message.text);
  }

  getDeviceImage(event, item){
    console.log("get images");

    if(item.otaService.mOtaAvailableDeviceImages ==null) {
      item.otaService.mOtaAvailableDeviceImages = new Array<OtaDeviceImage>();

      item.otaService.getAvailableFw().subscribe(
          (devImg) => {
            item.otaService.mOtaAvailableDeviceImages.push(devImg);
          },
          (err) => {
            setTimeout(() => {
            }, 1000);
            console.log("get available device image error :" + err)
          },
          () => {
            setTimeout(() => {
            }, 1000);
            console.log("get available device image completed");
          });
    } else {
      //to clear image available image list
      item.otaService.mOtaAvailableDeviceImages =null;
    }

  }

  runSelectedItemImage(event, item, img){
    item.otaService.startFWAddress(img.startAddress);
  }

}
