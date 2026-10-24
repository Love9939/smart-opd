/**
 * Web Bluetooth ESC/POS 58mm Thermal Printer Driver
 * Generates raw ESC/POS binary sequences and communicates with battery-backed 58mm POS printers.
 */

export interface TokenPrintData {
  clinicName: string;
  doctorName: string;
  tokenDisplay: string;
  patientName: string;
  phone: string;
  assignedSeat: string;
  category: string;
  estWaitMins: number;
  qrCodeUrl: string;
  bookedAt: string;
}

export class ThermalPrinterManager {
  private device: any = null;
  private characteristic: any = null;

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Connects to nearby Bluetooth 58mm ESC/POS printer
   */
  public async connectBluetoothPrinter(): Promise<string> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome/Edge or system print.');
    }

    const nav = navigator as any;
    try {
      this.device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard thermal printer UUID
          { namePrefix: 'MPT' },
          { namePrefix: 'POS' },
          { namePrefix: 'RP' },
          { namePrefix: 'Bluetooth' },
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455'],
      });

      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      return this.device.name || 'Bluetooth 58mm Printer';
    } catch (err: any) {
      console.warn('[ThermalPrinter] Bluetooth pairing skipped or unavailable:', err);
      throw err;
    }
  }

  /**
   * Encodes ESC/POS byte sequence for 58mm (384 dots / 32 chars per line)
   */
  public buildEscPosPayload(data: TokenPrintData): Uint8Array {
    const encoder = new TextEncoder();
    const bytes: number[] = [];

    const pushBytes = (arr: number[]) => bytes.push(...arr);
    const pushText = (text: string) => {
      const encoded = encoder.encode(text);
      for (let i = 0; i < encoded.length; i++) {
        bytes.push(encoded[i]);
      }
    };

    // ESC @: Initialize printer
    pushBytes([0x1b, 0x40]);

    // ESC a 1: Center alignment
    pushBytes([0x1b, 0x61, 0x01]);
    pushBytes([0x1b, 0x45, 0x01]); // Bold ON
    pushText(`${data.clinicName}\n`);
    pushBytes([0x1b, 0x45, 0x00]); // Bold OFF
    pushText(`${data.doctorName}\n`);
    pushText(`Date: ${new Date(data.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`);
    pushText('--------------------------------\n');

    // Token Number (GS ! 0x11: Double Width + Double Height)
    pushBytes([0x1d, 0x21, 0x11]);
    pushBytes([0x1b, 0x45, 0x01]); // Bold
    pushText(` ${data.tokenDisplay} \n`);
    pushBytes([0x1d, 0x21, 0x00]); // Normal size
    pushBytes([0x1b, 0x45, 0x00]); // Bold OFF

    pushText('--------------------------------\n');

    // ESC a 0: Left alignment
    pushBytes([0x1b, 0x61, 0x00]);
    pushText(`Patient : ${data.patientName}\n`);
    pushText(`Mobile  : +91 ${data.phone}\n`);
    pushText(`Category: ${data.category}\n`);
    pushText(`Seat    : ${data.assignedSeat}\n`);
    pushText(`Est.Wait: ~${data.estWaitMins} mins\n`);
    pushText('--------------------------------\n');

    // Center alignment for QR & Footer
    pushBytes([0x1b, 0x61, 0x01]);
    pushText('Scan QR on TV or Phone:\n');
    pushText(`smartopd.in/q/demo\n`);
    pushText('\n');
    pushText('Please wait in allocated seat.\n');
    pushText('*** SmartOPD & DentalFlow ***\n');

    // Feed lines & Cut (GS V 66 0)
    pushBytes([0x1b, 0x64, 0x04]); // Feed 4 lines
    pushBytes([0x1d, 0x56, 0x42, 0x00]); // Partial Cut

    return new Uint8Array(bytes);
  }

  /**
   * Sends raw payload to Bluetooth printer, or invokes browser print dialog fallback
   */
  public async printToken(data: TokenPrintData): Promise<{ success: boolean; method: 'bluetooth' | 'browser' }> {
    if (this.characteristic) {
      try {
        const payload = this.buildEscPosPayload(data);
        // Write in 100-byte chunks to prevent MTU overflow
        for (let i = 0; i < payload.length; i += 100) {
          const chunk = payload.slice(i, i + 100);
          await this.characteristic.writeValue(chunk);
        }
        return { success: true, method: 'bluetooth' };
      } catch (err) {
        console.warn('[ThermalPrinter] Bluetooth write failed. Falling back to browser print:', err);
      }
    }

    // Browser Print Fallback (Native window.print with 58mm CSS)
    if (typeof window !== 'undefined') {
      window.print();
      return { success: true, method: 'browser' };
    }

    return { success: false, method: 'browser' };
  }
}

export const thermalPrinter = new ThermalPrinterManager();
