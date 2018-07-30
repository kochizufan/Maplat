//
//  MaplatView.h
//  MaplatView
//
//  Created by Takashi Irie on 2018/07/03.
//  Copyright © 2018 TileMapJp. All rights reserved.
//

#import <UIKit/UIKit.h>

@protocol MaplatViewDelegate;

@interface MaplatView : UIView

@property (nonatomic, readonly) UIWebView *webView;
@property (nonatomic, assign) id <MaplatViewDelegate> delegate;

+ (void)configure;

- (instancetype)initWithFrame:(CGRect)frame appID:(NSString *)appID setting:(NSDictionary *)setting;

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId stringData:(NSString *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId stringData:(NSString *)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId longData:(long)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId longData:(long)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId doubleData:(double)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId doubleData:(double)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId arrayData:(NSArray *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId arrayData:(NSArray *)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId dictData:(NSDictionary *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId dictData:(NSDictionary *)markerData iconUrl:(NSString *) iconUrl;

- (void)clearMarker;
- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy;
- (void)changeMap:(NSString *)mapID;

- (void)setViewpointWithLatitude:(double)latitude longitude:(double)longitude;
- (void)setDirection:(double)direction;
- (void)setRotation:(double)rotate;

- (void)addLineWithLngLat:(NSArray *)lnglats stroke:(NSDictionary *)stroke;
- (void)clearLine;

- (void)currentMapID:(void (^)(NSString *))callback;

@end

@protocol MaplatViewDelegate <NSObject>
@optional
- (void)onReady;
- (void)onClickMarkerWithMarkerId:(long)markerId markerData:(id)markerData;
- (void)onChangeViewpointWithLatitude:(double)latitude longitude:(double)longitude zoom:(double)zoom direction:(double)direction rotation:(double)rotation;
- (void)onOutOfMap;
- (void)onClickMapWithLatitude:(double)latitude longitude:(double)longitude;
@end

