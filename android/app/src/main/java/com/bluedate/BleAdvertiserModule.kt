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
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * BLE Advertiser native modulu.
 *
 * Presence token (~16 char) service-data olarak yayinlanir.
 * iOS tarayicilar extended advertising'i guvenilir sekilde gormedigi icin
 * once LEGACY mode denenir (16-bit UUID alias + kisa token 31 byte'a sigar).
 * Legacy basarisiz olursa extended'e dusulur.
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

            // Prefer legacy so iOS / older scanners can see us.
            startLegacy(adv, data, promise) {
                Log.w(TAG, "Legacy advertise failed, trying extended")
                startExtended(adv, data, promise)
            }
        } catch (e: SecurityException) {
            promise.reject("PERMISSION", "BLUETOOTH_ADVERTISE izni yok.", e)
        } catch (e: Exception) {
            promise.reject("ADV_ERROR", e.message, e)
        }
    }

    private fun startLegacy(
        adv: BluetoothLeAdvertiser,
        data: AdvertiseData,
        promise: Promise,
        onFailure: () -> Unit,
    ) {
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .setTimeout(0)
            .build()

        legacyCallback = object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                promise.resolve(true)
            }

            override fun onStartFailure(errorCode: Int) {
                legacyCallback = null
                // DATA_TOO_LARGE / INTERNAL — try extended if available.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    onFailure()
                } else {
                    promise.reject("ADV_FAILED", "Legacy advertising basarisiz: $errorCode")
                }
            }
        }
        adv.startAdvertising(settings, data, legacyCallback)
    }

    private fun startExtended(
        adv: BluetoothLeAdvertiser,
        data: AdvertiseData,
        promise: Promise,
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("ADV_FAILED", "Extended advertising desteklenmiyor.")
            return
        }

        val params = AdvertisingSetParameters.Builder()
            .setLegacyMode(true) // keep legacy PDU even via AdvertisingSet API
            .setConnectable(false)
            .setScannable(true)
            .setInterval(AdvertisingSetParameters.INTERVAL_HIGH)
            .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_HIGH)
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
                    promise.reject("ADV_FAILED", "Advertising basarisiz: $status")
                }
            }
        }
        adv.startAdvertisingSet(params, data, null, null, null, setCallback)
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

    companion object {
        private const val TAG = "BleAdvertiser"
    }
}
