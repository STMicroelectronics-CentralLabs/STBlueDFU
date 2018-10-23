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
export class CRCCalc {
    
    static POLYNOME:number = 0x04C11DB7;
    static INITIAL_CRC_VALUE:number = 0xFFFFFFFF;
    static LONGTOUINT32_MASK:number = 0xFFFFFFFF;
    static MSB_MASK:number = 0x80000000;
    static LOWER:number = 0; /* lower limit */
    static CRCUPPER:number = 32;  /* CRC software upper limit */
    static STEP:number = 1; /* step size */
    static STEP_DATA_SIZE:number = 4; /* step size */
    static CRC_SHIFT:number = 1;

    /**
     * @param Initial_Crc: specifies the previous Crc data
     * @param Input_Data:  specifies the input data
     * @brief Algorithm implementation of the CRC
     * @retval Crc: the CRC result of the input data
     */
     private static CrcSoftwareFunc(Initial_Crc:number, Input_Data:number, POLY:number):number {
        let bindex:number = 0;
        let Crc:number = 0;

        /* Initial XOR operation with the previous Crc value */
        Crc = (Initial_Crc ^ Input_Data);

        /* The CRC algorithm routine */
        for (bindex = this.LOWER; bindex < this.CRCUPPER; bindex = bindex + this.STEP) {
            if ((Crc & this.MSB_MASK) != 0) {
                Crc = ((Crc << this.CRC_SHIFT) ) ^ POLY;
            } else {
                Crc = ((Crc << this.CRC_SHIFT) );
            }
        }
        return Crc & this.LONGTOUINT32_MASK; //To convert in unsigned int
    }

    public static CrcSoftwareCalc(pBuffer:Uint8Array):number {
        let integerValue:number;
        let retComputedCRC = this.INITIAL_CRC_VALUE;
        if (pBuffer != null && pBuffer.length > 0) {
            let temp1:Uint8Array = new Uint8Array(Math.ceil(pBuffer.length / this.STEP_DATA_SIZE) * this.STEP_DATA_SIZE);
            temp1.set(pBuffer, 0);
            
            let temp:Uint32Array = new Uint32Array(temp1.buffer);
            
            /* Compute the DataBuffer table CRC via The C code of the CRC */
            for (let hindex= 0; hindex < temp.length; hindex++) {
                integerValue = temp[hindex];
                retComputedCRC = this.CrcSoftwareFunc(retComputedCRC, integerValue, this.POLYNOME);
            }
        }
        
        console.log("CrcCalc ret "+ (retComputedCRC & this.LONGTOUINT32_MASK));
        
        return (retComputedCRC & this.LONGTOUINT32_MASK);
    }

}
