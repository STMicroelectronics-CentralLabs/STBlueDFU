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
import { NavController, Platform} from 'ionic-angular';
import {File,  Entry} from 'ionic-native'
import { BinaryInfo} from '../../Common/bleOtaBinaries'
import {DeviceListPage} from "../device-list/device-list";
import {Component} from "@angular/core";
import {Http, ResponseContentType} from "@angular/http";
import {loadService} from "../../Common/utils";
declare var cordova: any;

@Component({
	templateUrl: 'filesys_sel.html'
})


export class FilesystemSelectionPage {
		basePathToRead:string;
		relativePath:string="";
		filesEntries:Entry[];

	constructor(private nav: NavController, private platform:Platform, private http:Http) {
		console.log("Create Filesystem SelectionPage");

		this.basePathToRead = this.platform.is("android") ? cordova.file.externalRootDirectory :
			this.platform.is("ios") ? cordova.file.documentsDirectory :
				"";
		this.loadFolderFiles("/");
	}

	loadFolderFiles(strRelativePath:string){
		console.log("Load Path =" +strRelativePath);
		this.relativePath = strRelativePath;
		File.listDir(this.basePathToRead, strRelativePath.substr(1)).then(
			(files)=>{ this.filesEntries = files.filter((f)=>{return (f.name.endsWith(".bin")) || f.isDirectory}); console.log("Number of files =" + this.filesEntries.length);},
			(reason)=>{console.log("Error List dir :" + reason);});

	}

	btnNavigateUp($event){
		this.loadFolderFiles(this.relativePath.substring(0, this.relativePath.lastIndexOf("/")))
	}

	getSize(item:Entry):number{
		let t= 0

		item.getMetadata((metadata)=>{
			t = metadata.size;
		//	console.log("Item selected " + item.name + " size =" +t);
		})
		return t;
	}
	itemTapped(event, item:Entry){
		if (item.isDirectory ) {
			this.loadFolderFiles(item.fullPath.substring(0, item.fullPath.lastIndexOf("/")));
		}
		else {
			this.selectFile(item)
		}
	}

	selectFile(itemToRead:Entry){
		let item:BinaryInfo = {Target:"ST BlueNRG OTA", Name:"", Version:"unknown", Description:"User selected binary file", Type:"bin", File:"", BaseAddress:-1, RestartCommand:0, FileSize:0, md5:"", Contents:null };
		item.Name = itemToRead.name.substring(0,itemToRead.name.indexOf(".bin"));
		item.File = itemToRead.name;

		loadService.getFile(this.http, itemToRead.nativeURL, ResponseContentType.ArrayBuffer)
			.subscribe((val)=>{
				item.Contents = val.arrayBuffer();
				item.FileSize = item.Contents.byteLength;
				this.nav.push(DeviceListPage, {fileBin : item});
			});
	}


}
