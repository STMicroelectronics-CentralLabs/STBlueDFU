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

import {BleNode, BleChar} from '../Common/bleNode';
import { Platform } from 'ionic-angular';
import {OTA_State, OtaService, OtaChars, FlashErrorCode} from './bleOtaDefine';
//import {BLE} from 'ionic-native';
import { BLE } from '@ionic-native/ble';
//import { ble as BLE } from '@ionic-native/ble'
//import {ble as BLE } from 'cordova-plugin-ble-central/BLE'
import {Observable} from "rxjs/Observable";
import {OtaStatus, OtaDeviceImage} from "./otaStatus";
import {CRCCalc} from "./CRCCalc";
import {Convert} from "../Common/utils";
import {Observer} from "rxjs/Observer";
    
export class DFU_OTAService {

    private static readonly EXTENDED_PACKAGE_LENGTH:number = 217 //220-3
    private static readonly PACKAGE_LENGTH:number = 16
    private static readonly HEADER_LENGTH:number = 4

    private mDataLength = DFU_OTAService.PACKAGE_LENGTH

    private mOTA_State:OTA_State = OTA_State.IDLE;
    private mLowerBound:number = -1;
    private mUpperBound:number = -1;
    private mGroupSequenceWaitFeedback:number = 8;

    private mBaseAddress:number;
    private mImageSize:number;
    private imageToSend:Uint8Array;
    private mCrcDataSend:number;
    private mTimeStart:Date;
    private mLastUpdate:Date;
    private mLastSequenceSending:number = -1;
    private mLastSequenceSent = this.mLastSequenceSending;
    private mSequenceRepeat = 0;
    private mTotalSequences = 0;
    public mOtaStatus:OtaStatus;
    public mOtaError:string;
    public mRestartCmd:number;
    public mProtocolVer:number;
    public mOtaAvailableDeviceImages:Array<OtaDeviceImage>;

    private get TimeElapsed() : number{
        return (Date.now() - this.mTimeStart.getTime());
    }

    public get LowerBound():number {
        return this.mLowerBound;
    }

    public get UpperBound() :number{
        return this.mUpperBound;
    }

    public  static isServiceAvailable(n:BleNode):boolean{
        let bRet:boolean = false;

         if (n.connectedState)
             bRet = n.characteristics.filter(elem => {return ((elem.service.toLowerCase() == (OtaService.OTA_SERVICE.toString())) && 
                                                              (elem.characteristic.toLowerCase() == OtaChars.DFU_OTA_IMAGE.toString() ||
                                                              elem.characteristic.toLowerCase() == OtaChars.DFU_OTA_NEW_IMAGE.toString() ||
                                                              elem.characteristic.toLowerCase() == OtaChars.DFU_OTA_NEW_IMAGE_TU_CONTENT.toString() ||
                                                              elem.characteristic.toLowerCase() == OtaChars.DFU_OTA_EXPECTED_IMAGE_TU_SEQNUM.toString())
                                                              )}).length == 4;
        console.log("isServiceAvailable ="+ bRet);      
        return bRet;
    }

    public hasOtaAvailable():boolean {
        return DFU_OTAService.isServiceAvailable(this.mNode);
    }
    
    public get OTA_State():OTA_State {
        return this.mOTA_State;
    }

    private deviceReady():boolean { return ((this.mLowerBound != -1) && (this.mUpperBound != -1));}

    private ble:BLE = new BLE()

    constructor(private mNode:BleNode,private platform:Platform){
        this.mLowerBound = -1;
        this.mUpperBound = -1;
        this.mTimeStart = new Date();
        this.mLastUpdate = new Date();

        this.mTimeStart.setTime(Date.now());
        this.mLastUpdate.setTime(Date.now());

        this.readImageParam();
        this.mOTA_State = OTA_State.IDLE;
    }


    public readImageParam():void {
        console.log("ReadParameter");
        this.ble.read(this.mNode.id, OtaService.OTA_SERVICE.toString(),  OtaChars.DFU_OTA_IMAGE.toString()).then(
            value =>{
                 if (value.byteLength >= 8)
                 {
                     let decompose:DataView = new DataView(value);
                     //bigEndian values
                     this.mLowerBound = decompose.getInt32(0, false);
                     this.mUpperBound = decompose.getInt32(4, false);
                     
                     this.mProtocolVer = 0x10;
                     if (value.byteLength >= 9) //protocol version > 1.2
                        this.mProtocolVer = decompose.getUint8(8);
                     
                }
                

                console.log("ReadParameter Lower 0x" + this.LowerBound.toString(16) + " Upper 0x" + this.UpperBound.toString(16))                
            },
            reason =>{console.log("ReadParameter fail reason " + reason)});
    }

    private checkParam(newImage:ArrayBuffer, baseAddress:number, baseAddressAlign:boolean):Observable<void>{
        return  Observable.create(
            (observer)=>{
                let strError:string = "";
                console.log("function Observable.create ");
                if (this.mNode.characteristics == null || this.mNode.connectedState == false)
                    strError += "Device not connected\n";
                if (!this.hasOtaAvailable())
                    strError += "BLE DFU OTA service not available for device\n";
                if (!this.deviceReady())
                    strError += "Device not yet ready --> read the parameters\n";
                if ((baseAddressAlign) && ((baseAddress & 0x1FF) != 0))
                    strError += "Base Address must be 512 multiple\n";
                if (baseAddress < this.mLowerBound)
                    strError += "Base Address must be equal or greater to LB\n";
                if (newImage == null || newImage.byteLength == 0)
                    strError += "Image not selected or bad image size\n";
                if ((newImage != null) && ((baseAddress + newImage.byteLength) > this.mUpperBound))
                    strError += "Image size greater than available memory" + "base =" + baseAddress + " len =" + newImage.byteLength +" > " +this.mUpperBound +"\n";

                if (strError.length > 0) {
                    observer.error(strError);
                }else {
                    observer.complete();
                }

            }
        )
    }
    
    public deviceUpdate(newImage:ArrayBuffer, baseAddress:number=-1, restartCommand:number=0, groupSequences:number=1, paddingHalfPage:boolean=true, baseAddressAlign:boolean=true):Observable<OtaStatus>{

        //if address is not specified default is used
        if (baseAddress < 0)
            baseAddress = this.mLowerBound;
        
        this.mRestartCmd = restartCommand;

        this.mGroupSequenceWaitFeedback = groupSequences;
        this.mSequenceRepeat = 0;

        console.log("function deviceUpdate baseAddress=" + baseAddress + " startAddress=" +restartCommand + " groupSequences="+ groupSequences);


        return Observable.create((observer)=> {

            this.checkParam(newImage, baseAddress, baseAddressAlign).subscribe(
                ()=>{},
                (err)=>{observer.error(err);},
                ()=>{
                    this.mTotalSequences = Math.ceil(newImage.byteLength / 16); //16 bytes each packet
                    if (paddingHalfPage) {
                        this.mTotalSequences = Math.ceil(newImage.byteLength / 128) * 8; //if padding half page is set the size must be a multiple of 128 bytes
                    }

                    this.mBaseAddress = baseAddress;
                    this.mImageSize = this.mTotalSequences * 16;

                    this.imageToSend = new Uint8Array(this.mImageSize);
//                    this.imageToSend.fill(0);
                    this.imageToSend.set(new Uint8Array(newImage), 0);

                    this.mCrcDataSend = CRCCalc.CrcSoftwareCalc(this.imageToSend);
                    console.log("CRC ->" + this.mCrcDataSend);

                    //send data to the device info image
                    this.sendNewImagePacket(this.mImageSize, this.mBaseAddress, this.mCrcDataSend, (this.mRestartCmd <= 3) ? this.mRestartCmd : 0).then(
                        ()=>{
                            this.ble.startNotification(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_EXPECTED_IMAGE_TU_SEQNUM.toString()).subscribe(
                                buffer => {
                                    console.log("Read next image " + buffer.byteLength);

                                    let bufRead = new DataView(buffer);
                                    let bProtocol11:boolean = (bufRead.byteLength >= 8 && this.mProtocolVer < 0x12); //OTA protocol ver 1.1 proposal
                                    let nextSequence = bufRead.getUint16(0, true);
                                    let errorCode = bufRead.getUint16(2, true);
                                    if (bProtocol11)
                                        var crcLastValue = bufRead.getInt32(4, true);

                                    console.log("next seq =" + nextSequence + " error:" + errorCode + " newProtocol >" + bProtocol11 );

                                    if (errorCode == 0)
                                        this.mLastSequenceSent = this.mLastSequenceSending;

                                    if(errorCode == 0xF0){
                                        if(nextSequence == 0){
                                            this.mDataLength = Math.floor(DFU_OTAService.EXTENDED_PACKAGE_LENGTH / DFU_OTAService.PACKAGE_LENGTH)*DFU_OTAService.PACKAGE_LENGTH
                                            this.mTotalSequences = Math.ceil(newImage.byteLength / this.mDataLength); //16 bytes each packet
                                            console.log("CHANGE DATA LENGTH: "+this.mDataLength );
                                            console.log("Platform: "+this.platform);
                                            if(this.platform.is("android")){
                                                this.ble.requestMtu(this.mNode.id,DFU_OTAService.EXTENDED_PACKAGE_LENGTH)
                                                //add a delay since the callback is done when the request is sent end not
                                                //when is received
                                                .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
                                                .then(() => {
                                                          console.log('MTU Size Accepted');
                                                          this.sendImageSequence(nextSequence);
                                                        }, error => {
                                                          console.log('MTU Size Failed');
                                                        });
                                            }else{
                                                this.sendImageSequence(nextSequence);
                                            }

                                        }

                                    }else if ((errorCode == 0x0F)){ //Sequence error
                                        console.log("OTA Sequence error next " + nextSequence  + " current " + this.mLastSequenceSending);
                                        this.sendImageSequence(nextSequence);
                                    }
                                    else {
                                        //check if the sequence packet is correct
                                        //0x00 - No error; 0x0F - single frame checksum error
                                        if (!((errorCode == 0) || (errorCode == 0x0F)))
                                            this.mOTA_State = OTA_State.ERROR;

                                        switch (this.mOTA_State) {
                                            case OTA_State.ERASING:
                                                if (nextSequence == 0) { //start programming condition
                                                    this.mOTA_State = OTA_State.PROGRAMMING;
                                                    this.sendImageSequence(nextSequence);
                                                }
                                                break;
                                            case OTA_State.PROGRAMMING:
                                                if (this.mTotalSequences == (this.mLastSequenceSent + 1)) { //Programming complete
                                                    this.mOTA_State = OTA_State.UPGRADED;
                                                    if (bProtocol11) {
                                                        this.mOTA_State = OTA_State.VERIFY;
                                                        this.sendCRC(this.mCrcDataSend);
                                                    }

                                                } else {
                                                    if (((nextSequence ) % this.mGroupSequenceWaitFeedback) == 0 ) {
                                                        if (!this.sendImageSequence(nextSequence)) { //if fail to send exit with error
                                                            this.mOTA_State = OTA_State.ERROR;
                                                            //observer.error("Send image sequence fail")
                                                        }
                                                    }
                                                }
                                                break;
                                            case OTA_State.VERIFY:
                                                this.mOTA_State = OTA_State.UPGRADED;
                                                break;
                                        }
                                    }

                                    observer.next(new OtaStatus((this.mLastSequenceSent +1) * this.mDataLength, this.mImageSize, this.TimeElapsed, this.mOTA_State, this.mSequenceRepeat));

                                    if ((this.mOTA_State == OTA_State.ERROR) )
                                    {
                                        this.stopNotifyExpectedImage(observer, "Error " + ((errorCode) ? DFU_OTAService.errorFromCode(errorCode): "User Stop"));
                                    }
                                    if((this.mOTA_State == OTA_State.UPGRADED)) {
                                        this.stopNotifyExpectedImage(observer);
                                    }

                                },
                                error => {
                                    this.stopNotifyExpectedImage(observer, "BLE Read Next Sequences error " + error);
                                },
                                () => {
                                    console.log("BLE Read Next Sequences completed ");
                                    this.stopNotifyExpectedImage(observer);

                                }
                            );

                        },
                        (error)=>{observer.error(error); console.log("Error " + error);}
                    )



                    //reset start timer
                    this.mTimeStart.setTime(Date.now());
                    this.mLastUpdate.setTime(Date.now());
                    this.mOTA_State = OTA_State.ERASING;

                    observer.next(new OtaStatus(0, this.mImageSize, this.TimeElapsed, this.mOTA_State, this.mSequenceRepeat));
                });

        });
    }
    private stopNotifyExpectedImage(obs:Observer<any>, strMex:string=null): void{
        console.log("stop notify  " + (strMex? strMex : "no stop message"));
        //error frame format
        this.ble.stopNotification(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_EXPECTED_IMAGE_TU_SEQNUM.toString()).then(
            ()=> {
                if (strMex == null)
                    obs.complete();
                else
                    obs.error(strMex);
            }
        );
    }

    private static errorFromCode(errCode:number):string{
        let err:FlashErrorCode= FlashErrorCode.UNKNOWN_ERROR;

        if (errCode == 0xF0)
            err = FlashErrorCode.FLASH_SEQUENCE_ERROR;
        else if (errCode == 0xFF || errCode == 0xC3)
            err = FlashErrorCode.FLASH_WRITE_ERROR;
        else if (errCode == 0x3C || errCode == 0xC4)
            err = FlashErrorCode.FLASH_VERIFY_ERROR;
        else if (errCode == 0xC5)
            err = FlashErrorCode.FLASH_ENTRY_POINT_WRITE_ERROR;
        else if (errCode == 0xC6)
            err = FlashErrorCode.FLASH_ENTRY_POINT_APPLICATION_ERROR;
        else if (errCode == 0xC7)
            err = FlashErrorCode.FLASH_GLOBAL_CHECKSUM_ERROR;
        else if (errCode == 0xC8)
            err = FlashErrorCode.FLASH_IMAGE_SIZE_ERROR;
        else if (errCode == 0xC9)
            err = FlashErrorCode.FLASH_BASE_ADDRESS_ERROR;
        else if (errCode == 0xCA || errCode == 0xCD)
            err = FlashErrorCode.START_CURRENT_BASE_ADDRESS_ERROR;
        else if (errCode == 0xCB || errCode == 0xCE)
            err = FlashErrorCode.START_DEFAULT_BASE_ADDRESS_ERROR;
        else if (errCode == 0xCC || errCode == 0xCF)
            err = FlashErrorCode.START_SPECIFIC_BASE_ADDRESS_ERROR;
        else if (errCode == 0xD0)
            err = FlashErrorCode.OTA_COMMAND_INVALID;

        return err.toString();
    }

    private sendNewImagePacket(imageSize:number, baseAddress:number, crcValue:number, cmdValue:number):Promise<any>{
        //send data to the device info image
        let infoNewImage = new DataView(new ArrayBuffer(9));
        if ( this.mProtocolVer >= 0x12)
            infoNewImage = new DataView(new ArrayBuffer(14));
        infoNewImage.setUint8(0, this.mGroupSequenceWaitFeedback);
        infoNewImage.setUint32(1, imageSize, true);
        infoNewImage.setUint32(5, baseAddress, true);
        if (this.mProtocolVer >= 0x12) {
            infoNewImage.setUint32(9, crcValue, true);
            infoNewImage.setUint8(13, cmdValue);
        }

        console.log("buffer image and size " + Convert.toString(infoNewImage.buffer) + " size " + infoNewImage.byteLength);

        return this.ble.write(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_NEW_IMAGE.toString(), infoNewImage.buffer);
    }

    public startFWAddress(address:number):void {
        //this.sendCRC(-1, address,1);
        console.log("Running image FW at address 0x" + Convert.toHexString(address));
        this.sendNewImagePacket(-1, address, 0, 5);

    }
    public startLastFW():void {
        console.log("Running Last running FW image" );
        this.sendNewImagePacket(-1, -1, 0, 6);

    }
    public startDefaultFW():void {
        console.log("Running Default FW image" );
        this.sendNewImagePacket(-1, -1, 0, 7);

    }
    public readAvailableFwCmd():Promise<any>{
        return this.sendNewImagePacket(-1,-1, 0, 4);
    }


    private readNextAvailable(obs :Observer<OtaDeviceImage>){
        this.ble.read(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_NEW_IMAGE.toString()).then(
            buffer => {

                console.log("Read next runnable image  " + buffer.byteLength);
                let strMessageError = "";
                let bufRead = new DataView(buffer);
                if (bufRead.byteLength >= 4) { // only
                    let address:number = bufRead.getUint32(0, true);
                    let ver:string = "Unknown";
                    let name:string = "Unknown";
                    if (address != 0xFFFFFFFF) {

                        console.log("IMAGE read "+ Convert.toString(buffer));
                        if (bufRead.byteLength >= 8 && bufRead.getUint32(4, true) > 0x30303030 && bufRead.getUint32(4, true) <= 0x66666666) {// not 0000
                            ver = String.fromCharCode(bufRead.getInt8(4)) + "." +
                                String.fromCharCode(bufRead.getInt8(5)) + "." +
                                String.fromCharCode(bufRead.getInt8(6)) +
                                String.fromCharCode(bufRead.getInt8(7));
                        }
                        if (bufRead.byteLength >= 9) {

                            let tempName ="";
                            let i = 8;
                            let char = 0;
                            do {
                                char = bufRead.getInt8(i);
                                if (char != 0 )
                                    tempName += String.fromCharCode(char);
                                i++;
                            }
                            while ((char!= 0) &&  (i < bufRead.byteLength))

                            //name = String.fromCharCode(buffer.slice(8));
                            if (tempName.length > 0) {
                                name = tempName;
                            }
                        }
                        console.log("Reading image adress " + address + " ver "+ ver + " name " + name);
                        obs.next(new OtaDeviceImage(address, name, ver));
                        this.readNextAvailable(obs);

                    } else {
                        obs.complete();
                    }
                } else {
                    obs.error("Error Ota protocol ver 1.2 or above frame size");
                }

            },
            (error) => {
                obs.error("Read images available error :" + error);
            });

    }
    public getAvailableFw():Observable<OtaDeviceImage>{

        return Observable.create((observer)=> {

            if (this.mProtocolVer >= 0x12) {
                console.log("Read available images ");
                //enable the notify on get data
                this.readAvailableFwCmd().then(
                    (val)=>{this.readNextAvailable(observer);},
                    (err)=>{observer.error("Start reading images error:"+err);}
                ); //To trigger start reading available images
            }
            else {
                //error protocol version
                observer.error("Invalid protocol version");
            }
        });

    }

    private static checkSum(arr:Uint8Array, start:number, end:number=arr.byteLength):number{
        let retCheckSum:number = 0;
        for (var i=start; i<end; i++)
        {
            retCheckSum ^= arr[i];
        }
        return retCheckSum;
    }

    private sendCRC(crcVal:number) {
        let frame = new Uint8Array(20);

        let bufView:DataView = new DataView(frame.buffer);
        bufView.setInt32(1, crcVal, true);
        bufView.setInt8(17, -1);
        bufView.setUint16(18, -1, true);
        bufView.setUint8(0, DFU_OTAService.checkSum(new Uint8Array(bufView.buffer), 1));

        this.ble.write(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_NEW_IMAGE_TU_CONTENT.toString(), bufView.buffer).then(
            (result)=>{ console.log("Send CRC result" + result);},
            (reject)=>{
                console.log("Send CRC reject" + reject);
            });

        this.mLastUpdate.setTime(Date.now());
    }

    private sendImageSequence(seqToSend:number):boolean{
        let retVal:boolean = false;
        let startPosition:number = seqToSend * this.mDataLength;

        if (startPosition < this.imageToSend.byteLength) {
            if (seqToSend <= this.mLastSequenceSending)
                this.mSequenceRepeat++;
            this.mLastSequenceSending = seqToSend;

            let frameLength = DFU_OTAService.HEADER_LENGTH + this.mDataLength
            let frame:Uint8Array = new Uint8Array(frameLength);

            let imageSeq:Uint8Array = this.imageToSend.subarray(startPosition, startPosition + Math.min(this.mDataLength, this.imageToSend.byteLength - startPosition));
            frame.set(imageSeq, 1);

            let bufView:DataView = new DataView(frame.buffer);
 ///           bufView.setInt8(17, -1);
            let needAck = (((seqToSend + 1) % this.mGroupSequenceWaitFeedback) == 0) ? 1:0;
            console.log("need ACK? = " + (needAck != 0) + " seq Num " + seqToSend + " notification window" + this.mGroupSequenceWaitFeedback);
            bufView.setInt8(frameLength-3,  needAck);
            bufView.setUint16(frameLength-2, seqToSend, true);
            bufView.setUint8(0, DFU_OTAService.checkSum(new Uint8Array(bufView.buffer), 1));

            this.ble.writeWithoutResponse(this.mNode.id, OtaService.OTA_SERVICE.toString(), OtaChars.DFU_OTA_NEW_IMAGE_TU_CONTENT.toString(), bufView.buffer).then(
                (result)=> {
                    // console.log("Send seq " + seqToSend + " result" + result + "and send next");
                    if (((seqToSend + 1) % this.mGroupSequenceWaitFeedback) != 0) {
                        console.log("Send seq " + seqToSend + " result" + result + " and send next");
                        this.sendImageSequence(seqToSend + 1);
                    } else {
                        console.log("Send seq " + seqToSend+ " result" + result + " wait for next sequece to send");
                    }
                },
                (reject)=> {
                    console.log("Send seq " + seqToSend + " reject" + reject);
                });

            this.mLastUpdate.setTime(Date.now());
            retVal = true;
        }
        return retVal;
    }

    public stopProgramming():void{
        this.mOTA_State = OTA_State.ERROR;
    }

}//DFU_OTAService
