/**
 * FlowDockTilePlugin — NSDockTilePlugIn implementation
 *
 * The Dock loads this plugin even when Flow isn't running.
 * It reads a shared file to determine which icon to display:
 *   - File missing/empty → default (Liquid Glass from Assets.car)
 *   - File contains absolute path → custom icon
 *
 * Shared file location:
 *   ~/Library/Application Support/Flow/dock-tile-icon-path
 */

#import <Cocoa/Cocoa.h>

static NSString * const FlowDockTileUpdateNotification = @"dev.iamevan.flow.dock-tile.update";

@interface FlowDockTilePlugin : NSObject <NSDockTilePlugIn>
@property (nonatomic, strong) NSDockTile *dockTile;
 - (void)handleDockTileUpdate:(NSNotification *)notification;
 - (void)updateDockTile;
@end

@implementation FlowDockTilePlugin

- (void)setDockTile:(NSDockTile *)dockTile {
    _dockTile = dockTile;

    NSDistributedNotificationCenter *center = [NSDistributedNotificationCenter defaultCenter];
    [center removeObserver:self];

    if (!dockTile) {
        return;
    }

    [center addObserver:self
               selector:@selector(handleDockTileUpdate:)
                   name:FlowDockTileUpdateNotification
                 object:nil
     suspensionBehavior:NSNotificationSuspensionBehaviorDeliverImmediately];

    [self updateDockTile];
}

- (void)handleDockTileUpdate:(NSNotification *)notification {
    (void)notification;
    [self updateDockTile];
}

- (void)updateDockTile {
    if (![NSThread isMainThread]) {
        dispatch_async(dispatch_get_main_queue(), ^{ [self updateDockTile]; });
        return;
    }
    if (!self.dockTile) return;

    // Resolve the shared file path
    NSString *appSupport = [NSSearchPathForDirectoriesInDomains(
        NSApplicationSupportDirectory, NSUserDomainMask, YES) firstObject];
    NSString *sharedFile = [appSupport stringByAppendingPathComponent:@"Flow/dock-tile-icon-path"];

    // Read the icon path from the shared file
    NSString *iconPath = [NSString stringWithContentsOfFile:sharedFile
                                                   encoding:NSUTF8StringEncoding
                                                      error:nil];

    // Trim whitespace/newlines
    iconPath = [iconPath stringByTrimmingCharactersInSet:
        [NSCharacterSet whitespaceAndNewlineCharacterSet]];

    if (!iconPath || iconPath.length == 0) {
        // No custom icon — clear content view so the bundle icon (Liquid Glass) renders
        [self.dockTile setContentView:nil];
        [self.dockTile display];
        return;
    }

    // Load the custom icon
    NSImage *image = [[NSImage alloc] initWithContentsOfFile:iconPath];
    if (!image) {
        // Failed to load — fall back to default
        [self.dockTile setContentView:nil];
        [self.dockTile display];
        return;
    }

    // Match Dock expectations: sized to the tile, on the main thread.
    NSSize tileSize = self.dockTile.size;
    NSImageView *imageView =
        [[NSImageView alloc] initWithFrame:NSMakeRect(0, 0, tileSize.width, tileSize.height)];
    imageView.wantsLayer = YES;
    imageView.image = image;
    [self.dockTile setContentView:imageView];
    [self.dockTile display];
}

- (void)dealloc {
    [[NSDistributedNotificationCenter defaultCenter] removeObserver:self];
}

@end
