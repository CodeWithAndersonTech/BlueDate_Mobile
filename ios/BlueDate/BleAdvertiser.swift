import Foundation
import CoreBluetooth
import React

/**
 iOS advertiser: 16-bit service UUID + GATT token characteristic.

 iOS ignores service-data in advertisements. A 128-bit UUID also eats the
 31-byte legacy packet so localName (the token) is truncated and peers
 submit garbage hashes. GATT is the reliable iOS path.
 */
@objc(BleAdvertiser)
class BleAdvertiser: NSObject, CBPeripheralManagerDelegate {

  private static let serviceShort = CBUUID(string: "B1E5")
  private static let tokenCharShort = CBUUID(string: "B1E6")

  private var peripheralManager: CBPeripheralManager?
  private var pendingToken: String?
  private var startResolve: RCTPromiseResolveBlock?
  private var startReject: RCTPromiseRejectBlock?
  private var addedService = false

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(isSupported:rejecter:)
  func isSupported(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }

  @objc(startAdvertising:token:resolver:rejecter:)
  func startAdvertising(_ _serviceUuid: String,
                        token: String,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    pendingToken = token
    startResolve = resolve
    startReject = reject
    addedService = false

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
    if let mgr = peripheralManager {
      mgr.removeAllServices()
    }
    addedService = false
    resolve(true)
  }

  private func beginAdvertising() {
    guard let mgr = peripheralManager, mgr.state == .poweredOn else { return }
    mgr.stopAdvertising()
    mgr.removeAllServices()
    addedService = false

    let characteristic = CBMutableCharacteristic(
      type: BleAdvertiser.tokenCharShort,
      properties: [.read],
      value: nil,
      permissions: [.readable]
    )
    let service = CBMutableService(type: BleAdvertiser.serviceShort, primary: true)
    service.characteristics = [characteristic]
    mgr.add(service)
  }

  func peripheralManager(_ peripheral: CBPeripheralManager,
                         didAdd service: CBService,
                         error: Error?) {
    if let error = error {
      startReject?("ADV_SERVICE", error.localizedDescription, error)
      startReject = nil
      startResolve = nil
      return
    }
    addedService = true
    peripheral.startAdvertising([
      CBAdvertisementDataServiceUUIDsKey: [BleAdvertiser.serviceShort],
    ])
    startResolve?(true)
    startResolve = nil
    startReject = nil
  }

  func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager,
                                            error: Error?) {
    if let error = error {
      startReject?("ADV_FAILED", error.localizedDescription, error)
      startReject = nil
      startResolve = nil
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager,
                         didReceiveRead request: CBATTRequest) {
    guard request.characteristic.uuid == BleAdvertiser.tokenCharShort,
          let token = pendingToken,
          let data = token.data(using: .utf8) else {
      peripheral.respond(to: request, withResult: .attributeNotFound)
      return
    }
    if request.offset > data.count {
      peripheral.respond(to: request, withResult: .invalidOffset)
      return
    }
    request.value = data.subdata(in: request.offset..<data.count)
    peripheral.respond(to: request, withResult: .success)
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
