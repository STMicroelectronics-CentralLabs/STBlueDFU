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
/*
ts
 *   {
 *       "name": "Battery Demo",
 *       "id": "20:FF:D0:FF:D1:C0",
 *       "advertising": [2,1,6,3,3,15,24,8,9,66,97,116,116,101,114,121],
 *       "rssi": -55,
 *       "services": [
 *           "1800",
 *           "1801",
 *           "180f"
 *       ],
 *       "characteristics": [
 *           {
 *               "service": "1800",
 *               "characteristic": "2a00",
 *               "properties": [
 *                   "Read"
 *               ]
 *           },
 *           {
 *               "service": "1800",
 *               "characteristic": "2a01",
 *               "properties": [
 *                   "Read"
 *               ]
 *           },
 *           {
 *               "service": "1801",
 *               "characteristic": "2a05",
 *               "properties": [
 *                   "Read"
 *               ]
 *           },
 *           {
 *               "service": "180f",
 *               "characteristic": "2a19",
 *               "properties": [
 *                   "Read"
 *               ],
 *               "descriptors": [
 *                   {
 *                       "uuid": "2901"
 *                   },
 *                   {
 *                       "uuid": "2904"
 *                   }
 *               ]
 *           }
 *       ]
 *   }
*/
import {DFU_OTAService} from '../DFU_OTA/DFU_OTAService';

export interface BleNode{
	name:string;
	txPower:number;
	friendlyName:string;
 	id:string;
	advertising:Array<number>;
	rssi:number;
	connectedState:boolean;
 	services:Array<string>;
 	characteristics:Array<BleChar>;
	otaService:DFU_OTAService; 
}

export interface BleChar{
	service:string;
	characteristic:string;
 	properties:Array<string>;
	nodeId:string;
	notifyEnabled:boolean;
	buffer:string; 
	packets:number;
}
