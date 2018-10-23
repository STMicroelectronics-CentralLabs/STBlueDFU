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
import {environment} from "../environments/environment";
import {NativeStorage} from "ionic-native";
import {AlertController, Platform} from "ionic-angular";
import {Observable} from "rxjs";
import {loadService} from "../Common/utils";

interface IAppMessage{
    id:number,
    type:string,
    title:string,
    text:string,
    validDate:{
        begin:string,
        end:string
    },
    link:{
        url:string,
        text:string,
        iOS: {
            url:string,
            text:string
        },
        android: {
            url:string,
            text:string,
        }
    }
    showAgain:boolean,
    views:number
}

@Injectable()
export class MessagesManager {

  constructor(public http: Http, public alertCtrl: AlertController, private platform:Platform) {
      this.platform.ready().then(()=>{
          console.log('MessagesManager Provider Ready');
          this.loadCurrentMessages();
      });
  }

  private mexsDB: Array<IAppMessage>;

  private loadCurrentMessages(){
    setTimeout(()=>{
       console.log("Load Current Messages");
      NativeStorage.getItem(environment.messageKey)
          .then((val)=> {
            this.mexsDB = val;
             console.log("Get Messages" + JSON.stringify(this.mexsDB));
            this.checkAndStoreMessages();

          })
          .catch((reason)=>{
             console.log("No Messages, Getting News" + JSON.stringify(reason));
            this.checkAndStoreMessages();
          })

    },500);
  }

  private checkAndStoreMessages(){
    loadService.getFile(this.http, environment.baseURL + "messages.json", ResponseContentType.Json)
        .subscribe(
            (message_list)=>{
              let mexs:Array<IAppMessage> = message_list.json();
              let newMessages =  mexs.filter((item)=>{return (this.mexsDB == null || this.mexsDB.filter((stored)=>stored.id == item.id ).length == 0) });
               console.log("new messages " + newMessages.length);
              if (newMessages.length > 0) {
                if (this.mexsDB == null)
                  this.mexsDB = [];

                this.updateMessageDB(this.mexsDB.concat(newMessages))
                    .then((val) => {
                      this.showMessages();
                    })
              }
              else { this.showMessages()}
            },
            (reason)=>{
                console.log("Error on get  " + reason);
               this.showMessages();},
            ()=>{
                console.log("Get message complete");
                this.showMessages();}
        )
  }

  private updateMessageDB(db:Array<IAppMessage>):Promise<Array<IAppMessage>>{
    this.mexsDB = db;
    //console.log("Update MessageDB" + JSON.stringify(db) );
    return NativeStorage.setItem(environment.messageKey, db);
  }

  private updateItemMexDB(item:IAppMessage){
    let idx = this.mexsDB.findIndex((stored)=>stored.id == item.id);
    if (idx >= 0) {

      this.mexsDB[idx] = item;
      this.updateMessageDB(this.mexsDB);
    }

  }

  private messagesIdxToShow:number = -1;

  private showMessages(){
      if (this.mexsDB != null && this.mexsDB.length > 0 && this.messagesIdxToShow == -1){
      this.messagesIdxToShow = 0;
      this.showNextMessage();
    }
  }

  private showNextMessage() {
    if (this.messagesIdxToShow > -1  && this.messagesIdxToShow < this.mexsDB.length ){
      let item = this.mexsDB[this.messagesIdxToShow++];
      this.showMessage(item).subscribe((val)=>{this.updateItemMexDB(val); this.showNextMessage()});
    }
    else
        this.messagesIdxToShow = -1;
  }

  private showMessage(mex:IAppMessage):Observable<IAppMessage>{
    return Observable.create((observer)=>{
      mex.views = mex.views == null ? 0 : mex.views;
      mex.showAgain = mex.showAgain == null ? true : mex.showAgain;

      if ((mex.validDate == null || mex.validDate.begin==null || Date.parse(mex.validDate.begin) <= Date.now())
          && (mex.validDate == null || mex.validDate.end==null || Date.parse(mex.validDate.end) >  Date.now())){

        //console.log("showNextMessage Date ok");

        if (mex.type === "always" ||
            (mex.type === "once" && mex.views == 0) ||
            (mex.type === "ask" && 	(mex.views == 0 || mex.showAgain))){
          // console.log("showNextMessage Message to show"  + JSON.stringify(mex));

          let buttons:Array<any> = [];
          if (mex.type === "ask")
            buttons.push({text:"Don't Ask Again", handler:data => { mex.showAgain = false;  mex.views++; observer.next(mex)   }});
          buttons.push({text:"Ok", role:"cancel", handler:data => { mex.views++; observer.next(mex) }});
          this.alertCtrl.create({title:mex.title, subTitle: mex.text, buttons:buttons})
              .present();
        }
        else observer.next(mex);
      }
      else observer.next(mex);
    });
  }
}
