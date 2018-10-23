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
import {Component}  from '@angular/core';
import {NavController, AlertController} from 'ionic-angular';
import { BinaryInfo} from '../../Common/bleOtaBinaries'
import {Convert, loadService} from '../../Common/utils'
import {DeviceListPage} from "../device-list/device-list";
import {MessagesManager} from "../../providers/messages-manager";
import {FirmwareManager} from "../../providers/firmware-manager";


@Component({
	templateUrl: 'file_sel.html'
})

export class FileSelectionPage {

	constructor(private alertCtrl: AlertController, private nav: NavController, public otaManager:FirmwareManager, private messages:MessagesManager) {
		// If we navigated to this page, we will have an item available as a nav param
		console.log("Create FileSelectionPage");
	}


	toHex(n:number): string
	{
		return Convert.toHexString(n);
	}

	itemTapped(event, item){
		console.log("Item selected " + item.Target);
		this.onSelectBinItem(this.otaManager.otaDb.BasePath + item.File, item);
	}


	onSelectBinItem(strFileName:string, item:BinaryInfo){
		if (loadService.checkItem(item))
			this.nav.push(DeviceListPage, {fileBin : item});
		else
        {
			console.log("error on load db");
            this.alertCtrl.create({
                title:"Fail to load binary!",
                subTitle:"Fail to load binary from local db. Try to clear the local db and update the firmware online.",
                buttons:[{text:"Ok", role:"cancel"}]
            }).present();

        }
	}


}
