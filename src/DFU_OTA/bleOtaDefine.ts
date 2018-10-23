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
        
        export enum OtaService {
                //OTA Service
                OTA_SERVICE =  <any>"8a97f7c0-8506-11e3-baa7-0800200c9a66",
                OTA_SERVICE_LE =  <any>"669a0C20-0008-a7ba-e311-0685c0f7978a"
        }

        export enum OtaChars {
                
                DFU_OTA_IMAGE = <any>"122e8cc0-8508-11e3-baa7-0800200c9a66", //Read

                DFU_OTA_NEW_IMAGE = <any>"210f99f0-8508-11e3-baa7-0800200c9a66", //Read, WriteWithoutResponse, Write

                DFU_OTA_NEW_IMAGE_TU_CONTENT = <any>"2691aa80-8508-11e3-baa7-0800200c9a66", //Read, WriteWithoutResponse, Write

                DFU_OTA_EXPECTED_IMAGE_TU_SEQNUM = <any>"2bdc5760-8508-11e3-baa7-0800200c9a66" //Read, Notify
        
        }

        export enum FlashErrorCode {
                FLASH_WRITE_ERROR =<any>"FLASH WRITE ERROR",
                FLASH_VERIFY_ERROR =<any>"FLASH VERIFY ERROR",
                FLASH_SEQUENCE_ERROR = <any>"FLASH SEQUENCE ERROR",
                FLASH_GLOBAL_CHECKSUM_ERROR = <any>"FLASH GLOBAL CHECKSUM ERROR",
                FLASH_ENTRY_POINT_APPLICATION_ERROR = <any>"FLASH ENTRY POINT APPLICATION ERROR",
                FLASH_ENTRY_POINT_WRITE_ERROR = <any>"FLASH ENTRY POINT WRITE ERROR",
                FLASH_IMAGE_SIZE_ERROR = <any>"FLASH IMAGE SIZE ERROR",
                FLASH_BASE_ADDRESS_ERROR = <any>"FLASH BASE ADDRESS ERROR",
                START_CURRENT_BASE_ADDRESS_ERROR = <any>"START CURRENT BASE ADDRESS ERROR",
                START_DEFAULT_BASE_ADDRESS_ERROR = <any>"START DEFAULT BASE ADDRESS ERROR",
                START_SPECIFIC_BASE_ADDRESS_ERROR = <any>"START SPECIFIC BASE ADDRESS ERROR",
                OTA_COMMAND_INVALID = <any>"OTA COMMAND INVALID",
                TIME_OUT_ERROR = <any>"TIME-OUT ERROR",
                UNKNOWN_ERROR = <any>"UNKNOWN ERROR"
        }

        export enum OTA_State {
                IDLE = <any>"IDLE",
                ERASING = <any>"ERASING",
                PROGRAMMING = <any>"PROGRAMMING",
                VERIFY = <any>"VERIFY",
                UPGRADED = <any>"UPGRADED",
                ERROR = <any>"ERROR"
        }

