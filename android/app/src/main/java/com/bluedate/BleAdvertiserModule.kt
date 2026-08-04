package com.bluedate

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.AdvertisingSet
import android.bluetooth.le.AdvertisingSetCallback
import android.bluetooth.le.AdvertisingSetParameters
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * BLE Advertiser native modulu.
 *
 * Token'i, verilen 16-bit alias'li service UUID altinda "service data" olarak yayinlar.
 * Token 32 byte'a kadar oldugu icin legacy 31-byte reklam paketine sigmayabilir;
 * bu yuzden Android 8+ (API 26) cihazlarda extended advertising (startAdvertisingSet)
 * kullanilir. Daha eski cihazlarda legacy startAdvertising'e geri dusulur.
 */
class BleAdvertiserModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var advertiser: BluetoothLeAdvertiser? = null
    private var legacyCallback: AdvertiseCallback? = null
    private var setCallback: AdvertisingSetCallback? = null

    override fun getName(): String = "BleAdvertiser"

    private fun getAdvertiser(): BluetoothLeAdvertiser? {
        val manager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val adapter: BluetoothAdapter? = manager?.adapter
        if (adapter == null || !adapter.isEnabled) return null
        return adapter.bluetoothLeAdvertiser
    }

    @ReactMethod
    fun isSupported(promise: Promise) {
        val adv = getAdvertiser()
        val manager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val multiAdv = manager?.adapter?.isMultipleAdvertisementSupported ?: false
        promise.resolve(adv != null && multiAdv)
    }

    @ReactMethod
    fun startAdvertising(serviceUuid: String, token: String, promise: Promise) {
        try {
            stopInternal()

            val adv = getAdvertiser()
            if (adv == null) {
                promise.reject("BLE_UNAVAILABLE", "Bluetooth kapali veya advertiser yok.")
                return
            }
            advertiser = adv

            val parcelUuid = ParcelUuid.fromString(serviceUuid)
            val tokenBytes = token.toByteArray(Charsets.UTF_8)

            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .addServiceUuid(parcelUuid)
                .addServiceData(parcelUuid, tokenBytes)
                .build()

            // API 26+: extended advertising ile daha buyuk payload.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val params = AdvertisingSetParameters.Builder()
                    .setLegacyMode(false)
                    .setConnectable(false)
                    .setScannable(true)
                    .setInterval(AdvertisingSetParameters.INTERVAL_MEDIUM)
                    .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_MEDIUM)
                    .build()

                setCallback = object : AdvertisingSetCallback() {
                    override fun onAdvertisingSetStarted(
                        advertisingSet: AdvertisingSet?,
                        txPower: Int,
                        status: Int
                    ) {
                        if (status == ADVERTISE_SUCCESS) {
                            promise.resolve(true)
                        } else {
                            promise.reject("ADV_FAILED", "Extended advertising basarisiz: $status")
                        }
                    }
                }
                adv.startAdvertisingSet(params, data, null, null, null, setCallback)
            } else {
                // Legacy fallback (token kisa degilse paket sigmayabilir).
                val settings = AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
                    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                    .setConnectable(false)
                    .build()

                legacyCallback = object : AdvertiseCallback() {
                    override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                        promise.resolve(true)
                    }

                    override fun onStartFailure(errorCode: Int) {
                        promise.reject("ADV_FAILED", "Legacy advertising basarisiz: $errorCode")
                    }
                }
                adv.startAdvertising(settings, data, legacyCallback)
            }
        } catch (e: SecurityException) {
            promise.reject("PERMISSION", "BLUETOOTH_ADVERTISE izni yok.", e)
        } catch (e: Exception) {
            promise.reject("ADV_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        try {
            stopInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ADV_STOP_ERROR", e.message, e)
        }
    }

    private fun stopInternal() {
        val adv = advertiser ?: getAdvertiser() ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && setCallback != null) {
                adv.stopAdvertisingSet(setCallback)
            }
            if (legacyCallback != null) {
                adv.stopAdvertising(legacyCallback)
            }
        } catch (_: SecurityException) {
            // izin yoksa sessizce gec
        } finally {
            setCallback = null
            legacyCallback = null
        }
    }
}
