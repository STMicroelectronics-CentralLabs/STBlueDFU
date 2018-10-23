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
import { Component, ViewChild } from '@angular/core';

import {Platform, MenuController, Nav, Loading, Alert, AlertController, LoadingController} from 'ionic-angular';

import { StatusBar } from 'ionic-native';

import {FileSelectionPage} from "../pages/file-selection/file_sel";
import {AboutPage} from "../pages/about-app/about-app";
import {FilesystemSelectionPage} from "../pages/filesystem-selection/filesys_sel";
import {FirmwareManager} from "../providers/firmware-manager";


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  // make HelloIonicPage the root (or first) page
  rootPage: any = FileSelectionPage;
  pages: Array<{title: string, icon:string, component: any}>;

  constructor(
    public platform: Platform,
    public menu: MenuController,
    private otaManager: FirmwareManager,
    private alertCtrl: AlertController,
    private loadingCtrl:LoadingController
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Local DB Binaries', icon:"paper", component: FileSelectionPage },
      { title: 'Filesystem Browse', icon:"folder-open", component: FilesystemSelectionPage },
      { title: 'Check for DB Updates...', icon:"cloud-download", component: null },
      { title: 'Clear Local DB...', icon:"trash", component: null },
      { title: 'About', icon:"information-circle", component: AboutPage }
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      console.log("READY Init App");
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    if (page.component == null){
      switch (page.title){
        case 'Clear Local DB...':
          this.onClickRemoveLocalDBBtn();
          break;
        case 'Check for DB Updates...':
          this.onClickUpdateDBOnlineBtn();
          break;
      }

    }else {

      // navigate to the new page if it is not the current page
      this.nav.setRoot(page.component);
    }
  }

  onClickUpdateDBOnlineBtn(){
    console.log("Loading from remote DB");

    this.alertCtrl.create({
      title:"Online Firwmare DB Update",
      subTitle:"Check online for new devices compatible firmware available?",
      buttons:[{text:"Cancel", role:"cancel"},
        {text:"Ok", handler:data=>{this.downloadOnlineFw()}}] })
        .present();
  }

  loader:Loading;
  downloadOnlineFw(){
    this.presentLoading()
    this.otaManager.downloadOnLineFirmware().subscribe(
        (result)=> { this.loader.dismissAll(); this.showUpdateFwResult(result);},
        (errir)=>{this.loader.dismissAll();},
        ()=>{this.loader.dismissAll();})
  }

  presentLoading(){
    this.loader = this.loadingCtrl.create({content:"Please wait...", duration:20000});
    this.loader.present()
  }
  showUpdateFwResult(res:number){
    let alert:Alert = this.alertCtrl.create({buttons: ['OK']});
    switch (res){
      case 0:
        alert.setTitle("Update Firmware DB");
        alert.setSubTitle("Firmware DB Updated successfully to version: " + this.otaManager.otaDb.Version);
        break;
      case 1:
        alert.setTitle("Update Firmware DB");
        alert.setSubTitle("Your firmware DB is already updated");
        break;
      default:
        alert.setTitle("Network error!");
        alert.setSubTitle("You must be connected to get online firmwares!");
        break;
    }
    alert.present();
  }
  clearLocalDb(){
    this.otaManager.clearLocalDB()
        .then((val)=>{console.log("Clear DB OK"); this.otaManager.otaDb = null; this.otaManager.loadDefaultDB()},(error)=>{console.log("Clear DB error");}).catch((reason)=>{console.log("Clear DB error catch");})
  }

  onClickRemoveLocalDBBtn(){
    this.alertCtrl.create({
      title:"Clear local DB",
      subTitle:"Are you sure to clear the local Firmwares DB?",
      buttons:[{text:"Cancel", role:"cancel"},
        {text:"Ok", handler:data=>{this.clearLocalDb();}}] })
        .present();

  }
}
