#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>

@class RCTAppDependencyProvider;

@interface AppDelegate : RCTAppDelegate

@property (nonatomic, strong) RCTAppDependencyProvider *dependencyProvider;

@end