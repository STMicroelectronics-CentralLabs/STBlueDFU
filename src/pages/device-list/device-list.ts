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
import {NavController, Platform, NavParams, Refresher, LoadingController, AlertController} from 'ionic-angular';
import {OtaItemDetailsPage} from '../ota-details/ota-details';
import {BLE} from 'ionic-native';
import {BleNode} from '../../Common/bleNode';
import {DFU_OTAService} from '../../DFU_OTA/DFU_OTAService';
import {BinaryInfo} from "../../Common/bleOtaBinaries";
import {OtaService} from "../../DFU_OTA/bleOtaDefine";
import {Convert} from "../../Common/utils";
import {Component} from "@angular/core";


@Component({
	templateUrl: 'device-list.html'
})

export class DeviceListPage {
		selectedItem: BleNode;
		items: Array<BleNode>=[];

		refreshing:boolean;
		binaryFile:BinaryInfo;
		mRefresher:Refresher;

	constructor(private nav: NavController, private loadingCtrl: LoadingController, private alertCtrl:AlertController, navParams: NavParams, private platform: Platform) {

		this.binaryFile = navParams.get('fileBin');
		console.log("Binary info "+ this.binaryFile.Description);

		this.refreshDeviceList();
	}

	presentLoading(message:string, duration=5000){
		let loading=this.loadingCtrl.create({
			content: message,
			duration: duration,
			dismissOnPageChange: true
		});

		loading.present();
	}

	showMessage(title:string, message:string){
		console.log(title + "  --- " + message);
	    let alert=this.alertCtrl.create({title:title, subTitle:message, buttons:['OK'] });
		alert.present();
	}

	public static getAdvertisingData(adv:ArrayBuffer, type : number):ArrayBuffer{
		var adData = new Uint8Array(adv)
		var retBuffer:Uint8Array = null;

		//console.log("Get adv type = " + type + "data " + Convert.toString(adv));
		let i=0;
		while (i + 1 < adData.byteLength ){

			if (adData[i+1] == type && (i + adData[i]) < adData.byteLength){
				try {
					retBuffer = adData.slice(i + 1, i + 1 + adData[i]);
					console.log("Get buffer size = " +retBuffer.byteLength + " return = "  + Convert.toString(retBuffer.buffer) + " buff size" + retBuffer.buffer.byteLength);
				} catch (ex ) {
					retBuffer = null;
				}
				break;
			}
			i += adData[i]+1;
		}

		return retBuffer == null ? null : retBuffer.buffer;
	}

	bleScan() {
		this.refreshing = true;

		let handlerInterval = setInterval(
			()=>{
				if (this.refreshing == false) {
					clearInterval(handlerInterval);
				}
			}, 500);

		let uuidsFilter :  string [] = (this.platform.is("ios") || (this.platform.is("android") && this.platform.version().num >= 5 )  ? [OtaService.OTA_SERVICE_LE.toString()] :[]); //not works on Francesco Smartphone Android 4.4.2
		BLE.scan(uuidsFilter, 5).subscribe(
			device => {
				if (device != null) {
					device.connectedState = false;
					let strId:string = device.id.split(":").join("");
					if (strId.length >= 6)
						device.friendlyName = device.name + " @" + strId.substr(strId.length - 6, 6);
					else
						device.friendlyName = device.name + " @" + device.id;

					console.log("Device found " + device.friendlyName);

					let tempTxPower = this.platform.is("ios") ? null : new DataView(DeviceListPage.getAdvertisingData(device.advertising, 0x0A));
					device.txPower = this.platform.is("ios") ? device.advertising.kCBAdvDataTxPowerLevel:  (tempTxPower != null ? tempTxPower.getInt8(1) : 1);

					if (!this.items.find((node)=>{return node.id === device.id}))
						this.items.push(device);
					this.items = this.items.sort((a,b)=>{return (b.rssi - a.rssi); });

				}
			},
			error => {this.refreshing = false; console.log("ERROR: " + error); },
			()    => { this.refreshing = false; console.log("Completed scan");});
	}


	refreshDeviceList() {

		let nodesConnected = this.items.filter(elemFilter => {return elemFilter.connectedState});

		this.items = nodesConnected;

		BLE.isEnabled().then(
			()=>{this.bleScan(); },
			()=>{BLE.enable().then(
				()=>{this.bleScan();},
				()=>{this.showMessage("Warning!","BLE Enable fail.");})
			}
		)
	}

	doRefresh(refresher) {
		console.log('Begin async operation', refresher);
		this.refreshDeviceList();
		setTimeout(() => {
		console.log('Async operation has ended');
		refresher.complete();
		}, 5000);
	}


	itemTapped(event, item) {
		BLE.isConnected(item.id).then(
			() => {
					console.log("Manual disconnect " + item.name + " @" +item.id);
					this.presentLoading("Disconnect " + item.name, 200);
					BLE.disconnect(item.id);
					item.connectedState = false;
					item.otaService = null;
				},
			() => {
				this.presentLoading("Connecting " + item.friendlyName, 2000);

					BLE.connect(item.id).subscribe(
						device=>{
								console.log("Connecetd " + device.friendlyName);
								item.connectedState = true;
								item.services = device.services
								//console.log("SERVICIES:" + JSON.stringify(device.services));
								item.characteristics = device.characteristics;
								//console.log("CHAR:" + JSON.stringify(device.characteristics));
								if(DFU_OTAService.isServiceAvailable(item)){
									item.otaService = new DFU_OTAService(item);
									console.log("Ota available!");
								}else {
									BLE.disconnect(item.id);
									item.connectedState = false;
									console.log("Ota NOT available!- Disconnected");
								}

						},
						devDis =>{
								console.log("Autodisconnect " + item.friendlyName);
								item.connectedState = false;
								item.otaService = null;
								item.services = devDis.services;
								item.characteristics = devDis.characteristics;
						}
					);
			}
		);
	}


	onClickFloatActionBtn(event){


        let connectedDev = this.items.filter(elemFilter => {return elemFilter.connectedState});
		console.log("Click o Float action! " + connectedDev.length);
        if (connectedDev.length > 0){
            this.nav.push(OtaItemDetailsPage, {
                bleNodes: connectedDev,
                fileBin : this.binaryFile
            });
        } else {
            this.showMessage("Warning!", "Connect to 1 or more devices with DFU OTA services before continue!" );
        }


	}
}
