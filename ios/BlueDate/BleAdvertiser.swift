import Foundation
import CoreBluetooth
import React

/**
 BLE Advertiser - iOS (CoreBluetooth CBPeripheralManager).

 ONEMLI iOS KISITLARI:
 - iOS, foreground'da service UUID + (sinirli) local name yayinlayabilir.
 - CBAdvertisementDataServiceDataKey foreground'da YOK SAYILIR; iOS yalnizca
   CBAdvertisementDataServiceUUIDsKey ve CBAdvertisementDataLocalNameKey'i destekler.
 - Bu nedenle ham token'i iOS reklam paketine gomemeyiz; pratikte iOS<->iOS ve
   Android->iOS keşfi icin GATT karakteristigi okunarak token alinmasi gerekir.
 - Arka planda service UUID "overflow" alanina dusurulur; yalnizca baska iOS
   cihazlar bunu cozebilir. Bu yuzden tasarim foreground-first'tur.

 Bu modul MVP icin token'i local name olarak yayinlamayi dener (kisa token gerekir).
 Daha saglam cozum: bir GATT server acip token'i okunabilir karakteristik yapmaktir.

 KURULUM: Bu dosyayi ve BleAdvertiser.m kopru dosyasini Xcode target'ina ekleyin
 (Xcode > target > Build Phases > Compile Sources). Bridging header gerekirse
 React/RCTBridgeModule.h import edilmelidir.
 */
@objc(BleAdvertiser)
class BleAdvertiser: NSObject, CBPeripheralManagerDelegate {

  private var peripheralManager: CBPeripheralManager?
  private var pendingServiceUuid: String?
  private var pendingToken: String?
  private var startResolve: RCTPromiseResolveBlock?
  private var startReject: RCTPromiseRejectBlock?

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(isSupported:rejecter:)
  func isSupported(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    // CBPeripheralManager iOS'ta mevcut; gercek destek state ile anlasilir.
    resolve(true)
  }

  @objc(startAdvertising:token:resolver:rejecter:)
  func startAdvertising(_ serviceUuid: String,
                        token: String,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    pendingServiceUuid = serviceUuid
    pendingToken = token
    startResolve = resolve
    startReject = reject

    if peripheralManager == nil {
      peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    } else if peripheralManager?.state == .poweredOn {
      beginAdvertising()
    }
  }

  @objc(stopAdvertising:rejecter:)
  func stopAdvertising(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    peripheralManager?.stopAdvertising()
    resolve(true)
  }

  private func beginAdvertising() {
    guard let uuid = pendingServiceUuid, let token = pendingToken else { return }
    let serviceCBUUID = CBUUID(string: uuid)

    // iOS service-data'yi yok saydigi icin token'i local name olarak veriyoruz.
    // (Token kisa degilse kesilebilir; production'da GATT karakteristigi onerilir.)
    let advData: [String: Any] = [
      CBAdvertisementDataServiceUUIDsKey: [serviceCBUUID],
      CBAdvertisementDataLocalNameKey: token
    ]
    peripheralManager?.startAdvertising(advData)
    startResolve?(true)
    startResolve = nil
    startReject = nil
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn {
      beginAdvertising()
    } else if peripheral.state == .poweredOff {
      startReject?("BLE_OFF", "Bluetooth kapali.", nil)
      startReject = nil
      startResolve = nil
    }
  }
}
