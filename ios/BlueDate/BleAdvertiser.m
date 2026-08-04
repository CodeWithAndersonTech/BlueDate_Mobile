// React Native kopru tanimi - BleAdvertiser (iOS).
// Bu dosyayi Xcode target'ina ekleyin. Swift modulunu RN'e gorunur kilar.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BleAdvertiser, NSObject)

RCT_EXTERN_METHOD(isSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startAdvertising:(NSString *)serviceUuid
                  token:(NSString *)token
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopAdvertising:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
